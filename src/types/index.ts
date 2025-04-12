// 设施类型
export type FacilityType = 'university' | 'bank' | 'restaurant' | 'supermarket' | 'mall' | 'attraction' | 'park'

// 设施图标配置
export interface FacilityConfig {
  label: string
  color: string
  icon: string
}

// 设施类型配置映射
export const facilityConfigs: Record<FacilityType, FacilityConfig> = {
  university: { 
    label: '大学', 
    color: '#4285F4', 
    icon: 'school' 
  },
  bank: { 
    label: '银行', 
    color: '#0F9D58', 
    icon: 'building-bank' 
  },
  restaurant: { 
    label: '餐厅', 
    color: '#DB4437', 
    icon: 'utensils' 
  },
  supermarket: { 
    label: '超市', 
    color: '#F4B400', 
    icon: 'shopping-cart' 
  },
  mall: { 
    label: '购物中心', 
    color: '#AB47BC', 
    icon: 'shopping-bag' 
  },
  attraction: { 
    label: '景点', 
    color: '#00ACC1', 
    icon: 'landmark' 
  },
  park: { 
    label: '公园', 
    color: '#7CB342', 
    icon: 'trees' 
  },
}

// 地图标记点类型
export interface MapMarker {
  id: string
  position: [number, number]
  type: 'user' | 'search' | FacilityType
  name: string
  distance?: number
  drivingTime?: number
} 