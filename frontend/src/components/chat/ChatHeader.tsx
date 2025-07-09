import React from 'react';
import { User } from 'lucide-react';

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  avatarUrl?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  subtitle,
  avatarUrl,
}) => {
  return (
    <div className="flex items-center gap-4 bg-gray-800 px-6 py-4 rounded-t-2xl border-b border-gray-700">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={title}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center text-white">
          <User className="w-5 h-5" />
        </div>
      )}
      <div>
        <div className="text-white font-semibold text-lg leading-tight">
          {title}
        </div>
        {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
      </div>
    </div>
  );
};

export default ChatHeader;
