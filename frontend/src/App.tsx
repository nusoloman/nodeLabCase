import AppRouter from './routes';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Toast from './components/ui/Toast';
import { GlobalStateProvider } from './contexts/GlobalStateContext';

function App() {
  return (
    <NotificationProvider>
      <GlobalStateProvider>
        <SocketProvider>
          <Toast />
          <AppRouter />
        </SocketProvider>
      </GlobalStateProvider>
    </NotificationProvider>
  );
}

export default App;
