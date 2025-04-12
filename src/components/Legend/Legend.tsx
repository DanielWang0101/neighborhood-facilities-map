import { useMapStore } from '../../store/mapStore'
import { facilityConfigs } from '../../types'

export function Legend() {
  const { facilities, searchedAddress, selectedFacilityTypes } = useMapStore()
  
  // 按类型分组设施
  const facilitiesByType = facilities.reduce((acc, facility) => {
    if (!acc[facility.type]) {
      acc[facility.type] = []
    }
    acc[facility.type].push(facility)
    return acc
  }, {} as Record<string, typeof facilities>)
  
  // 检查是否有设施
  const hasFacilities = facilities.length > 0
  
  if (!hasFacilities) {
    return null // 没有设施时不显示图例
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
      
      {selectedFacilityTypes.map((type) => {
        const facilities = facilitiesByType[type] || []
        if (facilities.length === 0) return null
        
        const config = facilityConfigs[type]
        
        return (
          <div key={type} className="mb-4">
            <div className="flex items-center mb-2">
              <span 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: config.color }}
              ></span>
              <h3 className="font-medium">{config.label}</h3>
            </div>
            
            <ul className="space-y-2 pl-5">
              {facilities.map((facility) => (
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
          </div>
        )
      })}
    </div>
  )
} 