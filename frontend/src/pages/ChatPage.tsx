import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_URL } from '../config';
import UserList from './UserList';
import ChatWindow from '../components/chat/ChatWindow';

interface User {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

interface Conversation {
  _id: string;
  participants: (string | { _id: string })[];
  conversationId?: string;
}

// Bu sayfa, kullanıcı seçimi ve chat penceresini bir arada gösterir
const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Kullanıcı seçildiğinde konuşma başlat
  const handleUserSelect = async (otherUser: User) => {
    if (!user) return;

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
          // participants array'inde hem current user hem de selected user var mı kontrol et
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
          // Mevcut konuşma varsa onu kullan
          setConversationId(conv._id);
        } else {
          // Konuşma yoksa boş olarak başla (ilk mesaj gönderildiğinde oluşacak)
          setConversationId(null);
        }
      }
    } catch (error) {
      console.error('Konuşma kontrolü hatası:', error);
      setConversationId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col md:flex-row">
      {/* Kullanıcı listesi (sol panel) */}
      <div className="md:w-1/3 p-4 border-r border-gray-800 bg-gray-900">
        <h2 className="text-lg font-bold text-white mb-4">Kullanıcılar</h2>
        <UserList
          onUserSelect={handleUserSelect}
          selectedUserId={selectedUser?._id}
          excludeCurrentUser={true}
        />
      </div>
      {/* Chat penceresi (sağ panel) */}
      <div className="flex-1 flex items-center justify-center p-4">
        {selectedUser && user ? (
          <ChatWindow
            conversationId={conversationId}
            currentUserId={user._id}
            otherUser={selectedUser}
          />
        ) : (
          <div className="text-gray-400 text-center">
            Bir kullanıcı seçerek sohbet başlatabilirsin.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
