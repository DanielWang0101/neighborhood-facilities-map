import { useEffect } from 'react';
import { useMapStore, FacilityType, Facility, LatLng } from '../store/mapStore';
import { fetchFacilitiesFromOverpass } from '../services/overpassApi';

// 短暂延迟（仅用于UI反馈）
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 生成缓存键
function generateCacheKey(
  location: LatLng, 
  radius: number, 
  types: FacilityType[]
): string {
  // 确保位置取小数点后5位，减少浮点精度问题
  const lat = location.lat.toFixed(5);
  const lng = location.lng.toFixed(5);
  // 排序类型，确保相同组合生成相同的键
  const sortedTypes = [...types].sort().join('-');
  
  return `${lat},${lng}_${radius}_${sortedTypes}`;
}

// useFacilities hook
export function useFacilities() {
  const {
    searchedLocation,
    searchRadius,
    selectedFacilityTypes,
    facilities,
    setFacilities,
    setIsLoading,
    setError,
    getCachedFacilities,
    setCachedFacilities
  } = useMapStore();
  
  // 当搜索位置、半径或设施类型变化时，获取设施数据
  useEffect(() => {
    console.log('useFacilities useEffect 触发', { 
      hasLocation: !!searchedLocation,
      location: searchedLocation ? `[${searchedLocation.lat.toFixed(6)}, ${searchedLocation.lng.toFixed(6)}]` : 'null',
      radius: searchRadius,
      selectedTypes: selectedFacilityTypes,
      当前设施数: facilities.length
    });
    
    async function fetchFacilities() {
      // 检查必要条件
      if (!searchedLocation) {
        console.warn('无法获取设施: 没有搜索位置');
        setFacilities([]);
        return;
      }
      
      if (selectedFacilityTypes.length === 0) {
        console.log('未选择任何设施类型，清空设施数据');
        setFacilities([]);
        return;
      }
      
      try {
        // 生成缓存键
        const cacheKey = generateCacheKey(
          searchedLocation,
          searchRadius,
          selectedFacilityTypes
        );
        
        console.log('检查缓存，键值:', cacheKey);
        
        // 尝试从缓存获取数据
        let cachedData = null;
        try {
          cachedData = getCachedFacilities(cacheKey);
        } catch (cacheError) {
          console.error('获取缓存数据失败:', cacheError);
          // 继续执行，不使用缓存
        }
        
        if (cachedData && cachedData.length > 0) {
          console.log('使用缓存的设施数据', { count: cachedData.length });
          setFacilities(cachedData);
          return;
        }
        
        // 没有缓存或缓存失效，从API获取数据
        setIsLoading(true);
        
        // 短暂延迟，确保UI能够显示加载状态
        await delay(300);
        
        console.log('开始从Overpass API获取真实设施数据');
        
        try {
          // 获取真实设施数据
          const realFacilities = await fetchFacilitiesFromOverpass(
            searchedLocation,
            searchRadius,
            selectedFacilityTypes
          );
          
          // 缓存获取的数据
          try {
            setCachedFacilities(cacheKey, realFacilities);
            console.log('成功缓存设施数据');
          } catch (cacheError) {
            console.error('缓存设施数据失败:', cacheError);
            // 继续执行，不影响主流程
          }
          
          // 设置设施数据
          setFacilities(realFacilities);
          
          console.log(`成功获取${realFacilities.length}个真实设施数据`);
        } catch (apiError) {
          console.error('从API获取设施数据失败:', apiError);
          setError(`获取设施数据失败: ${apiError instanceof Error ? apiError.message : '未知错误'}`);
          
          // 设置空数据
          setFacilities([]);
        }
      } catch (error) {
        console.error('处理设施数据过程中出错:', error);
        setError('获取真实设施数据失败，请稍后重试');
        
        // 设置空数据
        setFacilities([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFacilities();
  }, [searchedLocation, searchRadius, selectedFacilityTypes, setFacilities, setIsLoading, setError]); 
  
  return { facilities };
} 