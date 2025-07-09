import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface MessageResult {
  id: string;
  content: string;
  sender: string | { _id: string; username?: string };
  receiver: string | { _id: string; username?: string };
  conversation: string;
  createdAt: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  conversationId?: string;
}

const MessageSearchModal: React.FC<Props> = ({
  open,
  onClose,
  conversationId,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MessageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let url = '';
      if (conversationId) {
        url = `/api/search/messages?conversationId=${conversationId}&q=${encodeURIComponent(
          query
        )}`;
      } else {
        url = `/api/search/messages?q=${encodeURIComponent(query)}`;
      }
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!res.ok) throw new Error('Arama başarısız');
      const data = await res.json();
      setResults(data.results || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Bilinmeyen bir hata oluştu');
      }
    }
    setLoading(false);
  };

  const handleResultClick = (msg: MessageResult) => {
    onClose();
    setTimeout(() => {
      if (conversationId) {
        // Sadece focus olacak, navigate yok
        window.dispatchEvent(
          new CustomEvent('focusMessage', { detail: { messageId: msg.id } })
        );
      } else {
        navigate(
          `/chat?conversationId=${msg.conversation}&focusMessageId=${msg.id}`
        );
      }
    }, 100);
  };

  return (
    <Modal open={open} onClose={onClose} className="w-full max-w-2xl mx-4">
      <h2 className="text-xl font-bold text-white mb-4">Mesajlarda Ara</h2>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kelime veya cümle..."
          required
          className="flex-1"
        />
        <Button type="submit" variant="primary" loading={loading}>
          Ara
        </Button>
      </form>
      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
      <div className="max-h-80 overflow-y-auto space-y-3">
        {results.length === 0 && !loading && (
          <div className="text-gray-400 text-center">Sonuç yok.</div>
        )}
        {results.map((msg) => {
          // sender ve receiver username'i resolve et
          const senderName =
            typeof msg.sender === 'object' ? msg.sender.username : msg.sender;
          const receiverName =
            typeof msg.receiver === 'object'
              ? msg.receiver.username
              : msg.receiver;
          return (
            <div
              key={msg.id}
              className="bg-gray-800 rounded-lg p-3 border border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => handleResultClick(msg)}
            >
              <div className="text-gray-200 mb-1 font-semibold">
                {msg.content}
              </div>
              <div className="text-xs text-gray-400 flex flex-wrap gap-4">
                <span>Gönderen: {senderName}</span>
                <span>Alıcı: {receiverName}</span>
                <span>
                  Tarih:{' '}
                  {new Date(msg.createdAt).toLocaleString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default MessageSearchModal;
