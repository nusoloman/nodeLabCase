import React, { useState, useRef } from 'react';
import Button from '../ui/Button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  loading?: boolean;
  onTyping?: (isTyping: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, loading, onTyping }) => {
  const [value, setValue] = useState('');
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSend = () => {
    if (value.trim() === '') return;
    onSend(value);
    setValue('');
    if (onTyping) onTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (onTyping) {
      onTyping(true);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        onTyping(false);
      }, 1200);
    }
  };

  const handleBlur = () => {
    if (onTyping) onTyping(false);
  };

  return (
    <div className="flex items-center gap-2 bg-gray-800 p-3 rounded-b-2xl border-t border-gray-700">
      <input
        type="text"
        className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 px-3 py-2"
        placeholder="Mesaj yaz..."
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={loading}
        autoFocus
      />
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={handleSend}
        disabled={loading || value.trim() === ''}
        className="rounded-full px-3 py-2"
      >
        <Send className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default ChatInput;
