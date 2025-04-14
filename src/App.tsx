import { useEffect, useState } from 'react'
import { MapContainer } from './components/Map/MapContainer'
import { SearchPanel } from './components/Search/SearchPanel'
import { Legend } from './components/Legend/Legend'
import { useMapStore } from './store/mapStore'
import { ThemeProvider } from './components/layout/ThemeProvider'

// 持久化缓存
function saveCacheToLocalStorage(cache: any) {
  try {
    localStorage.setItem('facilitiesCache', JSON.stringify(cache));
  } catch (error) {
    console.error('保存缓存到本地存储失败:', error);
  }
}

// 从本地存储加载缓存
function loadCacheFromLocalStorage(): any[] {
  try {
    const savedCache = localStorage.getItem('facilitiesCache');
    if (savedCache) {
      return JSON.parse(savedCache);
    }
  } catch (error) {
    console.error('从本地存储加载缓存失败:', error);
  }
  return [];
}

// 调试组件，只在开发环境显示
function DebugPanel() {
  const { 
    facilities, 
    selectedFacilityTypes, 
    searchedLocation
  } = useMapStore();
  
  const [showDebug, setShowDebug] = useState(false);
  
  // 获取缓存信息
  const [cacheInfo, setCacheInfo] = useState({ count: 0 });
  
  useEffect(() => {
    try {
      const cache = loadCacheFromLocalStorage();
      setCacheInfo({ count: cache.length });
    } catch (error) {
      console.error('获取缓存信息失败:', error);
    }
  }, []);
  
  // 计算按类型分组的设施数量
  const facilitiesByType = selectedFacilityTypes.map(type => ({
    type,
    count: facilities.filter(f => f.type === type).length
  }));
  
  if (!showDebug) {
    return (
      <button 
        className="fixed bottom-2 right-2 bg-gray-800 text-white px-2 py-1 text-xs rounded z-50"
        onClick={() => setShowDebug(true)}
      >
        显示调试
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-2 right-2 bg-white border border-gray-300 shadow-lg p-3 rounded z-50 max-w-xs text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">调试信息</h3>
        <button 
          className="text-gray-500 hover:text-gray-700"
          onClick={() => setShowDebug(false)}
        >
          关闭
        </button>
      </div>
      <div>
        <p><strong>搜索位置:</strong> {searchedLocation ? '已设置' : '未设置'}</p>
        <p><strong>选中类型数:</strong> {selectedFacilityTypes.length}</p>
        <p><strong>设施总数:</strong> {facilities.length}</p>
        <p><strong>缓存数量:</strong> {cacheInfo.count}</p>
        <div>
          <strong>各类型设施:</strong>
          <ul className="pl-4">
            {facilitiesByType.map(item => (
              <li key={item.type}>{item.type}: {item.count}个</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { setUserLocation, setCachedFacilities } = useMapStore();
  
  // 获取用户位置
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('获取位置失败:', error.message);
        }
      );
    }
  }, [setUserLocation]);
  
  // 初始化缓存
  useEffect(() => {
    // 从localStorage加载缓存
    const savedCache = loadCacheFromLocalStorage();
    if (savedCache && savedCache.length > 0) {
      console.log('从本地存储加载了缓存:', { count: savedCache.length });
      
      // 恢复缓存到store
      savedCache.forEach(cache => {
        if (cache && cache.key && cache.facilities) {
          setCachedFacilities(cache.key, cache.facilities);
        }
      });
    }
  }, [setCachedFacilities]);
  
  // 定期保存缓存
  useEffect(() => {
    // 定期保存缓存到localStorage
    const saveInterval = setInterval(() => {
      // 获取最新的缓存状态
      const currentState = useMapStore.getState();
      if (currentState.facilitiesCache && currentState.facilitiesCache.length > 0) {
        console.log('保存缓存到本地存储:', { count: currentState.facilitiesCache.length });
        saveCacheToLocalStorage(currentState.facilitiesCache);
      }
    }, 30000); // 每30秒保存一次
    
    // 页面卸载前也保存一次
    const handleBeforeUnload = () => {
      const currentState = useMapStore.getState();
      if (currentState.facilitiesCache && currentState.facilitiesCache.length > 0) {
        saveCacheToLocalStorage(currentState.facilitiesCache);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="facilities-theme">
      <div className="flex h-screen w-screen overflow-hidden">
        <div className="w-80 bg-white dark:bg-gray-900 shadow-md overflow-y-auto z-20 flex-shrink-0">
          <SearchPanel />
        </div>
        <div className="flex-1 map-container-wrapper">
          <MapContainer />
        </div>
        <div className="w-72 bg-white dark:bg-gray-900 shadow-md overflow-y-auto z-20 flex-shrink-0">
          <Legend />
        </div>
        
        {/* 调试面板 - 仅在开发环境显示 */}
        {import.meta.env.DEV && <DebugPanel />}
      </div>
    </ThemeProvider>
  )
}

export default App 