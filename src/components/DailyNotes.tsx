import React from 'react';
import { DailyNote } from '@/lib/types';
import { Calendar } from 'lucide-react';

interface DailyNotesProps {
  notes: DailyNote[];
}

const DailyNotes: React.FC<DailyNotesProps> = ({ notes }) => {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-400 text-sm">No daily notes yet. Click &quot;Absorb&quot; to generate them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {notes.map((note) => (
        <div key={note.id} className="group relative pl-6 border-l-2 border-gray-100 hover:border-gray-200 transition-colors">
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-gray-200 group-hover:border-gray-300 transition-colors flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors" />
          </div>
          
          <div className="mb-2 flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-500">{note.date}</span>
          </div>
          
          <div className="bg-white notion-card p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {note.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DailyNotes;
