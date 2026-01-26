"use client";

import React, { useState } from 'react';
import { DailyNote } from '@/lib/types';
import { Calendar, Languages } from 'lucide-react';

interface DailyNotesProps {
  notes: DailyNote[];
}

const DailyNotes: React.FC<DailyNotesProps> = ({ notes }) => {
  const [language, setLanguage] = useState<'en' | 'ja'>('ja');

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-400 text-sm">No daily notes yet. Click &quot;Absorb&quot; to generate them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setLanguage(prev => prev === 'en' ? 'ja' : 'en')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 bg-gray-100/50 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Languages size={14} />
          {language === 'en' ? 'English' : '日本語'}
        </button>
      </div>

      {notes.map((note) => {
        const content = language === 'ja' 
          ? (note.content_ja || note.content) 
          : (note.content_en || note.content);

        return (
          <div key={note.id} className="group relative pl-6 border-l-2 border-(--theme-primary-bg) hover:border-(--theme-primary) transition-colors">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-(--theme-primary-bg) group-hover:border-(--theme-primary) transition-colors flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-(--theme-primary) opacity-30 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="mb-2 flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-500">{note.date}</span>
            </div>
            
            <div className="bg-white notion-card p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DailyNotes;
