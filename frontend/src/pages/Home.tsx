import React, { useEffect, useState } from 'react';
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
  X as CloseIcon,
} from 'lucide-react';

type DemoUser = { _id: string; username: string; email: string };
type Pair = { from: DemoUser; to: DemoUser; content: string };

const ShuffleModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [unpaired, setUnpaired] = useState<DemoUser | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [sendResult, setSendResult] = useState<any[] | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setShowResults(false);
      setPairs([]);
      setUnpaired(null);
      setUsers([]);
      setLoading(true);
      fetch('/api/user/list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setUsers(data.users || []);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleShuffle = () => {
    setLoading(true);
    fetch('/api/user/shuffle-demo', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setPairs(data.pairs || []);
        setUnpaired(data.unpaired || null);
        setShowResults(true);
      })
      .finally(() => setLoading(false));
  };

  const handleSendMessages = () => {
    setSending(true);
    setSendResult(null);
    fetch('/api/user/shuffle-send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pairs }),
    })
      .then((res) => res.json())
      .then((data) => {
        setSendResult(data.results || []);
      })
      .finally(() => setSending(false));
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-900 rounded-xl shadow-lg max-w-2xl w-full p-6 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">
          Kullanıcı Shuffle (Demo)
        </h2>
        {loading ? (
          <div className="text-gray-300">Kullanıcılar yükleniyor...</div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {users.map((u) => (
                  <span
                    key={u._id}
                    className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm"
                  >
                    {u.username}
                  </span>
                ))}
              </div>
            </div>
            {!showResults ? (
              <button
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                onClick={handleShuffle}
                disabled={users.length < 2}
              >
                Eşleştir ve Mesajları Göster
              </button>
            ) : (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Eşleşmeler
                </h3>
                <div className="space-y-3">
                  {pairs.map((pair, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-2 mb-2 md:mb-0">
                        <User className="w-5 h-5 text-blue-400" />
                        <span className="text-white font-medium">
                          {pair.from.username}
                        </span>
                        <span className="text-gray-400">→</span>
                        <User className="w-5 h-5 text-purple-400" />
                        <span className="text-white font-medium">
                          {pair.to.username}
                        </span>
                      </div>
                      <div className="text-orange-300 font-semibold text-sm mt-2 md:mt-0">
                        "{pair.content}"
                      </div>
                    </div>
                  ))}
                  {unpaired && (
                    <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-2 mt-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-white font-medium">
                        {unpaired.username}
                      </span>
                      <span className="text-gray-400">eşleşmeden kaldı</span>
                    </div>
                  )}
                </div>
                {/* Mesajları Gönder ve Tekrar Karıştır Butonları */}
                <div className="w-full flex flex-col md:flex-row gap-2 mt-6">
                  <button
                    className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    onClick={() => {
                      handleShuffle();
                      setSendResult(null);
                    }}
                    disabled={loading}
                  >
                    Tekrar Karıştır
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSendMessages}
                    disabled={pairs.length === 0 || sending}
                  >
                    {sending ? 'Gönderiliyor...' : 'Mesajları Gönder'}
                  </button>
                </div>
                {/* Sonuç Gösterimi */}
                {sendResult && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold text-white mb-2">
                      Gönderim Sonucu
                    </h4>
                    <ul className="space-y-2">
                      {sendResult.map((res, i) => (
                        <li key={i} className="text-sm text-gray-200">
                          {res.pair.from.username} → {res.pair.to.username}: "
                          {res.pair.content}"{' '}
                          <span
                            className={
                              res.status === 'queued'
                                ? 'text-green-400'
                                : 'text-red-400'
                            }
                          >
                            [{res.status}]
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const { user } = useAuth();
  const { setActiveConversationId } = useGlobalState();
  const [showShuffleModal, setShowShuffleModal] = useState(false);

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
                  {/* Shuffle Button */}
                  <button
                    type="button"
                    className="block w-full bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 text-white text-center py-3 px-4 rounded-lg font-semibold transition-colors mb-2"
                    onClick={() => setShowShuffleModal(true)}
                  >
                    Shuffle (Demo)
                  </button>
                  <Link
                    to="/settings"
                    className="block w-full bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white text-center py-3 px-4 rounded-lg font-semibold transition-colors"
                  >
                    <Settings className="w-4 h-4 inline mr-1" /> Ayarlar
                  </Link>
                </div>
              </div>
            </div>

            {/* Shuffle Modal */}
            <ShuffleModal
              open={showShuffleModal}
              onClose={() => setShowShuffleModal(false)}
            />

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
