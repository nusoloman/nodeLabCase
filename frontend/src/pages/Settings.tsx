import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../contexts/NotificationContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.currentPassword ||
      !formData.newPassword ||
      !formData.confirmPassword
    ) {
      notify('Tüm alanları doldurun', 'error');
      return;
    }

    if (formData.newPassword.length < 6) {
      notify('Yeni şifre en az 6 karakter olmalıdır', 'error');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      notify('Yeni şifreler eşleşmiyor', 'error');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      notify('Yeni şifre mevcut şifre ile aynı olamaz', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        notify('Şifre başarıyla değiştirildi', 'success');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        notify(data.message || 'Şifre değiştirme başarısız', 'error');
      }
    } catch {
      notify('Bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <ShieldCheck className="w-8 h-8 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Ayarlar</h2>
            </div>
          </CardHeader>
          <CardContent>
            {/* User Info */}
            <div className="bg-gray-800 p-6 rounded-lg shadow mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">
                Hesap Bilgileri
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-300">Kullanıcı Adı</label>
                  <div className="text-white font-medium">{user?.username}</div>
                </div>
                <div>
                  <label className="text-gray-300">E-posta</label>
                  <div className="text-white font-medium">{user?.email}</div>
                </div>
              </div>
            </div>

            {/* Password Change Form */}
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center space-x-3 mb-6">
                <Lock className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">
                  Şifre Değiştir
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Current Password */}
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-gray-300">
                    Mevcut Şifre
                  </label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Mevcut şifrenizi girin"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-gray-300">
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="pr-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Yeni şifrenizi girin (en az 6 karakter)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-gray-300">
                    Yeni Şifre (Tekrar)
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                    placeholder="Yeni şifrenizi tekrar girin"
                    required
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                </Button>
              </form>

              {/* Password Requirements */}
              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Şifre Gereksinimleri:
                </h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• En az 6 karakter uzunluğunda olmalı</li>
                  <li>• Mevcut şifrenizden farklı olmalı</li>
                  <li>• Güvenlik için güçlü bir şifre seçin</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
