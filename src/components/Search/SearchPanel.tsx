import { useState } from 'react'
import { useMapStore, FacilityType } from '../../store/mapStore'
import { facilityConfigs } from '../../types'

export function SearchPanel() {
  const { 
    searchRadius, 
    setSearchRadius, 
    selectedFacilityTypes, 
    toggleFacilityType,
    setSelectedFacilityTypes,
    setSearchedLocation,
    searchedLocation,
    setIsLoading,
    setError
  } = useMapStore()
  
  const [address, setAddress] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  
  // 搜索地址
  const searchAddress = async () => {
    if (!address.trim()) return
    
    setIsLoading(true)
    setSuggestions([])
    
    try {
      // 使用Nominatim API进行地理编码
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=us,ca`
      )
      
      if (!response.ok) throw new Error('搜索地址失败')
      
      const data = await response.json()
      
      if (data.length > 0) {
        // 直接使用第一个结果
        const result = data[0]
        setSearchedLocation(
          { lat: parseFloat(result.lat), lng: parseFloat(result.lon) },
          result.display_name
        )
        setAddress(result.display_name)
      } else {
        setError('未找到地址，请尝试更具体的搜索')
      }
    } catch (error) {
      setError('搜索地址时出错')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // 获取地址建议
  const getSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us,ca&limit=5`
      )
      
      if (!response.ok) throw new Error('获取地址建议失败')
      
      const data = await response.json()
      setSuggestions(data)
    } catch (error) {
      console.error(error)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAddress(value)
    getSuggestions(value)
  }
  
  const selectSuggestion = (suggestion: any) => {
    setAddress(suggestion.display_name)
    setSuggestions([])
    setSearchedLocation(
      { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) },
      suggestion.display_name
    )
  }
  
  const selectAllFacilities = () => {
    if (!searchedLocation) {
      setError('请先搜索地址，然后再选择设施类型')
      return
    }
    setSelectedFacilityTypes(Object.keys(facilityConfigs) as FacilityType[])
  }
  
  const clearFacilities = () => {
    setSelectedFacilityTypes([])
  }
  
  const handleToggleFacility = (type: FacilityType) => {
    if (!searchedLocation && !selectedFacilityTypes.includes(type)) {
      setError('请先搜索地址，然后再选择设施类型')
      return
    }
    toggleFacilityType(type)
  }
  
  return (
    <div className="w-80 h-full p-4 bg-white dark:bg-gray-900 shadow-md overflow-y-auto">
      <h1 className="text-xl font-bold mb-4">周边设施标注</h1>
      
      {/* 地址搜索 */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">地址搜索</h2>
        <div className="relative">
          <input
            type="text"
            value={address}
            onChange={handleInputChange}
            placeholder="搜索北美地址..."
            className="w-full p-2 border rounded-md mb-2"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  {suggestion.display_name}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={searchAddress}
            className="w-full bg-primary text-white p-2 rounded-md hover:bg-primary/90"
          >
            搜索
          </button>
          
          {!searchedLocation && (
            <div className="mt-2 p-2 text-sm bg-blue-50 border border-blue-200 rounded text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800">
              第一步：请先搜索地址
            </div>
          )}
        </div>
      </div>
      
      {/* 范围设置 */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">搜索范围</h2>
        <div className="flex items-center justify-between">
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={searchRadius}
            onChange={(e) => setSearchRadius(parseInt(e.target.value))}
            className="w-full"
          />
          <span className="ml-2 font-medium">{searchRadius} 公里</span>
        </div>
      </div>
      
      {/* 设施类型选择 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-medium">设施类型</h2>
          <div className="flex gap-2">
            <button
              onClick={selectAllFacilities}
              className="text-xs bg-primary/20 text-primary px-2 py-1 rounded"
              disabled={!searchedLocation}
            >
              全选
            </button>
            <button
              onClick={clearFacilities}
              className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
            >
              清除
            </button>
          </div>
        </div>
        
        {!searchedLocation && (
          <div className="p-2 mb-2 text-sm bg-yellow-50 border border-yellow-200 rounded text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800">
            第二步：设置地址后，选择设施类型
          </div>
        )}
        
        <div className="space-y-2">
          {(Object.keys(facilityConfigs) as FacilityType[]).map((type) => {
            const config = facilityConfigs[type]
            return (
              <div key={type} className="flex items-center">
                <input
                  type="checkbox"
                  id={`facility-${type}`}
                  checked={selectedFacilityTypes.includes(type)}
                  onChange={() => handleToggleFacility(type)}
                  className="mr-2"
                  disabled={!searchedLocation && !selectedFacilityTypes.includes(type)}
                />
                <label
                  htmlFor={`facility-${type}`}
                  className={`flex items-center ${!searchedLocation && !selectedFacilityTypes.includes(type) ? 'text-gray-400 dark:text-gray-600' : ''}`}
                >
                  <span 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: config.color }}
                  ></span>
                  {config.label}
                </label>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* 下载按钮 */}
      <button
        className="w-full bg-gray-800 dark:bg-gray-600 text-white p-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-500"
        disabled={!searchedLocation || selectedFacilityTypes.length === 0}
      >
        下载图片
      </button>
    </div>
  )
} 