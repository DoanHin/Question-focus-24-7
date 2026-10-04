import React, { useState } from 'react';
import { ChatMessage, UserProfile } from '../types';
import ReactMarkdown from 'react-markdown';
import { GraduationCap, Copy, Check } from 'lucide-react';

interface ChatMessageItemProps {
  message: ChatMessage;
  user: UserProfile;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, user }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-4 px-4 sm:px-6 w-full flex justify-center group">
      <div className="w-full max-w-2xl flex gap-3.5 items-start">
        {/* Avatar */}
        {isUser ? (
          <div className="flex-shrink-0 mt-0.5">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover bg-neutral-100"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-800 text-white flex items-center justify-center text-xs font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-800">
              {isUser ? (user.isGuest ? 'Bạn' : user.name) : 'Question Focus'}
            </span>

            {!isUser && (
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded transition-opacity"
                title="Sao chép"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          <div className="prose-chat text-slate-800">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
