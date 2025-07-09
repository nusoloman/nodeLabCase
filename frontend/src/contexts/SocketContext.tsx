import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  status: 'connected' | 'disconnected' | 'reconnecting';
  reconnecting: boolean;
  joinConversation: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  status: 'disconnected',
  reconnecting: false,
  joinConversation: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<
    'connected' | 'disconnected' | 'reconnecting'
  >('disconnected');
  const [reconnecting, setReconnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const joinConversation = (conversationId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('join_room', conversationId);
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    const socket = io('http://localhost:3000', {
      auth: { token: accessToken },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setStatus('connected');
      setReconnecting(false);
    });
    socket.on('disconnect', () => {
      setConnected(false);
      setStatus('disconnected');
      setReconnecting(false);
    });
    socket.on('reconnect_attempt', () => {
      setStatus('reconnecting');
      setReconnecting(true);
    });
    socket.on('reconnect', () => {
      setStatus('connected');
      setReconnecting(false);
    });
    socket.on('connect_error', (error) => {
      setStatus('disconnected');
      setReconnecting(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        status,
        reconnecting,
        joinConversation,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
