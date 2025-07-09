import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface User {
  _id: string;
  username: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  selectedUser?: { _id: string; username: string };
}

const ScheduleMessageModal: React.FC<Props> = ({
  open,
  onClose,
  currentUserId,
  selectedUser,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [to, setTo] = useState('');
  const [content, setContent] = useState('');
  const [sendDate, setSendDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetch('/api/user/list', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setUsers(data.users || []));
    }
  }, [open]);

  useEffect(() => {
    if (selectedUser) {
      setTo(selectedUser._id);
    }
  }, [selectedUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // sendDate'i UTC'ye çevir
      const utcDate = new Date(sendDate).toISOString();
      const res = await fetch('/api/message/auto-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          from: currentUserId,
          to,
          content,
          sendDate: utcDate,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Hata');
      setSuccess('Mesaj başarıyla zamanlandı!');
      setContent('');
      setSendDate('');
      setTo('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Bilinmeyen bir hata oluştu');
      }
    }
    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-xl font-bold text-white mb-4">
        Zamanlanmış Mesaj Gönder
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-1">Alıcı</label>
          <select
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
          >
            <option value="">Alıcı Seçin</option>
            {users
              .filter((u) => u._id !== currentUserId)
              .map((u) => (
                <option key={u._id} value={u._id}>
                  {u.username}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-300 mb-1">Mesaj</label>
          <textarea
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:outline-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={3}
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-1">Tarih & Saat</label>
          <Input
            type="datetime-local"
            value={sendDate}
            onChange={(e) => setSendDate(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          className="w-full"
        >
          Zamanla
        </Button>
        {success && (
          <div className="text-green-400 text-sm mt-2">{success}</div>
        )}
        {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
      </form>
    </Modal>
  );
};

export default ScheduleMessageModal;
