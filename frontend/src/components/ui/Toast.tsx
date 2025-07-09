import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';

const typeStyles = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
};

const icons = {
  success: (
    <svg
      className="w-5 h-5 mr-2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),
  error: (
    <svg
      className="w-5 h-5 mr-2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  info: (
    <svg
      className="w-5 h-5 mr-2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01"
      />
    </svg>
  ),
};

// Tailwind animation classes (add these to your tailwind.config if needed)
// .animate-slide-in { @apply transition-all duration-300 transform translate-y-8 opacity-0; }
// .animate-slide-in-active { @apply translate-y-0 opacity-100; }

const Toast: React.FC = () => {
  const { notifications, remove } = useNotification();

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-3 items-start">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-center px-4 py-3 rounded-lg shadow-lg animate-toast-in ${
            typeStyles[n.type]
          } min-w-[220px] max-w-xs`}
        >
          {icons[n.type]}
          <span className="flex-1">{n.message}</span>
          <button
            className="ml-2 text-white/70 hover:text-white text-lg font-bold focus:outline-none"
            onClick={() => remove(n.id)}
            aria-label="Kapat"
          >
            ×
          </button>
        </div>
      ))}
      <style jsx>{`
        @keyframes toast-in {
          0% {
            opacity: 0;
            transform: translateY(32px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-toast-in {
          animation: toast-in 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
};

export default Toast;
