import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Home as HomeIcon, LogOut, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import OnlineUserList from '../components/OnlineUserList';

const ActiveUserList: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <HomeIcon className="w-7 h-7 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer" />
              </Link>
              <span className="text-2xl font-bold text-white">NodeLabCase</span>
              <span className="text-gray-400 hidden sm:block">
                Hoş geldin,{' '}
                <span className="font-semibold text-white">
                  {user?.username}
                </span>
                !
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <Link
                  to="/profile"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded transition-colors"
                >
                  Profil
                </Link>
                <Link
                  to="/users"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded transition-colors"
                >
                  Kullanıcı Listesi
                </Link>
              </div>
              <Button variant="danger" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-1" /> Çıkış
              </Button>
            </div>
          </div>
        </div>
      </nav>

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
            <OnlineUserList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActiveUserList;
