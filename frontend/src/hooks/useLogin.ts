import { useState } from 'react';
import { login as apiLogin } from '../api';
import { useNotification } from '../contexts/NotificationContext';

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useNotification();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiLogin(email, password);
      return data;
    } catch (err: any) {
      setError(err.message);
      notify(err.message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
