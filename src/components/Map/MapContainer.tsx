import { useEffect, useState } from 'react'
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import { Icon } from 'leaflet'
import { useMapStore } from '../../store/mapStore'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet icon issue
import L from 'leaflet';
// @ts-ignore - _getIconUrl exists at runtime but not in the type definitions
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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
        >
          <Popup>您的位置</Popup>
        </Marker>
      )}
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
  
  // 默认位置为北美中部
  const defaultPosition: [number, number] = [40, -95];
  const position = userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : defaultPosition;
  
  return (
    <div className="h-full w-full relative" style={{ height: '100vh', width: '100%' }}>
      <LeafletMapContainer
        center={position}
        zoom={userLocation ? 14 : 4}
        style={{ height: '100%', width: '100%' }}
        className="z-10"
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