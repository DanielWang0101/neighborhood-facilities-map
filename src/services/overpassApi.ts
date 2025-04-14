import { LatLng, FacilityType, Facility } from '../store/mapStore';
import { facilityConfigs } from '../types';

// 计算两点间距离（公里）
function calculateDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371; // 地球半径（公里）
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// OSM标签映射
const facilityTypeToOsmTag: Record<FacilityType, { key: string, values: string[] }> = {
  university: { key: 'amenity', values: ['university', 'college', 'school'] },
  bank: { key: 'amenity', values: ['bank', 'atm'] },
  restaurant: { key: 'amenity', values: ['restaurant', 'fast_food', 'cafe'] },
  supermarket: { key: 'shop', values: ['supermarket', 'grocery'] },
  mall: { key: 'shop', values: ['mall', 'department_store'] },
  attraction: { key: 'tourism', values: ['attraction', 'museum', 'gallery'] },
  park: { key: 'leisure', values: ['park', 'garden'] }
};

// OSM标签反向映射到应用设施类型
function osmTagToFacilityType(tags: Record<string, string>): FacilityType | null {
  for (const [facilityType, mapping] of Object.entries(facilityTypeToOsmTag)) {
    if (tags[mapping.key] && mapping.values.includes(tags[mapping.key])) {
      return facilityType as FacilityType;
    }
  }
  return null;
}

// 构建Overpass QL查询
function buildOverpassQuery(location: LatLng, radius: number, types: FacilityType[]): string {
  const radiusInMeters = radius * 1000;
  
  // 构建查询条件
  const conditions = types.flatMap(type => {
    const mapping = facilityTypeToOsmTag[type];
    return mapping.values.map(value => 
      `node["${mapping.key}"="${value}"](around:${radiusInMeters},${location.lat},${location.lng});
       way["${mapping.key}"="${value}"](around:${radiusInMeters},${location.lat},${location.lng});
       relation["${mapping.key}"="${value}"](around:${radiusInMeters},${location.lat},${location.lng});`
    );
  }).join('\n');
  
  // 完整查询
  return `
    [out:json][timeout:25];
    (
      ${conditions}
    );
    out body;
    >;
    out skel qt;
  `;
}

// 解析OSM节点为设施对象
function parseOsmElement(element: any, searchLocation: LatLng): Facility | null {
  // 只处理有标签的元素
  if (!element.tags) return null;
  
  // 尝试映射到设施类型
  const facilityType = osmTagToFacilityType(element.tags);
  if (!facilityType) return null;
  
  // 确定位置坐标
  let position: LatLng;
  if (element.lat && element.lon) {
    position = { lat: element.lat, lng: element.lon };
  } else if (element.center) {
    position = { lat: element.center.lat, lng: element.center.lon };
  } else {
    return null; // 没有位置信息的元素不处理
  }
  
  // 计算距离
  const distance = calculateDistance(searchLocation, position);
  
  // 估算驾车时间（简单假设平均速度为30km/h）
  const drivingTime = Math.round(distance / 30 * 60);
  
  return {
    id: `osm-${element.type}-${element.id}`,
    name: element.tags.name || facilityConfigs[facilityType].label,
    type: facilityType,
    position,
    distance: Number(distance.toFixed(1)),
    drivingTime
  };
}

// 请求频率限制
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 5; // 每分钟最多5个请求

async function applyRateLimit(): Promise<void> {
  const now = Date.now();
  // 移除超过1分钟的记录
  const oneMinuteAgo = now - 60 * 1000;
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }
  
  // 检查是否超过限制
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    // 计算需要等待的时间
    const oldestRequest = requestTimestamps[0];
    const waitTime = oldestRequest + 60 * 1000 - now;
    
    console.log(`达到请求频率限制，等待${Math.ceil(waitTime/1000)}秒...`);
    
    // 等待直到可以发送下一个请求
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // 记录此次请求
  requestTimestamps.push(now);
}

// 获取设施数据的主函数
export async function fetchFacilitiesFromOverpass(
  location: LatLng,
  radius: number,
  types: FacilityType[],
  retries = 2
): Promise<Facility[]> {
  try {
    // 应用请求频率限制
    await applyRateLimit();
    
    const query = buildOverpassQuery(location, radius, types);
    
    // 设置请求参数
    const params = new URLSearchParams({
      data: query
    });
    
    // 发送请求
    console.log('发送Overpass API请求...');
    const response = await fetch(`https://overpass-api.de/api/interpreter?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Neighborhood-Facilities-Map/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Overpass API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 解析结果
    const facilities = data.elements
      .map((element: any) => parseOsmElement(element, location))
      .filter(Boolean) // 移除null结果
      // 按距离排序
      .sort((a: Facility, b: Facility) => a.distance - b.distance);
    
    console.log(`从Overpass API获取到${facilities.length}个设施`);
    return facilities;
    
  } catch (error) {
    if (retries > 0) {
      console.log(`API请求失败，${retries}秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, retries * 1000));
      return fetchFacilitiesFromOverpass(location, radius, types, retries - 1);
    }
    console.error('获取设施数据出错:', error);
    throw error;
  }
} 