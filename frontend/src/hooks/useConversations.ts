import { useEffect, useState } from 'react';
import { getConversationList } from '../api';
import { useNotification } from '../contexts/NotificationContext';

export function useConversations() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useNotification();

  useEffect(() => {
    setLoading(true);
    setError(null);
    getConversationList()
      .then((data) => setConversations(data.conversations))
      .catch((err: { message: string }) => {
        setError(err.message);
        notify(err.message, 'error');
      })
      .finally(() => setLoading(false));
  }, [notify]);

  return { conversations, loading, error };
}
