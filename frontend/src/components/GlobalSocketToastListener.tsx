import { useEffect, useState } from 'react';
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
      }
    | string;
  receiver: string;
  content: string;
  conversation: string;
  createdAt: string;
}

const GlobalSocketToastListener = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { activeConversationId } = useGlobalState();
  const [toast, setToast] = useState<null | {
    avatarUrl?: string;
    username: string;
    message: string;
    messageId?: string;
    conversationId?: string;
  }>(null);

  useEffect(() => {
    if (!socket || !user) {
      return;
    }

    const handleMessageReceived = (msg: MessageData) => {
      const receiverId =
        typeof msg.receiver === 'object' ? msg.receiver._id : msg.receiver;

      // Sadece bu kullanıcıya gelen mesajlar için bildirim göster
      if (receiverId === user._id) {
        const msgConversationId =
          typeof msg.conversation === 'string'
            ? msg.conversation
            : msg.conversation?._id;

        // Eğer kullanıcı zaten o konuşmanın içindeyse toast gösterme
        if (activeConversationId === msgConversationId) {
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
  }, [socket, user, activeConversationId]);

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
