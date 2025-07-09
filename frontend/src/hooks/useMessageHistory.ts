import { useEffect, useState } from 'react';
import { getMessageHistory } from '../api';
import { useNotification } from '../contexts/NotificationContext';

export function useMessageHistory(conversationId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useNotification();

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getMessageHistory(conversationId)
      .then((data) => setMessages(data.messages))
      .catch((err: { message: string }) => {
        setError(err.message);
        notify(err.message, 'error');
      })
      .finally(() => setLoading(false));
  }, [conversationId, notify]);

  return { messages, loading, error };
}
