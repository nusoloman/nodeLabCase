import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import {
  User,
  Users,
  Settings,
  ShieldCheck,
  Mail,
  MessageCircle,
} from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { setActiveConversationId } = useGlobalState();

  // Dashboard'a geldiğimizde active conversation'ı temizle
  useEffect(() => {
    setActiveConversationId(null);
  }, [setActiveConversationId]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <ShieldCheck className="w-8 h-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Dashboard</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              {/* User Info Card */}
              <div className="bg-gray-800 p-6 rounded-lg shadow flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  {user?.username}
                </h3>
                <div className="flex items-center text-gray-400 mb-2">
                  <Mail className="w-4 h-4 mr-1" />
                  <span>{user?.email}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 p-6 rounded-lg shadow flex flex-col justify-center">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Hızlı İşlemler
                </h3>
                <div className="space-y-3">
                  <Link
                    to="/profile"
                    className="block w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white text-center py-3 px-4 rounded-lg font-semibold transition-colors"
                  >
                    Profilimi Görüntüle
                  </Link>
                  <Link
                    to="/active-users"
                    className="block w-full bg-gradient-to-r from-blue-600 to-purple-500 hover:from-blue-700 hover:to-purple-600 text-white text-center py-3 px-4 rounded-lg font-semibold transition-colors"
                  >
                    Aktif Kullanıcılar
                  </Link>
                  <Link
                    to="/chat"
                    className="block w-full bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white text-center py-3 px-4 rounded-lg font-semibold transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 inline mr-1" /> Sohbet
                    Başlat
                  </Link>
                  <Link
                    to="#"
                    className="block w-full bg-gray-700 hover:bg-gray-600 text-gray-300 text-center py-3 px-4 rounded-lg font-semibold transition-colors"
                  >
                    <Settings className="w-4 h-4 inline mr-1" /> Ayarlar (devam
                    edecek)
                  </Link>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="mt-10 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">
                Sistem Durumu
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-purple-700 flex flex-col items-center">
                  <ShieldCheck className="w-5 h-5 text-purple-400 mb-1" />
                  <span className="text-purple-300 font-medium">
                    JWT Authentication
                  </span>
                  <span className="text-green-500 text-xs mt-1">Aktif</span>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-blue-700 flex flex-col items-center">
                  <Users className="w-5 h-5 text-blue-400 mb-1" />
                  <span className="text-blue-300 font-medium">
                    API Bağlantısı
                  </span>
                  <span className="text-green-500 text-xs mt-1">Başarılı</span>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col items-center">
                  <User className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-gray-300 font-medium">Oturum</span>
                  <span className="text-green-500 text-xs mt-1">Aktif</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
