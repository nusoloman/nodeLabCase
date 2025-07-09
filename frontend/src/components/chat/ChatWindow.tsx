import React, { useEffect, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useSocket } from '../../contexts/SocketContext';
import { API_URL } from '../../config';

interface Message {
  _id?: string;
  sender: string | { _id: string; username?: string };
  senderName?: string;
  content: string;
  createdAt?: string;
}

interface ChatWindowProps {
  conversationId: string | null;
  currentUserId: string;
  otherUser: { _id: string; username: string; avatarUrl?: string };
  onNewMessage?: (conversationId: string, message: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  currentUserId,
  otherUser,
  onNewMessage,
}) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Odaya katıl ve geçmiş mesajları çek (sadece conversationId varsa)
  useEffect(() => {
    if (!socket) return;

    if (conversationId) {
      // Mevcut conversation varsa history çek
      socket.emit('join_room', conversationId);
      setLoading(true);
      fetch(`${API_URL}/message/history/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      })
        .then((res) => res.json())
        .then((data) => setMessages(data.messages || []))
        .finally(() => setLoading(false));
    } else {
      // Conversation yoksa boş başla
      setMessages([]);
      setLoading(false);
    }
  }, [socket, conversationId]);

  // Gelen mesajları dinle
  useEffect(() => {
    if (!socket) return;
    const handleMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      if (conversationId && onNewMessage && msg.content) {
        onNewMessage(conversationId, msg.content);
      }
    };
    socket.on('message_received', handleMessage);
    return () => {
      socket.off('message_received', handleMessage);
    };
  }, [socket, conversationId, onNewMessage]);

  // Typing eventini dinle
  useEffect(() => {
    if (!socket || !conversationId) return;
    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      // Sadece karşı kullanıcı typing ise göster
      if (data.userId === otherUser._id) {
        setIsOtherTyping(data.isTyping);
      }
    };
    socket.on('typing', handleTyping);
    return () => {
      socket.off('typing', handleTyping);
    };
  }, [socket, conversationId, otherUser._id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing eventini emit et
  const handleTyping = (isTyping: boolean) => {
    if (!socket || !conversationId) return;
    socket.emit('typing', { conversationId, isTyping });
  };

  const handleSend = (text: string) => {
    if (!socket) return;
    const msg = {
      receiver: otherUser._id,
      content: text,
    };
    socket.emit('send_message', msg);
    // setMessages ile hemen ekleme YOK, sadece event ile eklenecek
    if (conversationId && onNewMessage) {
      onNewMessage(conversationId, text);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 rounded-2xl shadow-lg flex flex-col h-[70vh]">
      <ChatHeader
        title={otherUser.username}
        avatarUrl={otherUser.avatarUrl}
        subtitle={isOtherTyping ? 'Yazıyor...' : 'Sohbet aktif'}
      />
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-900">
        {loading ? (
          <div className="text-center text-gray-400">
            Mesajlar yükleniyor...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">
            Henüz mesaj yok. İlk mesajı sen gönder!
          </div>
        ) : (
          messages.map((msg, i) => {
            const senderId =
              typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
            const isOwn = senderId === currentUserId;
            return (
              <MessageBubble
                key={msg._id || i}
                message={msg.content}
                isOwn={isOwn}
                senderName={
                  isOwn
                    ? undefined
                    : (typeof msg.sender === 'object' && msg.sender.username) ||
                      otherUser.username
                }
                time={
                  msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : undefined
                }
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
};

export default ChatWindow;
