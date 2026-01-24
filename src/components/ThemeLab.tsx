import React, { useState } from 'react';
import { Theme } from '@/lib/types';
import { MagicWand, Trash, Palette, Play, CheckCircle, Circle } from '@phosphor-icons/react';
import { IconRenderer } from './IconRenderer';

interface ThemeLabProps {
  themes: Theme[];
  onSave: (name: string, css: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggle: (theme: Theme | null) => Promise<void>;
  onPreview: (css: string) => void;
  appIconSet: string;
  onUpdateIconSet: (set: string) => void;
}

export const ThemeLab: React.FC<ThemeLabProps> = ({ themes, onSave, onDelete, onToggle, onPreview, appIconSet, onUpdateIconSet }) => {
  const [newName, setNewName] = useState("");
  const [newCss, setNewCss] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const activeTheme = themes.find(t => t.active) || null;

  const handleSave = async () => {
    if (!newName || !newCss) return;
    await onSave(newName, newCss);
    setNewName("");
    setNewCss("");
    setIsAdding(false);
  };

  const PRESET_THEMES = [
    {
      name: "Darcula",
      iconSet: "lucide",
      css: `body { background: #2b2b2b !important; color: #a9b7c6 !important; font-weight: 450; }
.notion-sidebar { background: #3c3f41 !important; border-right: 1px solid #2b2b2b !important; }
.notion-card { background: #313335 !important; border: 1px solid #4e5052 !important; box-shadow: none !important; color: #cfd8dc !important; }
.notion-item:hover, .notion-item.active { background: #4e5254 !important; color: #cc7832 !important; }
.notion-text-subtle { color: #9da5b4 !important; font-size: 0.95em; }
h1, h2, h3 { color: #cc7832 !important; font-weight: 700; }
.accent-text { color: #cc7832 !important; }
:root { --theme-primary: #cc7832; --theme-primary-bg: rgba(204, 120, 50, 0.15); --theme-accent: #cc7832; --theme-accent-bg: rgba(204, 120, 50, 0.2); }`
    },
    {
      name: "Catppuccin",
      iconSet: "phosphor",
      css: `body { background: #1e1e2e !important; color: #cdd6f4 !important; font-weight: 450; }
.notion-sidebar { background: #181825 !important; }
.notion-card { background: #313244 !important; border: 1px solid #45475a !important; color: #cdd6f4 !important; }
.notion-item:hover, .notion-item.active { background: #45475a !important; color: #cba6f7 !important; }
.notion-text-subtle { color: #bac2de !important; }
h1, h2, h3 { color: #89b4fa !important; font-weight: 700; }
.accent-text { color: #f5c2e7 !important; }
:root { --theme-primary: #cba6f7; --theme-primary-bg: rgba(203, 166, 247, 0.15); --theme-accent: #89b4fa; --theme-accent-bg: rgba(137, 180, 250, 0.2); }`
    }
  ];

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* Theme Selector Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Palette size={24} className="text-gray-400" weight="bold" />
          <h2 className="text-xl font-bold tracking-tight text-gray-800 uppercase">Theme Selector</h2>
        </div>

        {/* Global Icon Settings Row */}
        <div className="mb-8 p-6 bg-neutral-50 rounded-2xl border border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-5 w-full md:w-auto">
             <div className="w-12 h-12 shrink-0 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shadow-xs">
                <IconRenderer icon="lucide:Settings" size={24} className="text-neutral-500" baseSet={appIconSet} />
             </div>
             <div className="min-w-0">
                <p className="text-[15px] font-black text-gray-800 tracking-tight">Global Icon Set</p>
                <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest whitespace-nowrap">Selected style applies everywhere</p>
             </div>
          </div>
          <div className="flex bg-white p-1.5 rounded-xl border border-neutral-200 gap-1 w-full md:w-auto shrink-0 shadow-inner group">
             <button 
                onClick={() => onUpdateIconSet('lucide')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black tracking-widest transition-all duration-300 active:scale-95 ${appIconSet === 'lucide' ? 'bg-foreground text-background shadow-lg shadow-neutral-300 ring-2 ring-foreground/5' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'}`}
             >
                LUCIDE
             </button>
             <button 
                onClick={() => onUpdateIconSet('phosphor')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black tracking-widest transition-all duration-300 active:scale-95 ${appIconSet === 'phosphor' ? 'bg-foreground text-background shadow-lg shadow-neutral-300 ring-2 ring-foreground/5' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'}`}
             >
                PHOSPHOR
             </button>
             <button 
                onClick={() => onUpdateIconSet('original')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black tracking-widest transition-all duration-300 active:scale-95 ${appIconSet === 'original' ? 'bg-foreground text-background shadow-lg shadow-neutral-300 ring-2 ring-foreground/5' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'}`}
             >
                ORIGINAL
             </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-6 pt-4 pb-4">
          <button 
            onClick={() => onToggle(null)}
            onMouseEnter={() => onPreview("")}
            className={`group flex items-center gap-4 px-6 py-5 rounded-xl border-2 transition-all duration-500 ease-in-out bg-white hover:-translate-y-3 hover:translate-x-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:z-20 active:scale-[0.98] outline-none relative ${!activeTheme ? 'border-foreground shadow-xl shadow-gray-200' : 'border-gray-100 hover:border-gray-200 opacity-70 hover:opacity-100'}`}
          >
            <div className={`w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform duration-500 ${!activeTheme ? 'text-foreground border-foreground/10' : ''}`}>
              {!activeTheme ? <CheckCircle size={22} weight="fill" className="text-foreground" /> : <Circle size={22} />}
            </div>
            <div className="text-left">
              <div className="font-black text-sm tracking-tight">Original</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black opacity-60">Default System</div>
            </div>
          </button>

          {themes.map(theme => (
            <button 
              key={theme.id}
              onClick={() => onToggle(theme)}
              onMouseEnter={() => onPreview(theme.css)}
              onMouseLeave={() => onPreview("")}
              className={`group flex items-center gap-4 px-6 py-5 rounded-xl border-2 transition-all duration-500 ease-in-out bg-white hover:-translate-y-3 hover:translate-x-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:z-20 active:scale-[0.98] outline-none relative ${theme.active ? 'border-foreground shadow-xl shadow-gray-200' : 'border-gray-100 hover:border-gray-200 opacity-70 hover:opacity-100'}`}
            >
              <div className={`w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform duration-500 ${theme.active ? 'text-foreground border-foreground/10' : ''}`}>
                {theme.active ? <CheckCircle size={22} weight="fill" className="text-foreground" /> : <Circle size={22} />}
              </div>
              <div className="text-left relative">
                 <div className="font-black text-sm flex items-center gap-2 tracking-tight">
                   {theme.name}
                   <span onClick={(e) => { e.stopPropagation(); onDelete(theme.id); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all duration-300 transform hover:scale-125">
                     <Trash size={16} />
                   </span>
                 </div>
                 <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black opacity-60">Custom Style</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Editor Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <MagicWand size={24} className="text-foreground" weight="fill" />
            <h2 className="text-xl font-bold tracking-tight text-gray-800 uppercase">Editor & Preview</h2>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`notion-item px-4 py-2 rounded-md font-medium text-sm transition-all ${isAdding ? 'bg-gray-100 text-gray-600' : 'bg-foreground text-background'}`}
          >
            {isAdding ? "Close Editor" : "Open CSS Editor"}
          </button>
        </div>

        {isAdding && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-white notion-card p-6 border-2 border-gray-100 space-y-6">
              <div className="flex items-center gap-3">
                 <Palette size={20} className="text-foreground" />
                 <span className="font-bold">Laboratory</span>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Theme Name</label>
                <input 
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 ring-gray-900 outline-none transition-all shadow-sm"
                  placeholder="e.g. Cyberpunk"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Custom CSS</label>
                  <textarea 
                    className="w-full h-80 border border-gray-200 rounded-2xl p-4 text-xs font-mono bg-gray-50 focus:bg-white transition-all focus:ring-2 ring-gray-900 outline-none leading-relaxed shadow-xs"
                    placeholder="/* Add your custom CSS here */"
                    value={newCss}
                    onChange={(e) => {
                        setNewCss(e.target.value);
                        onPreview(e.target.value);
                    }}
                  />
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESET_THEMES.map(preset => (
                  <button 
                    key={preset.name}
                    onClick={() => { 
                      setNewName(preset.name); 
                      setNewCss(preset.css); 
                      onPreview(preset.css); 
                    }}
                    className="text-[10px] bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-foreground hover:text-background font-bold transition-all"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleSave}
                className="w-full bg-foreground text-background font-black py-4 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-gray-200 active:scale-[0.98]"
              >
                SAVE & ADD TO SELECTOR
              </button>
            </div>

            <div className="bg-gray-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-center items-center text-center space-y-6">
              <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 to-blue-500/20 pointer-events-none"></div>
              <div className="z-10 text-white flex flex-col items-center">
                <Play size={48} className="text-purple-400 mb-4 animate-pulse" weight="fill" />
                <p className="text-xs uppercase tracking-[0.3em] font-black text-purple-400 mb-2">Editor Mode: Active</p>
                <p className="text-sm opacity-80 leading-relaxed px-4">
                  Changes typed here are <span className="text-purple-300 font-bold underline italic">immediately applied</span> as a temporary preview to the entire console.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
