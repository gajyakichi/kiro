import { useState } from 'react';
import { X, Save, FileText, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';

const NotionEditor = dynamic(() => import('@/components/NotionEditor'), { ssr: false });

interface InlineMemoEditorProps {
  onClose: () => void;
  onSave: (content: string, editorType: 'markdown' | 'block') => void;
  title: string;
}

export function InlineMemoEditor({ onClose, onSave, title }: InlineMemoEditorProps) {
  const [content, setContent] = useState("");
  const [editorType, setEditorType] = useState<'markdown' | 'block'>('markdown');
  const [isPreview, setIsPreview] = useState(false);

  const handleSave = () => {
    if (!content.trim()) return;
    onSave(content, editorType);
    onClose();
  };

  return (
    <div className="mt-4 relative animate-in slide-in-from-top-2 duration-200">
      {/* Connection Line */}
      <div className="absolute -left-[42px] top-6 w-10 h-[2px] bg-(--border-color) opacity-60"></div>
      
      <div className="ml-4 bg-(--card-bg) rounded-xl border-2 border-(--border-color) shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-3 bg-(--theme-primary-bg) border-b border-(--border-color) flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-(--theme-primary)" />
              <span className="text-xs font-bold text-(--foreground)">{title}</span>
            </div>
            
            {/* Editor Type Toggle */}
            <div className="flex gap-1 bg-(--background) rounded-lg p-1 border border-(--border-color)">
              <button
                onClick={() => setEditorType('markdown')}
                className={`px-2 py-1 text-[10px] rounded transition-colors ${
                  editorType === 'markdown' 
                    ? 'bg-(--theme-primary) text-(--background)' 
                    : 'text-(--foreground) opacity-60 hover:bg-(--hover-bg)'
                }`}
              >
                Markdown
              </button>
              <button
                onClick={() => setEditorType('block')}
                className={`px-2 py-1 text-[10px] rounded transition-colors ${
                  editorType === 'block' 
                    ? 'bg-(--theme-primary) text-(--background)' 
                    : 'text-(--foreground) opacity-60 hover:bg-(--hover-bg)'
                }`}
              >
                Block
              </button>
            </div>
          </div>
          
          <button onClick={onClose} className="p-1 hover:bg-(--hover-bg) rounded transition-colors">
            <X size={14} className="text-(--foreground) opacity-50" />
          </button>
        </div>

        {/* Editor Area */}
        <div className="p-3">
          {editorType === 'markdown' ? (
            <div className="space-y-2">
              {/* Markdown Toolbar */}
              <div className="flex gap-1 items-center">
                <button
                  onClick={() => setIsPreview(!isPreview)}
                  className="px-2 py-1 text-[10px] bg-(--sidebar-bg) hover:bg-(--hover-bg) rounded transition-colors flex items-center gap-1 text-(--foreground)"
                >
                  <Code size={12} />
                  {isPreview ? 'Edit' : 'Preview'}
                </button>
              </div>
              
              {isPreview ? (
                <div className="min-h-[150px] max-h-[300px] overflow-y-auto p-3 bg-(--background) rounded-lg border border-(--border-color)">
                  <div className="markdown-content prose prose-sm max-w-none">
                    <ReactMarkdown>{content || '*No content yet*'}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your memo in Markdown..."
                  className="w-full min-h-[150px] max-h-[300px] px-3 py-2 text-sm bg-(--background) border border-(--border-color) rounded-lg focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/20 focus:border-(--theme-primary) transition-all resize-none font-mono text-(--foreground)"
                />
              )}
            </div>
          ) : (
            <div className="h-[300px] overflow-hidden">
              <NotionEditor 
                value={content}
                onChange={setContent}
                onSave={handleSave}
                onCancel={onClose}
                compact={true}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 bg-(--sidebar-bg) border-t border-(--border-color) flex justify-between items-center">
          <span className="text-[10px] text-(--foreground) opacity-40">
            {editorType === 'markdown' ? 'Markdown' : 'Block'} Editor
          </span>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="px-3 py-1.5 bg-(--theme-primary) text-(--background) rounded-lg hover:opacity-90 disabled:opacity-30 transition-all text-xs flex items-center gap-1.5"
          >
            <Save size={12} />
            Save Memo
          </button>
        </div>
      </div>
    </div>
  );
}
