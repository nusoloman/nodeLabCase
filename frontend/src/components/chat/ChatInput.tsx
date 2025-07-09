import React, { useState } from 'react';
import Button from '../ui/Button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  loading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, loading }) => {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (value.trim() === '') return;
    onSend(value);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 bg-gray-800 p-3 rounded-b-2xl border-t border-gray-700">
      <input
        type="text"
        className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 px-3 py-2"
        placeholder="Mesaj yaz..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
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
