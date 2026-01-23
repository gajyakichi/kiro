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
    <div className="flex flex-col h-[600px] border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden animate-fade-in">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <h3 className="text-sm font-bold text-gray-700 tracking-tight">Markdown Note Editor</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            title="Cancel"
          >
            <X size={18} />
          </button>
          <button 
            onClick={onSave}
            disabled={!value.trim()}
            className="flex items-center gap-2 px-4 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Send size={14} />
            Save Note
          </button>
        </div>
      </div>

      {/* Two Pane Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Input Area */}
        <div className="flex-1 flex flex-col border-r border-gray-100">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-50 bg-white">
            <Edit3 size={12} className="text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Editor</span>
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 w-full p-6 text-sm bg-white focus:outline-none resize-none font-mono leading-relaxed text-gray-800"
            placeholder="# Title\n\nStart writing your development note in Markdown..."
            autoFocus
          />
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col bg-gray-50/30">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white">
            <Eye size={12} className="text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 prose prose-sm max-w-none prose-slate">
            {value.trim() ? (
              <div className="markdown-content">
                <ReactMarkdown>
                  {value}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50">
                <Eye size={48} strokeWidth={1} className="mb-4" />
                <p className="text-sm italic">Nothing to preview yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Editor Footer */}
      <div className="px-4 py-2 bg-white border-t border-gray-100 flex justify-between items-center">
        <div className="flex gap-4">
          <span className="text-[10px] text-gray-400">Characters: <strong>{value.length}</strong></span>
          <span className="text-[10px] text-gray-400">Lines: <strong>{value.split('\n').length}</strong></span>
        </div>
        <div className="text-[10px] text-gray-400 italic">Supports GitHub Flavored Markdown</div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
