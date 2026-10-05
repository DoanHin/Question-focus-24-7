import React, { useState } from 'react';
import { ChatMessage, UserProfile } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { GraduationCap, Copy, Check, Clock } from 'lucide-react';

interface ChatMessageItemProps {
  message: ChatMessage;
  user: UserProfile;
}

/**
 * Standardize math delimiters so KaTeX can render:
 * - \[ ... \] -> $$ ... $$
 * - \( ... \) -> $ ... $
 */
function preprocessMath(content: string): string {
  if (!content) return '';
  let res = content.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);
  res = res.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);
  return res;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, user }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formattedContent = preprocessMath(message.content);

  if (isUser) {
    // USER MESSAGE: Aligned to the RIGHT
    return (
      <div className="w-full flex justify-end group my-2 sm:my-3 px-2 sm:px-4">
        <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[70%] flex flex-col items-end">
          {/* User Header / Avatar on right */}
          <div className="flex items-center gap-1.5 mb-1 text-xs text-slate-500 font-medium">
            <span>{user.isGuest ? 'Bạn' : user.name}</span>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* User Bubble */}
          <div className="bg-sky-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-xs text-sm sm:text-base leading-relaxed break-words">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
              }}
            >
              {formattedContent}
            </ReactMarkdown>
          </div>

          {/* Timestamp */}
          {message.timestamp && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <Clock className="w-3 h-3" />
              <span>{formatTime(message.timestamp)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // AI MESSAGE: Aligned to the LEFT
  return (
    <div className="w-full flex justify-start group my-2 sm:my-3 px-2 sm:px-4">
      <div className="max-w-[92%] sm:max-w-[85%] md:max-w-[80%] flex items-start gap-2.5 sm:gap-3">
        {/* AI Avatar on left */}
        <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 border border-sky-200/80 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
          <GraduationCap className="w-4 h-4" />
        </div>

        {/* AI Content Column */}
        <div className="flex-1 min-w-0">
          {/* AI Header */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-slate-800">Question Focus 24/7</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">· Trợ lý học tập</span>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="ml-auto opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all text-xs flex items-center gap-1"
              title="Sao chép nội dung"
            >
              {copied ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <Check className="w-3.5 h-3.5" /> Đã chép
                </span>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* AI Bubble with KaTeX Math rendering */}
          <div className="bg-slate-50/90 hover:bg-slate-50 transition-colors border border-slate-200/90 text-slate-800 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl rounded-tl-xs shadow-xs text-sm sm:text-base">
            <div className="prose-chat">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {formattedContent}
              </ReactMarkdown>
            </div>
          </div>

          {/* Timestamp */}
          {message.timestamp && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <Clock className="w-3 h-3" />
              <span>{formatTime(message.timestamp)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
