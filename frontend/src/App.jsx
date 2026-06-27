import './App.css'
import { ThemeProvider } from './context/ThemeContext'
import { WallpaperProvider } from './context/WallpaperContext'
import { Routes, Route, Navigate } from 'react-router'
import ChatPage from './pages/ChatPage'
import AuthPage from './pages/AuthPage'
import { useAuth } from '@clerk/react'
import PageLoader from './components/PageLoader'
import { useAuthStore } from './store/useAuhStore'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'

function App() {
  const { isSignedIn, isLoaded, getToken  } = useAuth();

  const clearAuth = useAuthStore(state => state.clearAuth);
  const checkAuth = useAuthStore(state => state.checkAuth);
  const isCheckingAuth = useAuthStore(state => state.isCheckingAuth);

  useEffect(()=>{
    if(!isLoaded) return;

    if(isSignedIn) checkAuth();
    else clearAuth();
  },[checkAuth,clearAuth,isLoaded,isSignedIn]);

  useEffect(() => {
  if (isSignedIn) {
    getToken().then((token) => {
      console.log("TOKEN:", token);
    });
  }
}, [isSignedIn, getToken]);

  if(!isLoaded || (isSignedIn && isCheckingAuth)) return <PageLoader/>
  return (
    <>
      <ThemeProvider>
        <WallpaperProvider>
          <Routes>
            <Route path='/' element={ isSignedIn ? <ChatPage /> : <Navigate to={"/auth"} replace/>} />
            <Route path='/auth' element={ !isSignedIn ? <AuthPage /> : <Navigate to={"/"} />} />
          </Routes>
          <Toaster />
        </WallpaperProvider>
      </ThemeProvider>
    </>
  )
}

export default App
