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
  const [internalSelectedIcon, setInternalSelectedIcon] = useState(selectedIcon || "");

  const handleSave = () => {
    if (internalSelectedIcon) {
      onSelect(internalSelectedIcon);
    }
  };

  return (
    <div className="absolute z-100 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 notion-card animate-fade-in">
      <div className="flex bg-gray-100 p-1 rounded-lg mb-4 gap-1">
        <button 
          onClick={() => setTab('notion')}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${tab === 'notion' ? 'bg-white shadow-sm text-foreground' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Notion
        </button>
        <button 
          onClick={() => setTab('lucide')}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${tab === 'lucide' ? 'bg-white shadow-sm text-foreground' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Lucide
        </button>
        <button 
          onClick={() => setTab('phosphor')}
          className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${tab === 'phosphor' ? 'bg-white shadow-sm text-foreground' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Phosphor
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 mb-4 scrollbar-hide">
        {tab === 'notion' && EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => setInternalSelectedIcon(emoji)}
            className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all border-2 ${internalSelectedIcon === emoji ? 'border-foreground bg-gray-50' : 'border-transparent hover:bg-gray-50'}`}
          >
            <span className="text-xl">{emoji}</span>
          </button>
        ))}
        {tab === 'lucide' && LUCIDE_ICONS.map(name => (
          <button
            key={name}
            onClick={() => setInternalSelectedIcon(`lucide:${name}`)}
            className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all border-2 ${internalSelectedIcon === `lucide:${name}` ? 'border-foreground bg-gray-50' : 'border-transparent hover:bg-gray-50'}`}
          >
            <IconRenderer icon={`lucide:${name}`} size={20} />
          </button>
        ))}
        {tab === 'phosphor' && PHOSPHOR_ICONS.map(name => (
          <button
            key={name}
            onClick={() => setInternalSelectedIcon(`phosphor:${name}`)}
            className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all border-2 ${internalSelectedIcon === `phosphor:${name}` ? 'border-foreground bg-gray-50' : 'border-transparent hover:bg-gray-50'}`}
          >
            <IconRenderer icon={`phosphor:${name}`} size={20} />
          </button>
        ))}
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={onClose} 
          className="flex-1 px-3 py-2 border border-gray-200 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={!internalSelectedIcon}
          className="flex-1 px-3 py-2 bg-foreground text-background rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-30 transition-all"
        >
          Save Icon
        </button>
      </div>
    </div>
  );
};
