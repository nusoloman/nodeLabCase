import React, { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import { User as UserIcon, Mail, Search, Users } from 'lucide-react';
import { useUserList } from '../hooks/useUserList';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

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
        <div className="min-h-screen bg-gray-900">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-screen bg-gray-900">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-red-400 text-center">
              <p className="text-xl mb-4">Hata</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-900">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Users className="w-8 h-8 text-purple-400" />
                <h2 className="text-3xl font-bold text-white">
                  Kullanıcı Listesi
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
                  className="bg-gray-700 flex-1"
                />
              </div>
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className={`flex items-center bg-gray-800 rounded-lg p-4 cursor-pointer border border-gray-700 transition-all ${
                      selectedUserId === user._id
                        ? 'ring-2 ring-purple-500'
                        : 'hover:bg-gray-700'
                    }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      <UserIcon className="w-6 h-6" />
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
                    {/* ID gösterimi kaldırıldı */}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
);

UserList.displayName = 'UserList';

export default UserList;
