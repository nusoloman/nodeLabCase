import { useEffect, useState, useCallback, useRef } from 'react';
import { getMessageHistory } from '../api';
import { useNotification } from '../contexts/NotificationContext';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalMessages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export function useMessageHistory(
  conversationId: string | null,
  currentUserId?: string
) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const { notify } = useNotification();
  const currentPageRef = useRef(1);

  // İlk yükleme
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      setPagination(null);
      currentPageRef.current = 1;
      return;
    }

    setLoading(true);
    setError(null);
    currentPageRef.current = 1;

    getMessageHistory(conversationId, 1, 50)
      .then((data) => {
        setMessages(data.messages);
        setPagination(data.pagination);

        // Okunmamış ilk mesajı bul ve scroll pozisyonunu ayarla
        setTimeout(() => {
          const unreadMessageIndex = data.messages.findIndex((msg: any) => {
            const senderId =
              typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
            // Kendi mesajım değilse ve okunmamışsa
            return senderId !== currentUserId && !msg.seen;
          });

          if (unreadMessageIndex !== -1) {
            // Okunmamış mesaj varsa, o mesaja scroll yap
            const event = new CustomEvent('scrollToUnreadMessage', {
              detail: { messageIndex: unreadMessageIndex },
            });
            window.dispatchEvent(event);
          } else {
            // Okunmamış mesaj yoksa en alta scroll yap
            const event = new CustomEvent('scrollToBottom');
            window.dispatchEvent(event);
          }
        }, 100);
      })
      .catch((err: { message: string }) => {
        setError(err.message);
        notify(err.message, 'error');
      })
      .finally(() => setLoading(false));
  }, [conversationId, notify]);

  // Daha fazla mesaj yükle (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !pagination?.hasNextPage || loadingMore) return;

    setLoadingMore(true);
    const nextPage = currentPageRef.current + 1;

    try {
      const data = await getMessageHistory(conversationId, nextPage, 50);

      setMessages((prev) => {
        const newMessages = [...data.messages, ...prev]; // Eski mesajları üste ekle
        return newMessages;
      });
      setPagination(data.pagination);
      currentPageRef.current = nextPage;
    } catch (err: any) {
      setError(err.message);
      notify(err.message, 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, pagination?.hasNextPage, loadingMore, notify]);

  // Add a function to append a new message
  const addMessage = useCallback((msg: any) => {
    setMessages((prev) => {
      // Prevent duplicate messages by _id
      if (msg._id && prev.some((m) => m._id === msg._id)) return prev;
      return [...prev, msg];
    });
  }, []);

  // Mesajı güncelle (ör. seen, delivered)
  const updateMessage = useCallback((id: string, updates: Partial<any>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg._id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  return {
    messages,
    loading,
    loadingMore,
    error,
    pagination,
    addMessage,
    updateMessage,
    loadMoreMessages,
  };
}
