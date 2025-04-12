import { useEffect } from 'react'
import { MapContainer } from './components/Map/MapContainer'
import { SearchPanel } from './components/Search/SearchPanel'
import { Legend } from './components/Legend/Legend'
import { useMapStore } from './store/mapStore'
import { ThemeProvider } from './components/layout/ThemeProvider'

function App() {
  const { setUserLocation } = useMapStore()
  
  // 获取用户位置
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
        },
        (error) => {
          console.error('获取位置失败:', error.message)
        }
      )
    }
  }, [setUserLocation])

  return (
    <ThemeProvider defaultTheme="light" storageKey="facilities-theme">
      <div className="flex h-screen w-screen overflow-hidden">
        <SearchPanel />
        <MapContainer />
        <Legend />
      </div>
    </ThemeProvider>
  )
}

export default App 