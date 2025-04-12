import { useEffect, useState } from 'react'
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import { Icon } from 'leaflet'
import { useMapStore } from '../../store/mapStore'
import 'leaflet/dist/leaflet.css'

// 地图实际渲染组件
function MapContent() {
  const { 
    userLocation, 
    searchedLocation, 
    searchedAddress,
    searchRadius
  } = useMapStore()
  
  const map = useMap()
  
  // 当搜索位置变化时，移动地图视图
  useEffect(() => {
    if (searchedLocation) {
      map.setView([searchedLocation.lat, searchedLocation.lng], 14)
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 14)
    }
  }, [map, searchedLocation, userLocation])
  
  return (
    <>
      {searchedLocation && (
        <>
          <Marker
            position={[searchedLocation.lat, searchedLocation.lng]}
            icon={new Icon({
              iconUrl: '/icons/map-pin.svg',
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            })}
          >
            <Popup>{searchedAddress}</Popup>
          </Marker>
          
          {/* 搜索半径圆圈 */}
          <Circle
            center={[searchedLocation.lat, searchedLocation.lng]}
            radius={searchRadius * 1000} // 转换为米
            pathOptions={{ 
              fillColor: '#3388ff',
              fillOpacity: 0.1,
              color: '#3388ff',
              weight: 1
            }}
          />
        </>
      )}
      
      {userLocation && !searchedLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={new Icon({
            iconUrl: '/icons/user-location.svg',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })}
        >
          <Popup>您的位置</Popup>
        </Marker>
      )}
      
      {/* 设施标记将在后续实现 */}
    </>
  )
}

// 地图容器组件
export function MapContainer() {
  const { userLocation } = useMapStore()
  const [isClient, setIsClient] = useState(false)
  
  // 避免SSR问题
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) return <div className="w-full h-full bg-gray-100" />
  
  return (
    <div className="flex-1 h-full relative">
      <LeafletMapContainer
        center={userLocation ? [userLocation.lat, userLocation.lng] : [40, -95]}
        zoom={userLocation ? 14 : 4}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapContent />
      </LeafletMapContainer>
    </div>
  )
} 