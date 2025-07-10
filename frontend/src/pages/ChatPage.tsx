import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import UserList from './UserList';
import ChatWindow from '../components/chat/ChatWindow';
import ScheduleMessageModal from '../components/chat/ScheduleMessageModal';
import MessageSearchModal from '../components/chat/MessageSearchModal';
import { Clock, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useConversations } from '../hooks/useConversations';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { useSocket } from '../contexts/SocketContext';

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
  lastMessage?: {
    content: string;
    sender: string;
    receiver: string;
    seen: boolean;
    createdAt: string;
  };
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
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const focusMessageId = params.get('focusMessageId');
  const focusMessagePage = params.get('focusMessagePage');
  const {
    setActiveConversation,
    setActiveConversationId,
    activeConversationId,
  } = useGlobalState();
  const [conversationsState, setConversationsState] = useState<Conversation[]>(
    []
  );

  // Sync conversationsState with useConversations
  useEffect(() => {
    setConversationsState(conversations as Conversation[]);
  }, [conversations]);

  // handleNewMessage fonksiyonunu useCallback ile sarmala
  const handleNewMessage = useCallback(
    (convId: string, msg: string) => {
      // Konuşma listesini güncelle
      setConversationsState((prev) =>
        prev.map((conv) =>
          conv._id === convId
            ? {
                ...conv,
                lastMessage: {
                  content: msg,
                  sender: user?._id || '',
                  receiver:
                    conv.participants.find((p) => p._id !== user?._id)?._id ||
                    '',
                  seen: false,
                  createdAt: new Date().toISOString(),
                },
              }
            : conv
        )
      );
    },
    [user?._id]
  );

  // handleNewConversation fonksiyonunu useCallback ile sarmala
  const handleNewConversation = useCallback(
    async (newConvId: string, message: Message) => {
      setConversationId(newConvId);

      // Yeni konuşmayı listeye ekle
      const newConversation: Conversation = {
        _id: newConvId,
        participants: selectedUser ? [selectedUser, user!] : [],
        lastMessage: {
          content: message.content,
          sender: user?._id || '',
          receiver: selectedUser?._id || '',
          seen: false,
          createdAt: new Date().toISOString(),
        },
      };

      setConversationsState((prev) => [newConversation, ...prev]);
    },
    [selectedUser, user]
  );

  // handleConversationSelect fonksiyonunu useCallback ile sarmala
  const handleConversationSelect = useCallback(
    (conv: Conversation) => {
      if (!user) return;
      setConversationId(conv._id);
      setActiveConversation(conv as Conversation);
      setActiveConversationId(conv._id); // Bunu ekledik!

      // URL'yi güncelle
      navigate(`?conversationId=${conv._id}`, { replace: true });

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
    [user, setActiveConversation, setActiveConversationId, navigate]
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
        setActiveConversationId(conv._id);
      } else {
        setConversationId(null);
        setActiveConversation(null as unknown as Conversation);
        setActiveConversationId(null);
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

      // Önce conversationsState'te ara, yoksa conversations'ta ara
      let conv = conversationsState.find(
        (c: Conversation) => c._id === urlConvId
      );

      if (!conv) {
        conv = (conversations as Conversation[]).find(
          (c: Conversation) => c._id === urlConvId
        );
      }

      if (conv && user) {
        setActiveConversation(conv as Conversation);
        setActiveConversationId(conv._id);
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
  }, [
    location.search,
    conversationsState,
    conversations,
    user,
    conversationId,
  ]);

  // Konuşmalar yüklendiğinde URL'deki conversationId'yi kontrol et
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlConvId = urlParams.get('conversationId');

    if (
      urlConvId &&
      (conversationsState.length > 0 || conversations.length > 0) &&
      (!selectedUser ||
        !activeConversationId ||
        activeConversationId !== urlConvId)
    ) {
      let conv = conversationsState.find(
        (c: Conversation) => c._id === urlConvId
      );

      if (!conv) {
        conv = (conversations as Conversation[]).find(
          (c: Conversation) => c._id === urlConvId
        );
      }

      if (conv && user) {
        setConversationId(urlConvId);
        setActiveConversation(conv as Conversation);
        setActiveConversationId(urlConvId);
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
  }, [
    conversationsState,
    conversations,
    user,
    selectedUser,
    activeConversationId,
  ]);

  // conversationId değiştiğinde global state'i güncelle
  useEffect(() => {
    setActiveConversationId(conversationId);
  }, [conversationId, setActiveConversationId]);

  const { socket, status, reconnect, connectionError } = useSocket();

  // WebSocket ile gerçek zamanlı konuşma listesi güncelleme
  useEffect(() => {
    if (!socket || !user) return;

    const handleMessageReceived = (msg: {
      conversation: string | { _id: string };
      content: string;
      sender: string | { _id: string };
      receiver: string;
      createdAt: string;
    }) => {
      const msgConversationId =
        typeof msg.conversation === 'string'
          ? msg.conversation
          : msg.conversation?._id;

      // Konuşma listesini güncelle
      setConversationsState((prev) =>
        prev.map((conv) =>
          conv._id === msgConversationId
            ? {
                ...conv,
                lastMessage: {
                  content: msg.content,
                  sender:
                    typeof msg.sender === 'object'
                      ? msg.sender._id
                      : msg.sender,
                  receiver: msg.receiver,
                  seen: false, // Yeni gelen mesaj okunmamış
                  createdAt: msg.createdAt,
                },
              }
            : conv
        )
      );
    };

    const handleMessageSeen = (data: {
      messageId: string;
      conversationId: string;
      seenAt: string;
    }) => {
      // Mesaj okunduğunda konuşma listesini güncelle
      setConversationsState((prev) =>
        prev.map((conv) =>
          conv._id === data.conversationId
            ? {
                ...conv,
                lastMessage: conv.lastMessage
                  ? {
                      ...conv.lastMessage,
                      seen: true,
                    }
                  : conv.lastMessage,
              }
            : conv
        )
      );
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('message_seen', handleMessageSeen);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('message_seen', handleMessageSeen);
    };
  }, [socket, user]);

  // Artık AuthContext'te yapıldığı için bu kısmı kaldırdık
  // useEffect(() => {
  //   if (connected && socket && conversations.length > 0) {
  //     console.log('Joining all conversations:', conversations.length);
  //     conversations.forEach((conv: Conversation) => {
  //       joinConversation(conv._id);
  //     });
  //   }
  // }, [connected, socket, conversations, joinConversation]);

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

        {/* WebSocket Bağlantı Durumu */}
        <div className="mb-4 p-2 rounded-lg bg-gray-800 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  status === 'connected'
                    ? 'bg-green-500'
                    : status === 'reconnecting'
                    ? 'bg-yellow-500'
                    : status === 'error'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                }`}
              ></div>
              <span className="text-sm text-gray-300">
                {status === 'connected'
                  ? 'Çevrimiçi'
                  : status === 'reconnecting'
                  ? 'Yeniden bağlanıyor...'
                  : status === 'error'
                  ? 'Bağlantı hatası'
                  : 'Bağlantı yok'}
              </span>
            </div>
            {status === 'error' && (
              <button
                onClick={reconnect}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
              >
                Yeniden Bağlan
              </button>
            )}
          </div>
          {connectionError && (
            <div className="text-xs text-red-400 mt-1">{connectionError}</div>
          )}
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
            // Unread (okunmamış) konuşmaları en üste al
            [...conversationsState]
              .sort((a, b) => {
                // Okunmamış mesajları en üste al
                const aUnread =
                  a.lastMessage &&
                  !a.lastMessage.seen &&
                  a.lastMessage.receiver === user?._id;
                const bUnread =
                  b.lastMessage &&
                  !b.lastMessage.seen &&
                  b.lastMessage.receiver === user?._id;

                if (aUnread && !bUnread) return -1;
                if (!aUnread && bUnread) return 1;

                // Okunmamış mesaj durumu aynıysa, son mesaj tarihine göre sırala (en yeni en altta)
                if (a.lastMessage && b.lastMessage) {
                  return (
                    new Date(a.lastMessage.createdAt).getTime() -
                    new Date(b.lastMessage.createdAt).getTime()
                  );
                }

                return 0;
              })
              .map((conv) => {
                const participant = conv.participants.find(
                  (p: User) => p._id !== user?._id
                );
                const username = participant
                  ? participant.username
                  : 'Kullanıcı';
                const avatarUrl =
                  participant && participant.avatarUrl
                    ? participant.avatarUrl
                    : undefined;
                const lastMsg = conv.lastMessage?.content || '';
                const isUnread =
                  conv.lastMessage &&
                  !conv.lastMessage.seen &&
                  conv.lastMessage.receiver === user?._id;

                return (
                  <button
                    key={conv._id}
                    className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg transition-colors border-2 ${
                      conv._id === conversationId
                        ? 'bg-purple-700 text-white border-purple-700'
                        : isUnread
                        ? 'bg-blue-900 text-white border-blue-400'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-transparent'
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
                      <div
                        className={`font-semibold truncate ${
                          isUnread ? 'text-blue-200' : ''
                        }`}
                      >
                        {username}
                        {isUnread && (
                          <span className="ml-2 inline-block w-2 h-2 bg-blue-400 rounded-full"></span>
                        )}
                      </div>
                      {lastMsg && (
                        <div
                          className={`text-xs truncate max-w-[140px] ${
                            isUnread ? 'text-blue-300' : 'text-gray-400'
                          }`}
                        >
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
            focusMessagePage={
              focusMessagePage !== null && focusMessagePage !== undefined
                ? Number(focusMessagePage)
                : undefined
            }
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
        <div
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 px-2"
          onClick={() => setShowUserModal(false)}
        >
          <div
            className="w-full max-w-3xl mx-auto bg-gray-900 rounded-2xl shadow-2xl p-8 relative animate-fade-in"
            style={{ minWidth: '320px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl focus:outline-none"
              onClick={() => setShowUserModal(false)}
              aria-label="Kapat"
            >
              ×
            </button>
            <h3 className="text-xl font-bold text-white mb-6">
              Yeni Sohbet Başlat
            </h3>
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
