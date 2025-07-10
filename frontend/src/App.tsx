import AppRouter from './routes';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Toast from './components/ui/Toast';
import { GlobalStateProvider } from './contexts/GlobalStateContext';
import GlobalSocketToastListener from './components/GlobalSocketToastListener';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter, useLocation } from 'react-router-dom';
import Header from './components/Header';

function App() {
  return (
    <BrowserRouter>
      <AppWithHeader />
    </BrowserRouter>
  );
}

function AppWithHeader() {
  const { pathname } = useLocation();
  const hideHeader = pathname === '/login' || pathname === '/register';

  return (
    <SocketProvider>
      <AuthProvider>
        <NotificationProvider>
          <GlobalStateProvider>
            <Toast />
            <GlobalSocketToastListener />
            {!hideHeader && <Header />}
            <AppRouter />
          </GlobalStateProvider>
        </NotificationProvider>
      </AuthProvider>
    </SocketProvider>
  );
}

export default App;
