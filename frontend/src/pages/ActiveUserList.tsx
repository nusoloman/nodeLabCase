import React from 'react';
import { Users, Circle, Mail, Search } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
// import OnlineUserList from '../components/OnlineUserList';
import Input from '../components/ui/Input';
import { useState } from 'react';
import { API_URL } from '../config';
import { useSocket } from '../contexts/SocketContext';

interface User {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

const ActiveUserList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { socket } = useSocket();

  // fetch fonksiyonunu dışarı al
  const fetchOnlineUsers = async () => {
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
      setError('Online kullanıcılar alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOnlineUsers();
  }, []);

  // Websocket ile online_users_updated event'ini dinle
  React.useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchOnlineUsers();
    };
    socket.on('online_users_updated', handleUpdate);
    return () => {
      socket.off('online_users_updated', handleUpdate);
    };
  }, [socket]);

  let filteredUsers = users;
  filteredUsers = filteredUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Users className="w-8 h-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">
                Aktif Kullanıcılar
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search />}
                placeholder="Kullanıcı adı veya email ile ara..."
                className="bg-gray-700 flex-1 mr-3"
              />
            </div>
            {loading ? (
              <div className="flex items-center justify-center min-h-[120px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : error ? (
              <div className="text-red-400 text-center">{error}</div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className={`flex items-center bg-gray-800 rounded-lg p-4 border border-gray-700 transition-all hover:bg-gray-700`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {user.username}
                      </h3>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center">
                      <Circle
                        className="w-4 h-4 text-green-400"
                        fill="#22c55e"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActiveUserList;
