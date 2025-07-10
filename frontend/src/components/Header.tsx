import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';
import { LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <img
                src="/icon.png"
                alt="NodeLabCase"
                className="w-40 h-15 hover:opacity-80 transition-opacity cursor-pointer bg-white rounded-lg p-2"
              />
            </Link>
            <span className="text-gray-400 hidden sm:block">
              Hoş geldin,{' '}
              <span className="font-semibold text-white">{user?.username}</span>
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
  );
};

export default Header;
