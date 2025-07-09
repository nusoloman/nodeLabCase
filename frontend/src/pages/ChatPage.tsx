import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_URL } from '../config';
import UserList from './UserList';
import ChatWindow from '../components/chat/ChatWindow';
import ScheduleMessageModal from '../components/chat/ScheduleMessageModal';
import MessageSearchModal from '../components/chat/MessageSearchModal';
import { Clock, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface User {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

interface Conversation {
  _id: string;
  participants: (string | { _id: string; username?: string; email?: string })[];
  conversationId?: string;
}

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userListKey, setUserListKey] = useState(0); // Modalı her açışta UserList'i resetlemek için
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const focusMessageId = params.get('focusMessageId');

  // Geçmiş konuşmaları çek
  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/conversation/list`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    };
    fetchConversations();
  }, [user]);

  // Son mesajları çek (her konuşma için)
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});
  useEffect(() => {
    const fetchLastMessages = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const promises = conversations.map(async (conv) => {
        if (!conv._id) return;
        const res = await fetch(`${API_URL}/message/history/${conv._id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          const msgs = data.messages || [];
          if (msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            return { id: conv._id, text: lastMsg.content };
          }
        }
        return { id: conv._id, text: '' };
      });
      const results = await Promise.all(promises);
      const msgMap: Record<string, string> = {};
      results.forEach((r) => {
        if (r) msgMap[r.id] = r.text;
      });
      setLastMessages(msgMap);
    };
    if (conversations.length > 0) fetchLastMessages();
  }, [conversations]);

  // Yeni mesaj geldiğinde/gönderildiğinde sidebar'daki son mesajı güncelle
  const handleNewMessage = (convId: string, msg: string) => {
    setLastMessages((prev) => ({ ...prev, [convId]: msg }));
  };

  // Konuşma seçildiğinde ilgili kullanıcıyı bul
  const handleConversationSelect = (conv: Conversation) => {
    if (!user) return;
    setConversationId(conv._id);
    // Karşı tarafı bul
    const participant = conv.participants.find(
      (p) => (typeof p === 'string' ? p : p._id) !== user._id
    );
    if (participant && typeof participant === 'object') {
      setSelectedUser({
        _id: participant._id,
        username: participant.username || '',
        email: participant.email || '',
      });
    } else if (typeof participant === 'string') {
      // fallback (username/email yoksa)
      setSelectedUser({ _id: participant, username: 'Kullanıcı', email: '' });
    }
  };

  // Modal'dan kullanıcı seçilince konuşma başlat
  const handleUserSelect = async (otherUser: User) => {
    if (!user) return;
    setShowUserModal(false);
    setSelectedUser(otherUser);
    // Mevcut konuşmaları kontrol et
    const accessToken = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_URL}/conversation/list`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        const conv = data.conversations?.find((c: Conversation) => {
          const participantIds = c.participants.map(
            (p: string | { _id: string }) => (typeof p === 'string' ? p : p._id)
          );
          return (
            participantIds.includes(otherUser._id) &&
            participantIds.includes(user._id) &&
            participantIds.length === 2
          );
        });
        if (conv) {
          setConversationId(conv._id);
        } else {
          setConversationId(null);
        }
      }
    } catch (error) {
      setConversationId(null);
    }
    // Modalı her açışta UserList'i resetlemek için anahtar değiştir
    setUserListKey((k) => k + 1);
  };

  // URL değişince conversationId ve focusMessageId'yi güncelle
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlConvId = urlParams.get('conversationId');
    if (urlConvId && urlConvId !== conversationId) {
      setConversationId(urlConvId);
      // Konuşma listesinden ilgili kullanıcıyı bul
      const conv = conversations.find((c) => c._id === urlConvId);
      if (conv && user) {
        const participant = conv.participants.find(
          (p) => (typeof p === 'string' ? p : p._id) !== user._id
        );
        if (participant && typeof participant === 'object') {
          setSelectedUser({
            _id: participant._id,
            username: participant.username || '',
            email: participant.email || '',
          });
        } else if (typeof participant === 'string') {
          setSelectedUser({
            _id: participant,
            username: 'Kullanıcı',
            email: '',
          });
        }
      }
    }
  }, [location.search, conversations, user]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-row">
      {/* Sidebar: Geçmiş konuşmalar */}
      <div className="w-72 p-4 border-r border-gray-800 bg-gray-900 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Konuşmalarım</h2>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors text-sm"
            onClick={() => setShowUserModal(true)}
          >
            + Yeni Sohbet
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations.length === 0 ? (
            <div className="text-gray-400 text-sm">Henüz konuşma yok.</div>
          ) : (
            conversations.map((conv) => {
              // Karşı tarafı bul
              const participant = conv.participants.find(
                (p) => (typeof p === 'string' ? p : p._id) !== user?._id
              );
              const username =
                typeof participant === 'object'
                  ? participant.username
                  : 'Kullanıcı';
              const avatarUrl =
                typeof participant === 'object' && participant.avatarUrl
                  ? participant.avatarUrl
                  : undefined;
              const lastMsg = lastMessages[conv._id] || '';
              return (
                <button
                  key={conv._id}
                  className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg transition-colors ${
                    conv._id === conversationId
                      ? 'bg-purple-700 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                  }`}
                  onClick={() => handleConversationSelect(conv)}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center text-white">
                      <svg
                        width="20"
                        height="20"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{username}</div>
                    {lastMsg && (
                      <div className="text-xs text-gray-400 truncate max-w-[140px]">
                        {lastMsg}
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
      {/* Chat penceresi (orta panel) */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl flex items-center justify-end gap-2 mb-2">
          <button
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-full transition-colors"
            onClick={() => setShowSearchModal(true)}
            title="Mesajlarda Ara"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-full transition-colors"
            onClick={() => setShowScheduleModal(true)}
            title="Zamanlanmış Mesaj Gönder"
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>
        {selectedUser && user ? (
          <ChatWindow
            conversationId={conversationId}
            currentUserId={user._id}
            otherUser={selectedUser}
            onNewMessage={handleNewMessage}
            focusMessageId={focusMessageId || undefined}
          />
        ) : (
          <div className="text-gray-400 text-center">
            Bir konuşma seçin veya yeni sohbet başlatın.
          </div>
        )}
      </div>
      {/* Modal: Yeni sohbet başlat */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl"
              onClick={() => setShowUserModal(false)}
            >
              ×
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Kullanıcı Seç</h3>
            <UserList
              key={userListKey}
              onUserSelect={handleUserSelect}
              excludeCurrentUser={true}
            />
          </div>
        </div>
      )}
      {/* Modal: Zamanlanmış Mesaj */}
      {showScheduleModal && user && (
        <ScheduleMessageModal
          open={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          currentUserId={user._id}
          selectedUser={selectedUser || undefined}
        />
      )}
      {/* Modal: Mesaj Arama */}
      {showSearchModal && (
        <MessageSearchModal
          open={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          conversationId={conversationId || undefined}
        />
      )}
    </div>
  );
};

export default ChatPage;
