import React, { useState } from 'react';
import { IconRenderer } from './IconRenderer';

const LUCIDE_ICONS = ['Home', 'Folder', 'FileText', 'Code', 'Calendar', 'Settings', 'Database', 'Globe', 'Terminal', 'Cpu'];
const PHOSPHOR_ICONS = ['House', 'Folder', 'FileText', 'Code', 'Calendar', 'Gear', 'Database', 'Globe', 'Terminal', 'Cpu'];
const EMOJIS = ['🚀', '💻', '📝', '📅', '⚙️', '📂', '📁', '🛠️', '🏗️', '🧪', '🏁', '⭐', '🔥', '💡', '📌', '🔍'];

interface IconPickerProps {
  selectedIcon?: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect, onClose }) => {
  const [tab, setTab] = useState<'lucide' | 'phosphor' | 'notion'>('notion');

  return (
    <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-2 notion-card">
      <div className="flex border-b border-gray-100 mb-2 pb-1 overflow-x-auto">
        <button 
          onClick={() => setTab('notion')}
          className={`px-2 py-1 text-xs font-medium rounded ${tab === 'notion' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
        >
          Notion
        </button>
        <button 
          onClick={() => setTab('lucide')}
          className={`px-2 py-1 text-xs font-medium rounded ${tab === 'lucide' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
        >
          Lucide
        </button>
        <button 
          onClick={() => setTab('phosphor')}
          className={`px-2 py-1 text-xs font-medium rounded ${tab === 'phosphor' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
        >
          Phosphor
        </button>
      </div>

      <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-1">
        {tab === 'notion' && EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className={`flex items-center justify-center h-8 w-8 rounded hover:bg-gray-100 ${selectedIcon === emoji ? 'bg-gray-100' : ''}`}
          >
            <span className="text-xl">{emoji}</span>
          </button>
        ))}
        {tab === 'lucide' && LUCIDE_ICONS.map(name => (
          <button
            key={name}
            onClick={() => onSelect(`lucide:${name}`)}
            className={`flex items-center justify-center h-8 w-8 rounded hover:bg-gray-100 ${selectedIcon === `lucide:${name}` ? 'bg-gray-100' : ''}`}
          >
            <IconRenderer icon={`lucide:${name}`} size={20} />
          </button>
        ))}
        {tab === 'phosphor' && PHOSPHOR_ICONS.map(name => (
          <button
            key={name}
            onClick={() => onSelect(`phosphor:${name}`)}
            className={`flex items-center justify-center h-8 w-8 rounded hover:bg-gray-100 ${selectedIcon === `phosphor:${name}` ? 'bg-gray-100' : ''}`}
          >
            <IconRenderer icon={`phosphor:${name}`} size={20} />
          </button>
        ))}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end">
        <button onClick={onClose} className="text-[10px] text-gray-500 hover:text-gray-700">Close</button>
      </div>
    </div>
  );
};
