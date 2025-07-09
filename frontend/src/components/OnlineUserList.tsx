import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { API_URL } from '../config';
import { User, Circle } from 'lucide-react';

interface OnlineUser {
  _id: string;
  username: string;
  email: string;
}

const OnlineUserList: React.FC = React.memo(() => {
  const { socket } = useSocket();
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  // fetchOnlineUsers fonksiyonunu useCallback ile sarmala
  const fetchOnlineUsers = useCallback(async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/online-users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      setUsers(data.users || data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnlineUsers();
  }, [fetchOnlineUsers]);

  // Socket.IO ile online kullanıcılar güncellendiğinde listeyi güncelle
  useEffect(() => {
    if (!socket) return;
    const handleOnlineUpdate = () => {
      fetchOnlineUsers();
    };
    const handleConnect = () => {
      handleOnlineUpdate();
    };
    socket.on('user_online', handleOnlineUpdate);
    socket.on('disconnect', handleOnlineUpdate);
    socket.on('connect', handleConnect);
    socket.on('online_users_updated', () => {
      setTimeout(handleOnlineUpdate, 300);
    });
    return () => {
      socket.off('user_online', handleOnlineUpdate);
      socket.off('disconnect', handleOnlineUpdate);
      socket.off('connect', handleConnect);
      socket.off('online_users_updated', handleOnlineUpdate);
    };
  }, [socket, fetchOnlineUsers]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400">
        Online kullanıcılar yükleniyor...
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Circle className="w-4 h-4 text-green-400 mr-2" fill="#22c55e" /> Online
        Kullanıcılar
      </h3>
      {users.length === 0 ? (
        <div className="text-gray-400">şu anda online kullanıcı yok.</div>
      ) : (
        <ul className="space-y-2">
          {users.map((user) => (
            <li key={user._id} className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-white">
                <User className="w-4 h-4" />
              </span>
              <span className="text-white font-medium">{user.username}</span>
              <span className="ml-2 text-xs text-gray-400">{user.email}</span>
              <span className="ml-auto flex items-center">
                <Circle className="w-3 h-3 text-green-400" fill="#22c55e" />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

OnlineUserList.displayName = 'OnlineUserList';

export default OnlineUserList;
