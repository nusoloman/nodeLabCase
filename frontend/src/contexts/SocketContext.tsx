import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  reconnecting: boolean;
  joinConversation: (conversationId: string) => void;
  reconnect: () => void;
  connectionError: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  status: 'disconnected',
  reconnecting: false,
  joinConversation: () => {},
  reconnect: () => {},
  connectionError: null,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<
    'connected' | 'disconnected' | 'reconnecting' | 'error'
  >('disconnected');
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 1000; // 1 saniye

  const createSocket = useCallback(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setStatus('error');
      setConnectionError('No access token found');
      return null;
    }

    const socket = io('http://localhost:3000', {
      auth: { token: accessToken },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: baseReconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      setConnected(true);
      setStatus('connected');
      setReconnecting(false);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      setStatus('disconnected');
      setReconnecting(false);

      // If it's not a manual disconnect, try to reconnect
      if (reason !== 'io client disconnect') {
        scheduleReconnect();
      }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      setStatus('reconnecting');
      setReconnecting(true);
      reconnectAttemptsRef.current = attemptNumber;
    });

    socket.on('reconnect', () => {
      setStatus('connected');
      setReconnecting(false);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
    });

    socket.on('reconnect_failed', () => {
      setStatus('error');
      setReconnecting(false);
      setConnectionError('Failed to reconnect after multiple attempts');
    });

    socket.on('connect_error', (error) => {
      setStatus('error');
      setReconnecting(false);
      setConnectionError(error.message || 'Connection error');
    });

    return socket;
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setStatus('error');
      setConnectionError('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
      5000
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.connect();
      }
    }, delay);
  }, []);

  const reconnect = useCallback(() => {
    setStatus('reconnecting');
    setReconnecting(true);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const newSocket = createSocket();
    if (newSocket) {
      socketRef.current = newSocket;
    }
  }, [createSocket]);

  const joinConversation = useCallback(
    (conversationId: string) => {
      if (socketRef.current && connected) {
        socketRef.current.emit('join_room', conversationId);
      }
    },
    [connected]
  );

  useEffect(() => {
    const socket = createSocket();
    if (socket) {
      socketRef.current = socket;
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [createSocket]);

  // Periodic connection check
  useEffect(() => {
    const checkConnection = () => {
      if (
        socketRef.current &&
        !socketRef.current.connected &&
        status !== 'reconnecting'
      ) {
        reconnect();
      }
    };

    const interval = setInterval(checkConnection, 30000); // Her 30 saniyede bir kontrol et

    return () => clearInterval(interval);
  }, [status, reconnect]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        status,
        reconnecting,
        joinConversation,
        reconnect,
        connectionError,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
