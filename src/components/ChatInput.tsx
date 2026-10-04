import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { detectSensitiveInfo } from '../services/aiService';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Check for sensitive personal info
    const check = detectSensitiveInfo(trimmed);
    if (check.isSensitive && check.warning) {
      setWarning(check.warning);
      setTimeout(() => setWarning(null), 6000);
    }

    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="w-full bg-gradient-to-t from-white via-white to-transparent pt-2 pb-3 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Warning if sensitive data typed */}
        {warning && (
          <div className="mb-2 p-2 rounded-lg bg-amber-50 text-xs text-amber-700 flex items-center justify-between">
            <span>{warning}</span>
            <button
              onClick={() => setWarning(null)}
              className="text-amber-600 hover:text-amber-800 text-xs font-medium ml-2"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Input Card */}
        <div className="relative flex items-end gap-2 bg-[#f4f4f4] rounded-3xl p-1.5 pl-4 focus-within:bg-white focus-within:ring-1 focus-within:ring-slate-300 focus-within:shadow-sm transition-all border border-transparent focus-within:border-slate-300">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Hãy nhập câu hỏi của bạn..."
            className="w-full resize-none bg-transparent py-2 text-sm text-slate-800 placeholder-neutral-400 focus:outline-none max-h-40 overflow-y-auto leading-relaxed"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 mb-0.5 cursor-pointer ${
              input.trim() && !isLoading
                ? 'bg-black text-white hover:bg-neutral-800'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
            title="Gửi câu hỏi"
          >
            {isLoading ? (
              <Sparkles className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Quiet Subtitle */}
        <div className="mt-1.5 text-center text-[11px] text-neutral-400">
          Question Focus không làm bài thay bạn – giúp bạn tự tìm ra câu trả lời.
        </div>
      </div>
    </div>
  );
};
