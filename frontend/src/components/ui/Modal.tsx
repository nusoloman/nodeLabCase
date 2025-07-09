import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  className = '',
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm px-2">
      <div
        className={`w-full max-w-3xl mx-auto bg-gray-900 rounded-2xl shadow-2xl p-8 relative animate-fade-in ${className}`}
        style={{ minWidth: '320px' }}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl focus:outline-none"
          onClick={onClose}
          aria-label="Kapat"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
