import { Bot, FileEdit } from 'lucide-react';

interface AnnotationMenuProps {
  onSelectAI: () => void;
  onSelectMemo: () => void;
}

export function AnnotationMenu({ onSelectAI, onSelectMemo }: AnnotationMenuProps) {
  return (
    <div className="mt-4 relative animate-in slide-in-from-left-2 duration-200">
      {/* Connection Line */}
      <div className="absolute -left-[42px] top-6 w-10 h-[2px] bg-linear-to-r from-gray-300 to-gray-200"></div>
      
      <div className="ml-4 flex gap-3">
        {/* AI Chat Button */}
        <button
          onClick={onSelectAI}
          className="group relative w-12 h-12 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
          title="AI Chat"
        >
          <Bot size={20} className="text-white" />
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            AI Chat
          </div>
        </button>

        {/* Memo Button */}
        <button
          onClick={onSelectMemo}
          className="group relative w-12 h-12 rounded-full bg-linear-to-tr from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
          title="Add Memo"
        >
          <FileEdit size={20} className="text-white" />
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Add Memo
          </div>
        </button>
      </div>
    </div>
  );
}
