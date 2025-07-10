import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { User, Users as UsersIcon } from 'lucide-react';

type DemoUser = { _id: string; username: string; email: string };
type Pair = { from: DemoUser; to: DemoUser; content: string };
type SendResult = { pair: Pair; status: string };

const ShufflePage: React.FC = () => {
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [unpaired, setUnpaired] = useState<DemoUser | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult[] | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
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
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-white mb-2">
              Kullanıcı Shuffle (Demo)
            </h2>
            <p className="text-gray-400">
              Kullanıcıları rastgele eşleştir ve otomatik mesaj gönder.
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-gray-300">Kullanıcılar yükleniyor...</div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UsersIcon className="w-5 h-5 text-purple-400" />
                    <span className="text-lg font-semibold text-white">
                      Kullanıcılar
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {users.map((u) => (
                      <span
                        key={u._id}
                        className="flex items-center gap-2 bg-gray-700 text-white px-3 py-1 rounded-full text-sm shadow-sm border border-gray-600"
                      >
                        <User className="w-4 h-4 text-blue-400" />
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
                          <span className="text-gray-400">
                            eşleşmeden kaldı
                          </span>
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
                              {res.pair.from.username} → {res.pair.to.username}:
                              "{res.pair.content}"{' '}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShufflePage;
