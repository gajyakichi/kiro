import React from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Send, Eye, Edit3 } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, onSave, onCancel }) => {
  return (
    <div className="flex flex-col h-[600px] border border-(--border-color) rounded-2xl bg-(--background) shadow-sm overflow-hidden animate-fade-in">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-(--border-color) bg-(--sidebar-bg)">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-(--theme-primary)" />
          <h3 className="text-sm font-bold text-(--foreground) tracking-tight">Markdown Note Editor</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onCancel}
            className="p-2 text-(--foreground) opacity-50 hover:opacity-100 hover:bg-(--hover-bg) rounded-lg transition-all"
            title="Cancel"
          >
            <X size={18} />
          </button>
          <button 
            onClick={onSave}
            disabled={!value.trim()}
            className="flex items-center gap-2 px-4 py-1.5 bg-(--theme-primary) text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Send size={14} />
            Save Note
          </button>
        </div>
      </div>

      {/* Two Pane Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Input Area */}
        <div className="flex-1 flex flex-col border-r border-(--border-color)">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-(--border-color) bg-(--background)">
            <Edit3 size={12} className="text-(--foreground) opacity-50" />
            <span className="text-[10px] font-bold text-(--foreground) opacity-50 uppercase tracking-widest">Editor</span>
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 w-full p-6 text-sm bg-(--background) focus:outline-none resize-none font-mono leading-relaxed text-(--foreground)"
            placeholder="# Title\n\nStart writing your development note in Markdown..."
            autoFocus
          />
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col bg-(--sidebar-bg)">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-(--border-color) bg-(--background)">
            <Eye size={12} className="text-(--foreground) opacity-50" />
            <span className="text-[10px] font-bold text-(--foreground) opacity-50 uppercase tracking-widest">Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 prose prose-sm max-w-none prose-slate">
            {value.trim() ? (
              <div className="markdown-content">
                <ReactMarkdown>
                  {value}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-(--foreground) opacity-30">
                <Eye size={48} strokeWidth={1} className="mb-4" />
                <p className="text-sm italic">Nothing to preview yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Editor Footer */}
      <div className="px-4 py-2 bg-(--sidebar-bg) border-t border-(--border-color) flex justify-between items-center">
        <div className="flex gap-4">
          <span className="text-[10px] text-(--foreground) opacity-60">Characters: <strong>{value.length}</strong></span>
          <span className="text-[10px] text-(--foreground) opacity-60">Lines: <strong>{value.split('\n').length}</strong></span>
        </div>
        <div className="text-[10px] text-(--foreground) opacity-60 italic">Supports GitHub Flavored Markdown</div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
