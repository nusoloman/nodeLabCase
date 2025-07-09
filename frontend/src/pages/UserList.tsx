import React, { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import { User as UserIcon, Mail, Search, MessageCircle } from 'lucide-react';
import { useUserList } from '../hooks/useUserList';

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

const UserList: React.FC<UserListProps> = React.memo(
  ({ onUserSelect, selectedUserId, excludeCurrentUser = false }) => {
    const { user } = useAuth();
    const { users, loading, error } = useUserList();
    const [searchTerm, setSearchTerm] = useState('');

    let filteredUsers = users;
    if (excludeCurrentUser && user) {
      filteredUsers = filteredUsers.filter((u: User) => u._id !== user._id);
    }
    filteredUsers = filteredUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // onUserSelect fonksiyonunu useCallback ile sarmala
    const handleUserSelect = useCallback(
      (user: User) => {
        if (onUserSelect) onUserSelect(user);
      },
      [onUserSelect]
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
              onClick={() => handleUserSelect(user)}
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
  }
);

UserList.displayName = 'UserList';

export default UserList;
