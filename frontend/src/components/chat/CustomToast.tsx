import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface CustomToastProps {
  avatarUrl?: string;
  username: string;
  message: string;
  onClose: () => void;
  autoDismiss?: boolean;
  duration?: number;
  conversationId?: string;
}

const CustomToast: React.FC<CustomToastProps> = ({
  avatarUrl,
  username,
  message,
  onClose,
  autoDismiss = true,
  duration = 4000, // 4 saniye
  conversationId,
}) => {
  const navigate = useNavigate();

  // Otomatik kaybolma
  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, duration, onClose]);

  const handleClick = () => {
    if (conversationId) {
      // Chat sayfasına yönlendir ve konuşmayı aç
      navigate(`/chat?conversationId=${conversationId}`);
    }
    onClose();
  };

  return (
    <div
      className={`fixed top-6 right-6 z-50 bg-gray-900 border border-blue-400 rounded-xl shadow-lg flex items-center p-4 min-w-[280px] max-w-xs animate-fade-in ${
        conversationId
          ? 'cursor-pointer hover:bg-gray-800 transition-colors'
          : ''
      }`}
      onClick={conversationId ? handleClick : undefined}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          className="w-12 h-12 rounded-full object-cover mr-3"
        />
      ) : (
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center text-white mr-3">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5Z"
            />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white truncate">{username}</div>
        <div className="text-gray-300 text-sm truncate max-w-[180px]">
          {message}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Toast'a tıklamayı engelle
          onClose();
        }}
        className="ml-3 text-gray-400 hover:text-white text-lg"
      >
        ×
      </button>
    </div>
  );
};

export default CustomToast;
