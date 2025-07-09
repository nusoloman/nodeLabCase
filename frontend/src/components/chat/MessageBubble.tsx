import React from 'react';
import { User, Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: string;
  isOwn: boolean;
  senderName?: string;
  time?: string;
  delivered?: boolean;
  seen?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  senderName,
  time,
  delivered,
  seen,
}) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      {!isOwn && (
        <div className="flex flex-col items-center mr-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center text-white">
            <User className="w-4 h-4" />
          </div>
          {senderName && (
            <span className="text-xs text-gray-400 mt-1">{senderName}</span>
          )}
        </div>
      )}
      <div
        className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow text-sm break-words
        ${
          isOwn
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none'
            : 'bg-gray-800 text-gray-100 rounded-bl-none'
        }`}
      >
        {message}
        <div className="flex items-center justify-end mt-1 gap-1">
          {time && (
            <span className="text-xs text-gray-400 text-right">{time}</span>
          )}
          {isOwn && (
            <span className="ml-1">
              {/* Tik ikonları: delivered/seens */}
              {!delivered && !seen && (
                <Check className="w-4 h-4 text-gray-300 inline" />
              )}
              {delivered && !seen && (
                <CheckCheck className="w-4 h-4 text-gray-300 inline" />
              )}
              {seen && (
                <CheckCheck
                  className="w-4 h-4 inline"
                  style={{ color: '#4fc3f7' }}
                />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
