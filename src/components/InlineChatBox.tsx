import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

interface InlineChatBoxProps {
  onClose: () => void;
  initialContext: string;
  title: string;
}

export function InlineChatBox({ onClose, initialContext, title }: InlineChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: `Context:\n${initialContext}\n\nYou are a helpful AI assistant. Answer questions based on the context above.` }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });
      const data = await res.json();
      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Failed to get response." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't submit during IME composition (Japanese, Chinese, etc.)
    if (e.nativeEvent.isComposing) return;
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mt-4 relative animate-in slide-in-from-top-2 duration-200">
      {/* Connection Line */}
      <div className="absolute -left-[42px] top-6 w-10 h-[2px] bg-(--border-color) opacity-60"></div>
      
      <div className="ml-4 bg-(--card-bg) rounded-xl border border-(--border-color) shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-3 bg-(--theme-primary-bg) border-b border-(--border-color) flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-(--theme-primary) flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-xs font-bold text-(--theme-primary)">{title}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-(--hover-bg) rounded transition-colors">
            <X size={14} className="text-(--theme-primary) opacity-70 hover:opacity-100" />
          </button>
        </div>

        {/* Chat Messages */}
        <div 
          ref={scrollRef}
          className="max-h-[300px] overflow-y-auto p-3 space-y-2 bg-(--background)"
        >
          {messages.filter(m => m.role !== 'system').length === 0 && (
            <div className="text-center py-8 text-(--foreground) opacity-40 text-xs">
              Ask me anything about this item.
            </div>
          )}
          {messages.filter(m => m.role !== 'system').map((m, i) => (
            <div 
              key={i} 
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs shadow-sm ${
                m.role === 'user' 
                  ? 'bg-(--theme-primary) text-(--background)' 
                  : 'bg-(--card-bg) border border-(--border-color) text-(--foreground)'
              }`}>
                <div className="markdown-content">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-(--card-bg) border border-(--border-color) rounded-lg px-3 py-2 flex items-center gap-1">
                <div className="w-1 h-1 bg-(--foreground) opacity-50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-(--foreground) opacity-50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-(--foreground) opacity-50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-2 bg-(--card-bg) border-t border-(--border-color)">
          <div className="relative flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 text-xs bg-(--background) border border-(--border-color) rounded-lg focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/20 focus:border-(--theme-primary) text-(--foreground) transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-(--theme-primary) text-(--background) rounded-lg hover:opacity-90 disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
