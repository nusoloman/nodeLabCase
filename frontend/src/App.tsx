import AppRouter from './routes';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Toast from './components/ui/Toast';
import { GlobalStateProvider } from './contexts/GlobalStateContext';
import GlobalSocketToastListener from './components/GlobalSocketToastListener';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import Header from './components/Header';

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <AuthProvider>
          <NotificationProvider>
            <GlobalStateProvider>
              <Toast />
              <GlobalSocketToastListener />
              <Header />
              <AppRouter />
            </GlobalStateProvider>
          </NotificationProvider>
        </AuthProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
