import { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

interface InlineChatBoxProps {
  onClose: () => void;
  initialContext: string;
  title: string;
  onSaveMemo?: (content: string) => Promise<void>;
}

export function InlineChatBox({ onClose, initialContext, title, onSaveMemo }: InlineChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: `Context:\n${initialContext}\n\nYou are a helpful AI assistant. Answer questions based on the context above.` }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSaveConversation = async () => {
    if (!onSaveMemo || messages.filter(m => m.role !== 'system').length === 0) return;
    
    setIsSaving(true);
    try {
      // Format conversation as markdown
      const conversationMarkdown = messages
        .filter(m => m.role !== 'system')
        .map(m => {
          const role = m.role === 'user' ? '**You**' : '**AI**';
          return `${role}:\n${m.content}\n`;
        })
        .join('\n---\n\n');
      
      const fullContent = `# ${title}\n\n${conversationMarkdown}`;
      await onSaveMemo(fullContent);
      
      // Show success feedback (could enhance with toast notification)
      alert('Conversation saved as memo!');
    } catch (error) {
      console.error('Failed to save conversation:', error);
      alert('Failed to save conversation');
    } finally {
      setIsSaving(false);
    }
  };

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
      
      <div className="ml-4 bg-(--background) rounded-xl border border-(--border-color) shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-3 bg-(--background) border-b border-(--border-color) flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-(--theme-primary) flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-xs font-bold text-(--theme-primary)">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            {onSaveMemo && messages.filter(m => m.role !== 'system').length > 0 && (
              <button 
                onClick={handleSaveConversation}
                disabled={isSaving}
                className="p-1.5 hover:bg-(--hover-bg) rounded transition-colors disabled:opacity-50"
                title="Save conversation as memo"
              >
                <Save size={14} className="text-(--theme-primary) opacity-70 hover:opacity-100" />
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-(--hover-bg) rounded transition-colors">
              <X size={14} className="text-(--theme-primary) opacity-70 hover:opacity-100" />
            </button>
          </div>
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
        <div className="p-2 bg-(--background) border-t border-(--border-color)">
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
