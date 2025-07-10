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

    // Eğer arama ile gelindiyse (forceLoadAllToPage true), 1. sayfadan initialPage'e kadar tüm mesajları sırayla yükle
    if (forceLoadAllToPage && initialPage && initialPage > 1) {
      currentPageRef.current = initialPage;
      (async () => {
        let allMessages: any[] = [];
        for (let page = 1; page <= initialPage; page++) {
          // eslint-disable-next-line no-await-in-loop
          const data = await getMessageHistory(conversationId, page, 50);
          // Duplicate mesajları önle
          const newMessages = data.messages.filter(
            (msg: any) =>
              !allMessages.some(
                (existingMsg: any) => existingMsg._id === msg._id
              )
          );
          allMessages = [...allMessages, ...newMessages];
          if (page === initialPage) {
            setPagination(data.pagination); // son yüklenen sayfanın pagination'ı
          }
        }
        // Mesajları createdAt'e göre sırala
        allMessages.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
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
      // Standart: Önce toplam sayfa sayısını al, sonra en son sayfadan başla
      (async () => {
        try {
          // Önce sayfa 1'i yükle (sadece pagination bilgisi için)
          const firstPageData = await getMessageHistory(conversationId, 1, 50);
          const totalPages = firstPageData.pagination.totalPages;

          // En son sayfadan başla (en yeni mesajlar)
          const startPage = initialPage || totalPages;
          currentPageRef.current = startPage;

          const data = await getMessageHistory(conversationId, startPage, 50);
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
        } catch (err: any) {
          setError(err.message);
          notify(err.message, 'error');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [conversationId, notify, initialPage, currentUserId, forceLoadAllToPage]);

  // Arama ile gelindiyse ve aranan mesaj yüklü değilse, otomatik olarak loadMoreMessages çağır

  // Daha fazla mesaj yükle (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !pagination?.hasPrevPage || loadingMore) return;

    setLoadingMore(true);
    const prevPage = currentPageRef.current - 1;

    try {
      const data = await getMessageHistory(conversationId, prevPage, 50);

      setMessages((prev) => {
        // Duplicate mesajları önle
        const newMessages = data.messages.filter(
          (msg: any) =>
            !prev.some((existingMsg: any) => existingMsg._id === msg._id)
        );
        // Eski mesajları üste ekle ve createdAt'e göre sırala
        const combinedMessages = [...newMessages, ...prev];
        return combinedMessages.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      setPagination(data.pagination);
      currentPageRef.current = prevPage;
    } catch (err: any) {
      setError(err.message);
      notify(err.message, 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, pagination?.hasPrevPage, loadingMore, notify]);

  // Belirli bir sayfadan mesajları yükle
  const loadMessagesAtPage = useCallback(
    async (page: number) => {
      if (!conversationId) return;
      setLoading(true);
      try {
        const data = await getMessageHistory(conversationId, page, 50);
        setMessages((prev) => {
          // Duplicate mesajları önle
          const newMessages = data.messages.filter(
            (msg: any) =>
              !prev.some((existingMsg: any) => existingMsg._id === msg._id)
          );
          // Yeni mesajları ekle ve createdAt'e göre sırala
          const combinedMessages = [...prev, ...newMessages];
          return combinedMessages.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
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
      // Yeni mesajı ekle ve createdAt'e göre sırala
      const newMessages = [...prev, msg];
      return newMessages.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
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
