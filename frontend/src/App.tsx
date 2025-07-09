import AppRouter from './routes';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Toast from './components/ui/Toast';
import { GlobalStateProvider } from './contexts/GlobalStateContext';
import GlobalSocketToastListener from './components/GlobalSocketToastListener';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <GlobalStateProvider>
            <SocketProvider>
              <Toast />
              <GlobalSocketToastListener />
              <AppRouter />
            </SocketProvider>
          </GlobalStateProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
