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

interface MapState {
  userLocation: LatLng | null
  searchedLocation: LatLng | null
  searchedAddress: string | null
  selectedFacilityTypes: FacilityType[]
  searchRadius: number // 千米
  facilities: Facility[]
  isLoading: boolean
  error: string | null
  
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
}

export const useMapStore = create<MapState>((set) => ({
  userLocation: null,
  searchedLocation: null,
  searchedAddress: null,
  selectedFacilityTypes: [],
  searchRadius: 2, // 默认2公里
  facilities: [],
  isLoading: false,
  error: null,
  
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
  
  resetFacilities: () => set({ facilities: [] })
})) 