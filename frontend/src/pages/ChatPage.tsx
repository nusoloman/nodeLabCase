import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import UserList from './UserList';
import ChatWindow from '../components/chat/ChatWindow';
import ScheduleMessageModal from '../components/chat/ScheduleMessageModal';
import MessageSearchModal from '../components/chat/MessageSearchModal';
import { Clock, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useConversations } from '../hooks/useConversations';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { getConversationList } from '../api';

// Tip tanımları
interface User {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

// Conversation tipini güncelle
interface Conversation {
  _id: string;
  participants: User[];
  // Diğer conversation alanları gerekiyorsa ekle
}

interface Message {
  content: string;
  // Diğer message alanları gerekiyorsa ekle
}

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const {
    conversations,
    loading: convLoading,
    error: convError,
  } = useConversations();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userListKey, setUserListKey] = useState(0); // Modalı her açışta UserList'i resetlemek için
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const focusMessageId = params.get('focusMessageId');
  const { setActiveConversation } = useGlobalState(); // activeConversation kullanılmıyor, kaldırıldı
  const [conversationsState, setConversationsState] = useState<Conversation[]>(
    []
  );

  // Son mesajlar için state
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});

  // Sync conversationsState with useConversations
  useEffect(() => {
    setConversationsState(conversations as Conversation[]);
  }, [conversations]);

  // Fetch last message for each conversation
  useEffect(() => {
    let isMounted = true;
    async function fetchLastMessages() {
      if (!conversations.length) {
        setLastMessages({});
        return;
      }
      const accessToken = localStorage.getItem('accessToken');
      const promises = (conversations as Conversation[]).map(async (conv) => {
        const res = await fetch(`/api/message/history/${conv._id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          const msgs: Message[] = data.messages || [];
          if (msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            return { id: conv._id, text: lastMsg.content };
          }
        }
        return { id: conv._id, text: '' };
      });
      const results = await Promise.all(promises);
      if (!isMounted) return;
      const msgMap: Record<string, string> = {};
      results.forEach((r) => {
        if (r) msgMap[r.id] = r.text;
      });
      setLastMessages(msgMap);
    }
    fetchLastMessages();
    return () => {
      isMounted = false;
    };
  }, [conversations]);

  // handleNewMessage fonksiyonunu useCallback ile sarmala
  const handleNewMessage = useCallback((convId: string, msg: string) => {
    setLastMessages((prev) => ({ ...prev, [convId]: msg }));
  }, []);

  // handleNewConversation fonksiyonunu useCallback ile sarmala
  const handleNewConversation = useCallback(
    async (newConvId: string, message: Message) => {
      setConversationId(newConvId);
      const updatedList = await getConversationList();
      setConversationsState(updatedList.conversations as Conversation[]);
      setLastMessages((prev) => ({ ...prev, [newConvId]: message.content }));
    },
    []
  );

  // handleConversationSelect fonksiyonunu useCallback ile sarmala
  const handleConversationSelect = useCallback(
    (conv: Conversation) => {
      if (!user) return;
      setConversationId(conv._id);
      setActiveConversation(conv as Conversation);
      const participant = conv.participants.find(
        (p: User) => p._id !== user._id
      );
      if (participant) {
        setSelectedUser({
          _id: participant._id,
          username: participant.username || '',
          email: participant.email || '',
        });
      } else {
        setSelectedUser({ _id: conv._id, username: 'Kullanıcı', email: '' });
      }
    },
    [user, setActiveConversation]
  );

  // handleUserSelect fonksiyonunu useCallback ile sarmala
  const handleUserSelect = useCallback(
    async (otherUser: User) => {
      if (!user) return;
      setShowUserModal(false);
      setSelectedUser(otherUser);
      const conv = (conversations as Conversation[]).find((c: Conversation) => {
        const participantIds = c.participants.map((p: User) => p._id);
        return (
          participantIds.includes(otherUser._id) &&
          participantIds.includes(user._id) &&
          participantIds.length === 2
        );
      });
      if (conv) {
        setConversationId(conv._id);
        setActiveConversation(conv as Conversation);
      } else {
        setConversationId(null);
        setActiveConversation(null as unknown as Conversation);
      }
      setUserListKey((k) => k + 1);
    },
    [user, conversations, setActiveConversation]
  );

  // URL değişince conversationId ve focusMessageId'yi güncelle
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlConvId = urlParams.get('conversationId');
    if (urlConvId && urlConvId !== conversationId) {
      setConversationId(urlConvId);
      const conv = (conversations as Conversation[]).find(
        (c: Conversation) => c._id === urlConvId
      );
      if (conv && user) {
        setActiveConversation(conv as Conversation);
        const participant = conv.participants.find(
          (p: User) => p._id !== user._id
        );
        if (participant) {
          setSelectedUser({
            _id: participant._id,
            username: participant.username || '',
            email: participant.email || '',
          });
        } else {
          setSelectedUser({
            _id: conv._id,
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
          {convLoading ? (
            <div className="text-gray-400 text-sm">
              Konuşmalar yükleniyor...
            </div>
          ) : convError ? (
            <div className="text-red-400 text-sm">{convError}</div>
          ) : conversationsState.length === 0 ? (
            <div className="text-gray-400 text-sm">Henüz konuşma yok.</div>
          ) : (
            conversationsState.map((conv) => {
              const participant = conv.participants.find(
                (p: User) => p._id !== user?._id
              );
              const username = participant ? participant.username : 'Kullanıcı';
              const avatarUrl =
                participant && participant.avatarUrl
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
            focusMessageId={focusMessageId || undefined}
            onNewMessage={handleNewMessage}
            onNewConversation={handleNewConversation}
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
