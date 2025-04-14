import { Marker, Popup } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { useMapStore, Facility } from '../../store/mapStore';
import { facilityConfigs } from '../../types';
import { useFacilities } from '../../hooks/useFacilities';

// 创建自定义图标 - 使用DivIcon可以更好地应用CSS样式
const createCustomIcon = (type: string, color: string) => {
  // 为银行类型创建特殊的样式
  const isBank = type === 'bank';
  const iconPath = `/icons/${facilityConfigs[type].icon}.svg`;
  
  const iconHtml = `<div style="background-color: ${isBank ? '#f0fff0' : 'white'}; border: 2px solid ${color}; border-radius: 50%; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center;">
    <img src="${iconPath}" style="width: 20px; height: 20px;" alt="${type}" />
  </div>`;
  
  console.log(`创建${type}图标，颜色: ${color}, 图标路径: ${iconPath}`);
  
  return new DivIcon({
    html: iconHtml,
    className: `facility-icon facility-icon-${type}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

export function FacilityMarkers() {
  // 使用hook获取设施数据
  useFacilities();
  
  // 从store中获取设施数据和选中的设施类型
  const { facilities, selectedFacilityTypes, isLoading, searchedLocation } = useMapStore();
  
  console.log('FacilityMarkers组件渲染', {
    搜索位置: searchedLocation ? `[${searchedLocation.lat.toFixed(6)}, ${searchedLocation.lng.toFixed(6)}]` : 'null',
    设施总数: facilities.length,
    选中类型数: selectedFacilityTypes.length,
    选中类型: selectedFacilityTypes,
    各类型设施数量: Object.keys(facilityConfigs).reduce((acc, type) => {
      acc[type] = facilities.filter(f => f.type === type).length;
      return acc;
    }, {} as Record<string, number>)
  });
  
  // 按类型过滤设施
  const filteredFacilities = facilities.filter(
    facility => selectedFacilityTypes.includes(facility.type)
  );

  console.log('设施标记数据:', { 
    总设施数: facilities.length,
    已过滤设施数: filteredFacilities.length,
    选中类型: selectedFacilityTypes,
    银行数量: facilities.filter(f => f.type === 'bank').length
  });

  if (filteredFacilities.length === 0 && !isLoading) {
    console.log('没有找到符合条件的设施');
    return null;
  }

  return (
    <>
      {filteredFacilities.map((facility) => {
        console.log(`渲染设施标记: ${facility.name}, 类型: ${facility.type}, 位置: [${facility.position.lat.toFixed(6)}, ${facility.position.lng.toFixed(6)}]`);
        
        const icon = createCustomIcon(facility.type, facilityConfigs[facility.type].color);
        
        return (
        <Marker
          key={facility.id}
          position={[facility.position.lat, facility.position.lng]}
          icon={icon}
        >
          <Popup>
            <div className="facility-popup">
              <h3 className="text-sm font-medium">{facility.name}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                类型: {facilityConfigs[facility.type].label}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                距离: {facility.distance} 公里
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                驾车时间: 约 {facility.drivingTime} 分钟
              </p>
            </div>
          </Popup>
        </Marker>
        );
      })}
    </>
  );
} 