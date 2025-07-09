import { useState } from 'react';
import { register as apiRegister } from '../api';
import { useNotification } from '../contexts/NotificationContext';

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { notify } = useNotification();

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRegister(username, email, password);
      notify('Kayıt başarılı! Giriş yapabilirsiniz.', 'success');
      return { data, success: true };
    } catch (err: unknown) {
      let message = 'Bir hata oluştu';
      if (err instanceof Error) message = err.message;
      setError(message);
      notify(message, 'error');
      return { data: null, success: false };
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
}
