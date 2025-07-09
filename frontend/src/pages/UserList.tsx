import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import { User as UserIcon, Mail, Search, MessageCircle } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

interface UserListProps {
  onUserSelect?: (user: User) => void;
  selectedUserId?: string;
  excludeCurrentUser?: boolean;
}

const UserList: React.FC<UserListProps> = ({
  onUserSelect,
  selectedUserId,
  excludeCurrentUser = false,
}) => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/user/list`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        let userList = data.users || data;

        // Giriş yapan kullanıcıyı filtrele
        if (excludeCurrentUser && user) {
          userList = userList.filter((u: User) => u._id !== user._id);
        }

        setUsers(userList);
      } else if (response.status === 401) {
        setError('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        logout();
      } else {
        setError('Kullanıcı listesi alınamadı.');
      }
    } catch {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400">
        Kullanıcılar yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search />}
          placeholder="Kullanıcı adı veya email ile ara..."
          className="bg-gray-700 flex-1 mr-3"
        />
        <Link
          to="/chat"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          Sohbet
        </Link>
      </div>
      <div className="space-y-2">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            className={`flex items-center bg-gray-800 rounded-lg p-3 cursor-pointer border border-gray-700 transition-all ${
              selectedUserId === user._id
                ? 'ring-2 ring-purple-500'
                : 'hover:bg-gray-700'
            }`}
            onClick={() => onUserSelect && onUserSelect(user)}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white">
                {user.username}
              </h3>
              <div className="flex items-center space-x-2 text-gray-400 text-xs">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
            </div>
            <div className="text-right ml-4">
              <span className="text-xs text-gray-500">ID</span>
              <div className="font-mono text-xs text-gray-400">
                {user._id.substring(0, 8)}...
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;
