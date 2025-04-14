import { create } from 'zustand'

// 设施类型
export type FacilityType = 'university' | 'bank' | 'restaurant' | 'supermarket' | 'mall' | 'attraction' | 'park'

// 设施信息
export interface Facility {
  id: string
  name: string
  type: FacilityType
  position: { lat: number; lng: number }
  distance: number // 千米
  drivingTime: number // 分钟
}

// 位置坐标
export interface LatLng {
  lat: number
  lng: number
}

// 地址信息
export interface Address {
  display_name: string
  lat: number
  lng: number
}

// 缓存的设施数据
interface FacilitiesCache {
  key: string
  facilities: Facility[]
  timestamp: number
}

interface MapState {
  userLocation: LatLng | null
  searchedLocation: LatLng | null
  searchedAddress: string | null
  selectedFacilityTypes: FacilityType[]
  searchRadius: number // 千米
  facilities: Facility[]
  isLoading: boolean
  error: string | null
  facilitiesCache: FacilitiesCache[] // 设施数据缓存
  
  // Actions
  setUserLocation: (location: LatLng) => void
  setSearchedLocation: (location: LatLng, address: string) => void
  setSelectedFacilityTypes: (types: FacilityType[]) => void
  toggleFacilityType: (type: FacilityType) => void
  setSearchRadius: (radius: number) => void
  setFacilities: (facilities: Facility[]) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  resetFacilities: () => void
  
  // 缓存相关方法
  getCachedFacilities: (key: string) => Facility[] | null
  setCachedFacilities: (key: string, facilities: Facility[]) => void
  clearCache: () => void
}

// 缓存过期时间（24小时）
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

export const useMapStore = create<MapState>((set, get) => ({
  userLocation: null,
  searchedLocation: null,
  searchedAddress: null,
  selectedFacilityTypes: [],
  searchRadius: 2, // 默认2公里
  facilities: [],
  isLoading: false,
  error: null,
  facilitiesCache: [],
  
  setUserLocation: (location) => set({ userLocation: location }),
  
  setSearchedLocation: (location, address) => 
    set({ searchedLocation: location, searchedAddress: address }),
  
  setSelectedFacilityTypes: (types) => 
    set({ selectedFacilityTypes: types }),
  
  toggleFacilityType: (type) => set((state) => {
    const types = state.selectedFacilityTypes
    return {
      selectedFacilityTypes: types.includes(type)
        ? types.filter(t => t !== type)
        : [...types, type]
    }
  }),
  
  setSearchRadius: (radius) => set({ searchRadius: radius }),
  
  setFacilities: (facilities) => set({ facilities }),
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  resetFacilities: () => set({ facilities: [] }),
  
  // 获取缓存的设施数据
  getCachedFacilities: (key) => {
    const cache = get().facilitiesCache.find(c => c.key === key);
    
    if (!cache) return null;
    
    // 检查缓存是否过期
    if (Date.now() - cache.timestamp > CACHE_EXPIRATION) return null;
    
    console.log(`使用缓存的设施数据: ${key}`);
    return cache.facilities;
  },
  
  // 设置缓存
  setCachedFacilities: (key, facilities) => set((state) => {
    // 移除旧的相同key的缓存
    const filteredCache = state.facilitiesCache.filter(c => c.key !== key);
    
    // 添加新缓存
    const newCache = {
      key,
      facilities,
      timestamp: Date.now()
    };
    
    console.log(`缓存设施数据: ${key}, 数量: ${facilities.length}`);
    
    return {
      facilitiesCache: [...filteredCache, newCache]
    };
  }),
  
  // 清除所有缓存
  clearCache: () => set({ facilitiesCache: [] })
})) 