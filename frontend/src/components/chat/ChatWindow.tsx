import React, { useEffect, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useSocket } from '../../contexts/SocketContext';
import { useMessageHistory } from '../../hooks/useMessageHistory';
import { sendMessage } from '../../api';

interface Message {
  _id?: string;
  sender: string | { _id: string; username?: string };
  senderName?: string;
  content: string;
  createdAt?: string;
  delivered?: boolean;
  seen?: boolean;
  conversation?: string | { _id: string }; // Added conversation property
}

interface ChatWindowProps {
  conversationId: string | null;
  currentUserId: string;
  otherUser: { _id: string; username: string; avatarUrl?: string };
  focusMessageId?: string;
  onNewMessage?: (conversationId: string, message: string) => void;
  onNewConversation?: (conversationId: string, message: Message) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  currentUserId,
  otherUser,
  focusMessageId,
  onNewMessage,
  onNewConversation,
}) => {
  const { socket } = useSocket();
  const {
    messages,
    loading,
    loadingMore,
    error,
    pagination,
    addMessage,
    updateMessage,
    loadMoreMessages,
  } = useMessageHistory(conversationId, currentUserId);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
      // Mesajın bu conversation'a ait olup olmadığını kontrol et
      const msgConversationId =
        typeof msg.conversation === 'string'
          ? msg.conversation
          : msg.conversation?._id;

      if (msgConversationId === conversationId) {
        addMessage(msg);
        if (onNewMessage && conversationId && msg.content) {
          onNewMessage(conversationId, msg.content);
        }
      }
    };
    socket.on('message_received', handleMessage);
    return () => {
      socket.off('message_received', handleMessage);
    };
  }, [socket, conversationId, addMessage, onNewMessage]);

  // Message status events'lerini dinle
  useEffect(() => {
    if (!socket) return;

    const handleMessageDelivered = (data: {
      messageId: string;
      conversationId: string;
      deliveredAt: string;
    }) => {
      if (data.conversationId === conversationId) {
        updateMessage(data.messageId, {
          delivered: true,
          deliveredAt: data.deliveredAt,
        });
      }
    };

    const handleMessageSeen = (data: {
      messageId: string;
      conversationId: string;
      seenAt: string;
    }) => {
      if (data.conversationId === conversationId) {
        updateMessage(data.messageId, { seen: true, seenAt: data.seenAt });
      }
    };

    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_seen', handleMessageSeen);

    return () => {
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_seen', handleMessageSeen);
    };
  }, [socket, conversationId, updateMessage]);

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

  // Konuşmaya girildiğinde okunmamış mesajları seen olarak işaretle
  useEffect(() => {
    if (!socket || !conversationId || !messages.length) return;

    // Konuşmaya ilk girildiğinde tüm okunmamış mesajları seen olarak işaretle
    const unreadMessages = messages.filter((msg) => {
      const senderId =
        typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
      return senderId !== currentUserId && !msg.seen;
    });

    unreadMessages.forEach((msg) => {
      socket.emit('mark_seen', { messageId: msg._id });
    });
  }, [socket, conversationId, messages, currentUserId]);

  // Okunmamış mesaja scroll yap
  useEffect(() => {
    const handleScrollToUnread = (e: CustomEvent<{ messageIndex: number }>) => {
      const container = messagesContainerRef.current;
      if (!container || !messages.length) return;

      const messageIndex = e.detail.messageIndex;
      const messageElements = container.querySelectorAll(
        '[data-message-index]'
      );

      if (messageElements[messageIndex]) {
        messageElements[messageIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    };

    const handleScrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    window.addEventListener(
      'scrollToUnreadMessage',
      handleScrollToUnread as EventListener
    );
    window.addEventListener('scrollToBottom', handleScrollToBottom);

    return () => {
      window.removeEventListener(
        'scrollToUnreadMessage',
        handleScrollToUnread as EventListener
      );
      window.removeEventListener('scrollToBottom', handleScrollToBottom);
    };
  }, [messages]);

  // Scroll detection for pagination
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (
        container.scrollTop === 0 &&
        pagination?.hasNextPage &&
        !loadingMore
      ) {
        console.log('Triggering loadMoreMessages');
        loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [pagination?.hasNextPage, loadingMore, loadMoreMessages]);

  // Mesajlar güncellendiğinde scroll pozisyonunu koru
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !loadingMore) return;

    // Yeni mesajlar yüklendiğinde scroll pozisyonunu koru
    const timer = setTimeout(() => {
      // Basit yaklaşım: Load More seviyesinde kal
      // Bu şekilde kullanıcı nerede olduğunu biliyor
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, loadingMore]);

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

  // Otomatik delivered işaretlemeyi kaldırdık - sadece toast gösterildiğinde olacak

  // Typing eventini emit et
  const handleTyping = (isTyping: boolean) => {
    if (!socket || !conversationId) return;
    socket.emit('typing', { conversationId, isTyping });
  };

  const handleSend = async (text: string) => {
    if (!otherUser?._id) return;
    if (!conversationId) {
      // İlk mesaj, yeni konuşma başlat
      try {
        const res = await sendMessage(otherUser._id, text);
        if (res && res.data && res.conversationId) {
          addMessage(res.data);
          if (onNewConversation) {
            onNewConversation(res.conversationId, res.data);
          }
          if (onNewMessage) {
            onNewMessage(res.conversationId, text);
          }
        }
      } catch {
        // Hata yönetimi eklenebilir
      }
    } else {
      if (!socket) return;
      const msg = {
        receiver: otherUser._id,
        content: text,
      };
      socket.emit('send_message', msg);
      if (onNewMessage && conversationId) {
        onNewMessage(conversationId, text);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 rounded-2xl shadow-lg flex flex-col h-[70vh]">
      <ChatHeader
        title={otherUser.username}
        avatarUrl={otherUser.avatarUrl}
        subtitle={isOtherTyping ? 'Yazıyor...' : 'Sohbet aktif'}
      />
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 bg-gray-900"
      >
        {/* Load More Button */}
        {pagination?.hasNextPage && (
          <div className="text-center mb-4">
            {loadingMore ? (
              <div className="text-gray-400 text-sm">
                Eski mesajlar yükleniyor...
              </div>
            ) : (
              <button
                onClick={loadMoreMessages}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Daha Fazla Mesaj Yükle
              </button>
            )}
          </div>
        )}

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
                data-message-index={i}
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
                      : typeof msg.sender === 'object' && msg.sender.username
                  }
                  time={
                    msg.createdAt &&
                    new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  }
                  delivered={msg.delivered}
                  seen={msg.seen}
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
