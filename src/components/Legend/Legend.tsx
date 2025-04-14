import { useMapStore } from '../../store/mapStore'
import { facilityConfigs } from '../../types'
import { useFacilities } from '../../hooks/useFacilities'
import { useEffect } from 'react'

export function Legend() {
  const { 
    facilities, 
    searchedAddress, 
    selectedFacilityTypes, 
    searchedLocation 
  } = useMapStore()
  
  // 只在有搜索位置时加载设施数据
  // 不再直接调用useFacilities()，而是通过useEffect控制
  useEffect(() => {
    // 组件挂载时不执行任何操作
    // useFacilities会在MapContainer组件中被调用
  }, []);
  
  // 按类型分组设施
  const facilitiesByType = facilities.reduce((acc, facility) => {
    if (!acc[facility.type]) {
      acc[facility.type] = []
    }
    acc[facility.type].push(facility)
    return acc
  }, {} as Record<string, typeof facilities>)
  
  // 检查是否有搜索地址和选中的设施类型
  const hasSearchInfo = !!searchedAddress;
  const hasSelectedTypes = selectedFacilityTypes.length > 0;
  
  // 如果没有搜索地址，不显示图例
  if (!hasSearchInfo) {
    return (
      <div className="w-72 h-full bg-white dark:bg-gray-900 shadow-md p-4 overflow-y-auto flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="mb-2 text-lg">暂无图例</p>
          <p className="text-sm">请先在左侧面板搜索地址</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-72 h-full bg-white dark:bg-gray-900 shadow-md p-4 overflow-y-auto">
      <h2 className="text-lg font-bold mb-2">图例</h2>
      
      {searchedAddress && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">地址</p>
          <p className="text-sm font-medium">{searchedAddress}</p>
        </div>
      )}
      
      {!hasSelectedTypes && (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          请在左侧面板选择设施类型
        </div>
      )}
      
      {selectedFacilityTypes.map((type) => {
        const typeFacilities = facilitiesByType[type] || [];
        const config = facilityConfigs[type];
        
        return (
          <div key={type} className="mb-4">
            <div className="flex items-center mb-2">
              <span 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: config.color }}
              ></span>
              <h3 className="font-medium">{config.label}</h3>
              <span className="text-xs text-gray-500 ml-2">
                ({typeFacilities.length}个)
              </span>
            </div>
            
            {typeFacilities.length > 0 ? (
              <ul className="space-y-2 pl-5">
                {typeFacilities.map((facility) => (
                  <li key={facility.id} className="text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{facility.name}</span>
                      <span>{facility.distance.toFixed(1)} 公里</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      驾车时间：约 {facility.drivingTime} 分钟
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 pl-5 italic">
                搜索范围内未找到该类型设施
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
} 