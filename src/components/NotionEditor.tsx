"use client";

import "@blocknote/mantine/style.css";
import React, { useEffect, useRef } from 'react';
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { X, Send, MoreHorizontal } from 'lucide-react';

import { IconRenderer } from '@/components/IconRenderer';

interface NotionEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  iconSet?: string;
  compact?: boolean;
}

const NotionEditor: React.FC<NotionEditorProps> = ({ value, onChange, onSave, onCancel, iconSet = 'lucide', compact = false }) => {
  // Use a ref to track if we've initialized content to prevent overwriting on re-renders
  const initialized = useRef(false);

  const editor = useCreateBlockNote();

  useEffect(() => {
    if (editor && !initialized.current) {
        const loadContent = async () => {
            if (value && value.trim().length > 0) {
                const blocks = await editor.tryParseMarkdownToBlocks(value);
                editor.replaceBlocks(editor.document, blocks);
            }
            initialized.current = true;
        };
        loadContent();
    }
  }, [editor, value]); // Added value to dependency, guarded by initialized ref

  const handleEditorChange = async () => {
    // Convert blocks to markdown for local state
    const markdown = await editor.blocksToMarkdownLossy(editor.document);
    onChange(markdown);
  };

  return (
    <div className={`flex flex-col ${compact ? 'h-full border-none shadow-none rounded-none' : 'h-[600px] border border-(--border-color) rounded-2xl shadow-xl'} bg-(--card-bg) overflow-hidden animate-fade-in relative z-50`}>
      {/* Editor Header */}
      {!compact && (
      <div className="flex items-center justify-between px-6 py-4 border-b border-(--border-color) bg-(--card-bg) z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-(--background) border border-(--border-color) flex items-center justify-center shadow-sm">
             <IconRenderer icon="PenTool" size={18} baseSet={iconSet} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-(--foreground) tracking-tight">Memo</h3>

          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onCancel}
            className="p-2 text-(--foreground) opacity-50 hover:opacity-100 hover:bg-(--hover-bg) rounded-xl transition-all"
            title="Cancel"
          >
            <X size={18} />
          </button>
          <button 
            onClick={onSave}
            disabled={!value.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-(--theme-primary) text-white text-xs font-bold rounded-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
             <Send size={14} />
            <span>Save Note</span>
          </button>
        </div>
      </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto bg-(--card-bg) cursor-text" onClick={() => editor.focus()}>
        <div className={`${compact ? 'p-2' : 'pb-20 pt-8 px-4 md:px-12 max-w-4xl mx-auto'}`}>
             <BlockNoteView 
                editor={editor} 
                onChange={handleEditorChange}
                theme="light"
                className={`${compact ? 'min-h-[100px]' : 'min-h-[400px]'}`}
             />
        </div>
      </div>
      
      {/* Editor Footer */}
      {!compact ? (
      <div className="px-6 py-3 bg-(--sidebar-bg) border-t border-(--border-color) flex justify-between items-center text-[10px] text-(--foreground) opacity-60 font-medium uppercase tracking-wider">
        <div className="flex items-center gap-4">
           <span>Markdown Compatible</span>
           <span className="w-1 h-1 rounded-full bg-(--border-color)"></span>
           <span>Rich Text</span>
        </div>
        <div className="flex items-center gap-2 opacity-50">
             <MoreHorizontal size={14} />
             <span>Type &apos;/&apos; for Table, Code, List, Heading, Toggle...</span>
        </div>
      </div>
      ) : (
        <div className="flex justify-between items-center p-2 border-t border-(--border-color) bg-(--sidebar-bg)">
            <button onClick={onCancel} className="text-(--foreground) opacity-50 hover:text-red-500 p-1 rounded-md transition-colors"><X size={14} /></button>
            <span className="text-[9px] text-(--foreground) opacity-40 font-medium uppercase tracking-wider">Notion-Style</span>
            <button onClick={onSave} className="text-(--theme-primary) hover:opacity-80 bg-(--theme-primary-bg) hover:bg-(--hover-bg) px-2 py-1 rounded-md text-[10px] font-bold transition-all"><Send size={12} /></button>
        </div>
      )}
    </div>
  );
};

export default NotionEditor;
