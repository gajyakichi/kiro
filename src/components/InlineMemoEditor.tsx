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
      <div className="absolute -left-[42px] top-6 w-10 h-[2px] bg-linear-to-r from-green-500 to-teal-300 opacity-60"></div>
      
      <div className="ml-4 bg-white rounded-xl border-2 border-green-200 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-3 bg-linear-to-r from-green-50 to-teal-50 border-b border-green-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-green-600" />
              <span className="text-xs font-bold text-gray-700">{title}</span>
            </div>
            
            {/* Editor Type Toggle */}
            <div className="flex gap-1 bg-white rounded-lg p-1 border border-green-200">
              <button
                onClick={() => setEditorType('markdown')}
                className={`px-2 py-1 text-[10px] rounded transition-colors ${
                  editorType === 'markdown' 
                    ? 'bg-green-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Markdown
              </button>
              <button
                onClick={() => setEditorType('block')}
                className={`px-2 py-1 text-[10px] rounded transition-colors ${
                  editorType === 'block' 
                    ? 'bg-green-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Block
              </button>
            </div>
          </div>
          
          <button onClick={onClose} className="p-1 hover:bg-white/50 rounded transition-colors">
            <X size={14} className="text-gray-500" />
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
                  className="px-2 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 rounded transition-colors flex items-center gap-1"
                >
                  <Code size={12} />
                  {isPreview ? 'Edit' : 'Preview'}
                </button>
              </div>
              
              {isPreview ? (
                <div className="min-h-[150px] max-h-[300px] overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="markdown-content prose prose-sm max-w-none">
                    <ReactMarkdown>{content || '*No content yet*'}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your memo in Markdown..."
                  className="w-full min-h-[150px] max-h-[300px] px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none font-mono"
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
        <div className="p-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <span className="text-[10px] text-gray-400">
            {editorType === 'markdown' ? 'Markdown' : 'Block'} Editor
          </span>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-30 transition-all text-xs flex items-center gap-1.5"
          >
            <Save size={12} />
            Save Memo
          </button>
        </div>
      </div>
    </div>
  );
}
