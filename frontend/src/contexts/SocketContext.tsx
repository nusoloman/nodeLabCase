import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  status: 'connected' | 'disconnected' | 'reconnecting';
  reconnecting: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  status: 'disconnected',
  reconnecting: false,
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

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    const socket = io(API_URL.replace('/api', ''), {
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
    socket.on('connect_error', () => {
      setStatus('disconnected');
      setReconnecting(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, connected, status, reconnecting }}
    >
      {children}
    </SocketContext.Provider>
  );
};
