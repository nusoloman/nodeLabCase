import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { API_URL } from '../config';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const location = useLocation();

  // URL'den login/register durumunu al
  React.useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin
        ? { email, password }
        : { username, email, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.accessToken, data.refreshToken);
      } else {
        setError(data.message || 'Bir hata oluştu');
      }
    } catch {
      setError('Bağlantı hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? 'Hoş Geldiniz' : 'Hesap Oluştur'}
            </h1>
            <p className="opacity-80">
              {isLogin ? 'Hesabınıza giriş yapın' : 'Yeni hesap oluşturun'}
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {!isLogin && (
                  <Input
                    id="username"
                    name="username"
                    label="Kullanıcı Adı"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    icon={<User />}
                    placeholder="kullaniciadi"
                    required
                  />
                )}

                <Input
                  id="email"
                  name="email"
                  label="Email Adresi"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail />}
                  placeholder="you@example.com"
                  required
                />

                <Input
                  id="password"
                  name="password"
                  label="Şifre"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock />}
                  rightIcon={showPassword ? <EyeOff /> : <Eye />}
                  onRightIconClick={() => setShowPassword(!showPassword)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center text-sm text-gray-400 cursor-pointer">
                    <input
                      id="remember"
                      name="remember"
                      type="checkbox"
                      className="mr-2 rounded bg-gray-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                    />
                    Beni hatırla
                  </label>
                  <Link
                    to="#"
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Şifremi unuttum?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
              </Button>

              <div className="pt-4 text-center text-sm text-gray-400">
                {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}{' '}
                <Link
                  to={isLogin ? '/register' : '/login'}
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
