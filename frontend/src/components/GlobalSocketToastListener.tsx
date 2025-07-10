import { useEffect, useState, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../hooks/useAuth';
import { useGlobalState } from '../contexts/GlobalStateContext';
import CustomToast from './chat/CustomToast';

interface MessageData {
  _id: string;
  sender:
    | {
        _id: string;
        username?: string;
        email?: string;
        avatarUrl?: string;
      }
    | string;
  receiver: string;
  content: string;
  conversation: string;
  createdAt: string;
}

const GlobalSocketToastListener = () => {
  const { socket, status } = useSocket();
  const { user } = useAuth();
  const { activeConversationId } = useGlobalState();
  const activeConversationIdRef = useRef(activeConversationId);
  const [toast, setToast] = useState<null | {
    avatarUrl?: string;
    username: string;
    message: string;
    messageId?: string;
    conversationId?: string;
  }>(null);

  // activeConversationId'yi ref'te güncelle
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    if (!socket || !user || status !== 'connected') {
      return;
    }

    const handleMessageReceived = (msg: MessageData) => {
      const receiverId = msg.receiver;

      // Sadece bu kullanıcıya gelen mesajlar için bildirim göster
      if (receiverId === user._id) {
        const msgConversationId = msg.conversation;

        // Eğer kullanıcı zaten o konuşmanın içindeyse toast gösterme
        if (activeConversationIdRef.current === msgConversationId) {
          return;
        }

        const sender = typeof msg.sender === 'object' ? msg.sender : undefined;

        setToast({
          avatarUrl: sender?.avatarUrl,
          username: sender?.username || 'Kullanıcı',
          message: msg.content,
          messageId: msg._id,
          conversationId: msgConversationId,
        });
      }
    };

    socket.on('message_received', handleMessageReceived);

    return () => {
      socket.off('message_received', handleMessageReceived);
    };
  }, [socket, user, status]); // activeConversationId'yi dependency'den çıkardık

  useEffect(() => {
    if (toast && toast.messageId) {
      // Toast gösterildiğinde mesajı delivered olarak işaretle
      if (socket) {
        socket.emit('mark_delivered', { messageId: toast.messageId });
      }
    }
  }, [toast, socket]);

  if (!toast) return null;

  return (
    <CustomToast
      avatarUrl={toast.avatarUrl}
      username={toast.username}
      message={toast.message}
      onClose={() => setToast(null)}
      autoDismiss={true}
      duration={4000} // 4 saniye
      conversationId={toast.conversationId}
    />
  );
};

export default GlobalSocketToastListener;
