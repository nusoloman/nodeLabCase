import AppRouter from './routes';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <SocketProvider>
      <AppRouter />
    </SocketProvider>
  );
}

export default App;
