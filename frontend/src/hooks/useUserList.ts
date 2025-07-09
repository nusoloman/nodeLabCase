import { useEffect, useState } from 'react';
import { getUserList } from '../api';
import { useNotification } from '../contexts/NotificationContext';

export function useUserList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useNotification();

  useEffect(() => {
    setLoading(true);
    setError(null);
    getUserList()
      .then((data) => setUsers(data.users))
      .catch((err: { message: string }) => {
        setError(err.message);
        notify(err.message, 'error');
      })
      .finally(() => setLoading(false));
  }, [notify]);

  return { users, loading, error };
}
