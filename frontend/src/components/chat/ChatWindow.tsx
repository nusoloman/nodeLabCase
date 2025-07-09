import React, { useEffect, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useSocket } from '../../contexts/SocketContext';
import { useMessageHistory } from '../../hooks/useMessageHistory';

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
  focusMessageId?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  currentUserId,
  otherUser,
  onNewMessage,
  focusMessageId,
}) => {
  const { socket } = useSocket();
  const { messages, loading, error } = useMessageHistory(conversationId);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Odaya katıl (sadece conversationId varsa)
  useEffect(() => {
    if (!socket) return;
    if (conversationId) {
      socket.emit('join_room', conversationId);
    }
  }, [socket, conversationId]);

  // Gelen mesajları dinle (real-time ekleme)
  useEffect(() => {
    if (!socket) return;
    const handleMessage = (msg: Message) => {
      // Eğer aynı id'ye sahip mesaj zaten varsa ekleme
      if (msg._id && messages.some((m) => m._id === msg._id)) {
        return;
      }
      // Sadece yeni mesajı ekle (bu hook'un state'ini güncelleyemezsin, burada notification veya başka bir şey yapılabilir)
      if (conversationId && onNewMessage && msg.content) {
        onNewMessage(conversationId, msg.content);
      }
    };
    socket.on('message_received', handleMessage);
    return () => {
      socket.off('message_received', handleMessage);
    };
  }, [socket, conversationId, onNewMessage, messages]);

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

  // focusMessageId varsa ilgili mesaja scroll/focus yap
  useEffect(() => {
    if (focusMessageId && messageRefs.current[focusMessageId]) {
      messageRefs.current[focusMessageId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      messageRefs.current[focusMessageId]?.classList.add(
        'ring-2',
        'ring-purple-500'
      );
      setTimeout(() => {
        messageRefs.current[focusMessageId]?.classList.remove(
          'ring-2',
          'ring-purple-500'
        );
      }, 2000);
    }
  }, [focusMessageId, messages]);

  // window'dan focusMessage eventini dinle
  useEffect(() => {
    const handler = (e: CustomEvent<{ messageId: string }>) => {
      const id = e.detail?.messageId;
      if (id && messageRefs.current[id]) {
        messageRefs.current[id]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        messageRefs.current[id]?.classList.add('ring-2', 'ring-purple-500');
        setTimeout(() => {
          messageRefs.current[id]?.classList.remove(
            'ring-2',
            'ring-purple-500'
          );
        }, 2000);
      }
    };
    window.addEventListener('focusMessage', handler as EventListener);
    return () =>
      window.removeEventListener('focusMessage', handler as EventListener);
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
        ) : error ? (
          <div className="text-center text-red-400">{error}</div>
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
              <div
                key={msg._id || i}
                ref={(el) => {
                  if (msg._id) messageRefs.current[msg._id] = el;
                }}
              >
                <MessageBubble
                  message={msg.content}
                  isOwn={isOwn}
                  senderName={
                    isOwn
                      ? undefined
                      : (typeof msg.sender === 'object' &&
                          msg.sender.username) ||
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
              </div>
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
