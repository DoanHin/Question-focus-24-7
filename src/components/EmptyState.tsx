import React from 'react';
import { Compass, Lightbulb, CheckCircle2, HelpCircle, ArrowUpRight } from 'lucide-react';

interface EmptyStateProps {
  onSelectSuggestion: (text: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectSuggestion }) => {
  const suggestions = [
    { text: 'Giúp mình hiểu bài này', icon: Lightbulb },
    { text: 'Gợi ý giúp mình câu này', icon: Compass },
    { text: 'Kiểm tra cách làm của mình', icon: CheckCircle2 },
    { text: 'Mình đang không hiểu chỗ này', icon: HelpCircle },
  ];

  const quickPrompts = [
    '3x - 5 = 16',
    'CPU là gì?',
    'Python: tính tổng 1 đến n',
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full text-center">
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
        Hôm nay bạn muốn tìm hiểu điều gì?
      </h1>

      {/* Slogan */}
      <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
        Question Focus không làm bài thay bạn – Question Focus giúp bạn tự tìm ra câu trả lời.
      </p>

      {/* 4 Clean Quick Suggestion Cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
        {suggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectSuggestion(item.text)}
              className="px-4 py-3 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70 transition-all flex items-center justify-between group text-left cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-950 transition-colors truncate">
                  {item.text}
                </span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0 ml-2" />
            </button>
          );
        })}
      </div>

      {/* Subtle Example Prompts */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-400">
        <span className="mr-1">Ví dụ:</span>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => onSelectSuggestion(p)}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};
