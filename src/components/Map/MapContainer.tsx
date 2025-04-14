import { useEffect, useState } from 'react'
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap, Circle, AttributionControl } from 'react-leaflet'
import { Icon } from 'leaflet'
import { useMapStore } from '../../store/mapStore'
import { FacilityMarkers } from './FacilityMarkers'
import 'leaflet/dist/leaflet.css'
import { useFacilities } from '../../hooks/useFacilities'

// Fix Leaflet icon issue
import L from 'leaflet';
// @ts-ignore - _getIconUrl exists at runtime but not in the type definitions
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// 加载状态组件
function LoadingIndicator() {
  const { isLoading, error } = useMapStore();
  
  if (error) {
    return (
      <div className="error-indicator" style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'white',
        padding: '10px 15px',
        borderRadius: '4px',
        boxShadow: '0 1px 5px rgba(0,0,0,0.2)',
        zIndex: 1000,
        color: 'red',
        border: '1px solid red'
      }}>
        <p>{error}</p>
      </div>
    );
  }
  
  if (!isLoading) return null;
  
  return (
    <div className="loading-indicator" style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'white',
      padding: '10px 15px',
      borderRadius: '4px',
      boxShadow: '0 1px 5px rgba(0,0,0,0.2)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center'
    }}>
      <div className="spinner" style={{
        width: '20px',
        height: '20px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #3388ff',
        borderRadius: '50%',
        marginRight: '10px',
        animation: 'spin 1s linear infinite'
      }}></div>
      <span>正在获取真实设施数据...</span>
    </div>
  );
}

// 地图实际渲染组件
function MapContent() {
  const { 
    userLocation, 
    searchedLocation, 
    searchedAddress,
    searchRadius,
  } = useMapStore()
  
  // 使用hook获取设施数据，只在有搜索位置时才会实际获取
  useFacilities();
  
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
          
          {/* 设施标记 */}
          <FacilityMarkers />
        </>
      )}
      
      {userLocation && !searchedLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
        >
          <Popup>您的位置</Popup>
        </Marker>
      )}
      
      {/* 加载状态指示器 */}
      <LoadingIndicator />
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
    
    // 添加CSS动画
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [])
  
  if (!isClient) return <div className="w-full h-full bg-gray-100" />
  
  // 默认位置为北美中部
  const defaultPosition: [number, number] = [40, -95];
  const position = userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : defaultPosition;
  
  return (
    <div className="h-full w-full relative" style={{ height: '100%' }}>
      <LeafletMapContainer
        center={position}
        zoom={userLocation ? 14 : 4}
        style={{ height: '100%', width: '100%' }}
        className="z-10"
        attributionControl={false} // 禁用默认归属，使用自定义归属
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 贡献者'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AttributionControl position="bottomright" prefix={false} />
        <MapContent />
      </LeafletMapContainer>
      
      {/* OpenStreetMap贡献者归属信息 */}
      <div className="osm-data-attribution" style={{
        position: 'absolute',
        bottom: '0',
        right: '0',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: '2px 5px',
        fontSize: '11px',
        zIndex: 1000
      }}>
        设施数据来源: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> 贡献者
      </div>
    </div>
  )
} 