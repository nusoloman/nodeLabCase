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
  currentUserId?: string,
  initialPage?: number,
  forceLoadAllToPage?: boolean,
  focusMessageId?: string // aranan mesajın id'si
) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const { notify } = useNotification();
  const currentPageRef = useRef(initialPage || 1);

  // İlk yükleme
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      setPagination(null);
      currentPageRef.current = initialPage || 1;
      return;
    }

    setLoading(true);
    setError(null);
    currentPageRef.current = initialPage || 1;

    // Eğer arama ile gelindiyse (forceLoadAllToPage true), 1. sayfadan initialPage'e kadar tüm mesajları sırayla yükle
    if (forceLoadAllToPage && initialPage && initialPage > 1) {
      (async () => {
        let allMessages: any[] = [];
        for (let page = 1; page <= initialPage; page++) {
          // eslint-disable-next-line no-await-in-loop
          const data = await getMessageHistory(conversationId, page, 50);
          allMessages = [...allMessages, ...data.messages];
          if (page === initialPage) {
            setPagination(data.pagination); // son yüklenen sayfanın pagination'ı
          }
        }
        setMessages(allMessages);
        setTimeout(() => {
          const unreadMessageIndex = allMessages.findIndex((msg: any) => {
            const senderId =
              typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
            return senderId !== currentUserId && !msg.seen;
          });
          if (unreadMessageIndex !== -1) {
            const event = new CustomEvent('scrollToUnreadMessage', {
              detail: { messageIndex: unreadMessageIndex },
            });
            window.dispatchEvent(event);
          } else {
            const event = new CustomEvent('scrollToBottom');
            window.dispatchEvent(event);
          }
        }, 100);
        setLoading(false);
      })();
      return;
    } else {
      // Standart: en yeni sayfadan başla
      getMessageHistory(conversationId, currentPageRef.current, 50)
        .then((data) => {
          setMessages(data.messages);
          setPagination(data.pagination);
          setTimeout(() => {
            const unreadMessageIndex = data.messages.findIndex((msg: any) => {
              const senderId =
                typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
              return senderId !== currentUserId && !msg.seen;
            });
            if (unreadMessageIndex !== -1) {
              const event = new CustomEvent('scrollToUnreadMessage', {
                detail: { messageIndex: unreadMessageIndex },
              });
              window.dispatchEvent(event);
            } else {
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
    }
  }, [conversationId, notify, initialPage, currentUserId, forceLoadAllToPage]);

  // Arama ile gelindiyse ve aranan mesaj yüklü değilse, otomatik olarak loadMoreMessages çağır

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

  // Belirli bir sayfadan mesajları yükle
  const loadMessagesAtPage = useCallback(
    async (page: number) => {
      if (!conversationId) return;
      setLoading(true);
      try {
        const data = await getMessageHistory(conversationId, page, 50);
        setMessages(data.messages);
        setPagination(data.pagination);
        currentPageRef.current = page;
      } catch (err: any) {
        setError(err.message);
        notify(err.message, 'error');
      } finally {
        setLoading(false);
      }
    },
    [conversationId, notify]
  );

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
    loadMessagesAtPage,
  };
}
