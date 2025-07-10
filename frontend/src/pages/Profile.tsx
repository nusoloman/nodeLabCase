import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '../components/ui/Card';
import {
  User,
  Calendar,
  RefreshCcw,
  LogOut,
  Home as HomeIcon,
} from 'lucide-react';
import { updateProfile } from '../api';
import { useNotification } from '../contexts/NotificationContext';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

const Profile: React.FC = () => {
  const { user, logout, setUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const { notify } = useNotification();

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const fetchProfile = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setEditUsername(data.user.username);
        setEditEmail(data.user.email);
      } else if (response.status === 401) {
        setError('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
        logout();
      } else {
        setError('Profil bilgileri alınamadı.');
      }
    } catch {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await updateProfile(editUsername, editEmail);
      setProfile(res.user);
      setUser(res.user);
      notify('Profil başarıyla güncellendi.', 'success');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError(
          (err as { message: string }).message || 'Güncelleme başarısız.'
        );
      } else {
        setError('Güncelleme başarısız.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex flex-col items-center">
              <RefreshCcw className="w-10 h-10 mb-2 text-red-400" />
              <h2 className="text-2xl font-bold mb-2">Hata</h2>
              <p className="text-red-300 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
              >
                Yeniden Dene
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
      <div className="flex items-center justify-center px-4 py-8">
        <div className="max-w-xl w-full">
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center mb-4 shadow-lg">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  {profile?.username}
                </h1>
                <p className="text-purple-200">Kullanıcı Profili</p>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSave}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 mb-1">
                      Kullanıcı Adı
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Button type="submit" variant="primary" loading={saving}>
                    Kaydet
                  </Button>
                  {error && (
                    <span className="text-red-400 text-sm">{error}</span>
                  )}
                </div>
              </form>
              <div className="mt-8 space-y-2">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-200">
                    Kayıt:{' '}
                    {profile &&
                      new Date(profile.createdAt).toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500">ID:</span>
                  <span className="font-mono text-xs text-gray-400">
                    {profile?._id}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex justify-between items-center w-full">
                <Button
                  variant="secondary"
                  onClick={() => window.history.back()}
                >
                  Geri Dön
                </Button>
                <Button variant="danger" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" /> Çıkış Yap
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
