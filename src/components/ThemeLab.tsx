import React, { useState } from 'react';
import { Theme } from '@/lib/types';
import { MagicWand, Trash, Palette, Play, CheckCircle, Circle } from '@phosphor-icons/react';

interface ThemeLabProps {
  themes: Theme[];
  onSave: (name: string, css: string, iconSet?: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggle: (theme: Theme | null) => Promise<void>;
  onPreview: (css: string) => void;
}

export const ThemeLab: React.FC<ThemeLabProps> = ({ themes, onSave, onDelete, onToggle, onPreview }) => {
  const [newName, setNewName] = useState("");
  const [newCss, setNewCss] = useState("");
  const [newIconSet, setNewIconSet] = useState("lucide");
  const [isAdding, setIsAdding] = useState(false);
  const activeTheme = themes.find(t => t.active) || null;

  const handleSave = async () => {
    if (!newName || !newCss) return;
    await onSave(newName, newCss, newIconSet);
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
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => onToggle(null)}
            onMouseEnter={() => onPreview("")}
            className={`group flex items-center gap-4 px-6 py-4 rounded-xl border-2 transition-all duration-300 bg-white ${!activeTheme ? 'border-foreground shadow-lg shadow-gray-100' : 'border-gray-100 hover:border-gray-200 opacity-60 hover:opacity-100'}`}
          >
            <div className={`w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform ${!activeTheme ? 'text-foreground' : ''}`}>
              {!activeTheme ? <CheckCircle size={20} weight="fill" className="text-foreground" /> : <Circle size={20} />}
            </div>
            <div className="text-left">
              <div className="font-bold text-sm">Original</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Default System • Lucide Set</div>
            </div>
          </button>

          {themes.map(theme => (
            <button 
              key={theme.id}
              onClick={() => onToggle(theme)}
              onMouseEnter={() => onPreview(theme.css)}
              onMouseLeave={() => onPreview("")}
              className={`group flex items-center gap-4 px-6 py-4 rounded-xl border-2 transition-all duration-300 bg-white ${theme.active ? 'border-foreground shadow-lg shadow-gray-100' : 'border-gray-100 hover:border-gray-200 opacity-60 hover:opacity-100'}`}
            >
              <div className={`w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform ${theme.active ? 'text-foreground' : ''}`}>
                {theme.active ? <CheckCircle size={20} weight="fill" className="text-foreground" /> : <Circle size={20} />}
              </div>
              <div className="text-left relative">
                 <div className="font-bold text-sm flex items-center gap-2">
                   {theme.name}
                   <span onClick={(e) => { e.stopPropagation(); onDelete(theme.id); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity">
                     <Trash size={14} />
                   </span>
                 </div>
                 <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Custom Style • {theme.iconSet || 'Lucide'} Set</div>
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
              
              <div className="flex gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Theme Name</label>
                  <input 
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 ring-gray-900 outline-none transition-all shadow-sm"
                    placeholder="e.g. Cyberpunk"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="w-1/3 space-y-1.5">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Icon Set</label>
                  <select 
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 ring-gray-900 outline-none transition-all shadow-sm bg-white"
                    value={newIconSet}
                    onChange={(e) => setNewIconSet(e.target.value)}
                  >
                    <option value="lucide">Lucide (Default)</option>
                    <option value="phosphor">Phosphor (Soft)</option>
                  </select>
                </div>
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
                      setNewIconSet(preset.iconSet);
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
