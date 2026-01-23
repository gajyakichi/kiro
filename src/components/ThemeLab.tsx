import React, { useState } from 'react';
import { Theme } from '@/lib/types';
import { MagicWand, Trash, Palette, Play, CheckCircle, Circle } from '@phosphor-icons/react';

interface ThemeLabProps {
  themes: Theme[];
  onSave: (name: string, css: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggle: (theme: Theme | null) => Promise<void>;
  onPreview: (css: string) => void;
}

export const ThemeLab: React.FC<ThemeLabProps> = ({ themes, onSave, onDelete, onToggle, onPreview }) => {
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
      name: "Monokai",
      css: `body { background: #272822 !important; color: #f8f8f2 !important; font-weight: 450; }
.notion-sidebar { background: #1e1f1c !important; }
.notion-card { background: #23241f !important; border: 1px solid #49483e !important; color: #f8f8f2 !important; }
.notion-item:hover, .notion-item.active { background: #3e3d32 !important; color: #f92672 !important; }
.notion-text-subtle { color: #a09d8d !important; }
h1, h2, h3 { color: #ae81ff !important; font-weight: 700; }
.accent-text { color: #a6e22e !important; }
:root { --theme-primary: #ae81ff; --theme-primary-bg: rgba(174, 129, 255, 0.15); --theme-accent: #f92672; --theme-accent-bg: rgba(249, 38, 114, 0.2); }`
    },
    {
      name: "Catppuccin",
      css: `body { background: #1e1e2e !important; color: #cdd6f4 !important; font-weight: 450; }
.notion-sidebar { background: #181825 !important; }
.notion-card { background: #313244 !important; border: 1px solid #45475a !important; color: #cdd6f4 !important; }
.notion-item:hover, .notion-item.active { background: #45475a !important; color: #cba6f7 !important; }
.notion-text-subtle { color: #bac2de !important; }
h1, h2, h3 { color: #89b4fa !important; font-weight: 700; }
.accent-text { color: #f5c2e7 !important; }
:root { --theme-primary: #cba6f7; --theme-primary-bg: rgba(203, 166, 247, 0.15); --theme-accent: #89b4fa; --theme-accent-bg: rgba(137, 180, 250, 0.2); }`
    },
    {
      name: "Solarized Dark",
      css: `body { background: #002b36 !important; color: #93a1a1 !important; font-weight: 450; }
.notion-sidebar { background: #073642 !important; border-right: 1px solid #586e75 !important; }
.notion-card { background: #073642 !important; border: 1px solid #586e75 !important; color: #93a1a1 !important; }
.notion-item:hover, .notion-item.active { background: #586e75 !important; color: #eee8d5 !important; }
.notion-text-subtle { color: #839496 !important; }
h1, h2, h3 { color: #268bd2 !important; font-weight: 700; }
.accent-text { color: #268bd2 !important; }
:root { --theme-primary: #268bd2; --theme-primary-bg: rgba(38, 139, 210, 0.15); --theme-accent: #268bd2; --theme-accent-bg: rgba(38, 139, 210, 0.2); }`
    },
    {
      name: "Nord",
      css: `body { background: #2e3440 !important; color: #eceff4 !important; font-weight: 450; }
.notion-sidebar { background: #3b4252 !important; }
.notion-card { background: #434c5e !important; border: 1px solid #4c566a !important; color: #eceff4 !important; }
.notion-item:hover, .notion-item.active { background: #4c566a !important; color: #88c0d0 !important; }
.notion-text-subtle { color: #d8dee9 !important; opacity: 0.8; }
h1, h2, h3 { color: #81a1c1 !important; font-weight: 700; }
.accent-text { color: #88c0d0 !important; }
:root { --theme-primary: #81a1c1; --theme-primary-bg: rgba(129, 161, 193, 0.15); --theme-accent: #a3be8c; --theme-accent-bg: rgba(163, 190, 140, 0.2); }`
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
          {/* Original Theme */}
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
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Default System</div>
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
                 <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Custom Style</div>
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
            {/* Left: Editor */}
            <div className="bg-white notion-card p-6 border-2 border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                 <Palette size={20} className="text-foreground" />
                 <span className="font-bold">Laboratory</span>
              </div>
              <div className="space-y-4">
                <input 
                  className="w-full border border-gray-200 rounded p-2 text-sm focus:ring-2 ring-gray-900 outline-none transition-all"
                  placeholder="Theme Name (e.g. Cyberpunk)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <textarea 
                  className="w-full h-80 border border-gray-200 rounded p-4 text-xs font-mono bg-gray-50 focus:bg-white transition-all focus:ring-2 ring-gray-900 outline-none leading-relaxed"
                  placeholder="/* Add your custom CSS here */\n.notion-card { border-radius: 20px !important; }"
                  value={newCss}
                  onChange={(e) => {
                    setNewCss(e.target.value);
                    onPreview(e.target.value);
                  }}
                />
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
                  className="w-full bg-foreground text-background font-black py-4 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-gray-200 active:scale-[0.98] mt-4"
                >
                  SAVE & ADD TO SELECTOR
                </button>
              </div>
            </div>

            {/* Right: Preview Console */}
            <div className="bg-gray-900 rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-center items-center text-center space-y-6">
              <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 to-blue-500/20 pointer-events-none"></div>
              
              <div className="z-10 text-white flex flex-col items-center">
                <Play size={48} className="text-purple-400 mb-4 animate-pulse" weight="fill" />
                <p className="text-xs uppercase tracking-[0.3em] font-black text-purple-400 mb-2">Editor Mode: Active</p>
                <p className="text-sm opacity-80 leading-relaxed px-4">
                  Changes typed here are <span className="text-purple-300 font-bold underline italic">immediately applied</span> as a temporary preview to the entire console.
                </p>
                <div className="mt-8 px-4 py-2 bg-white/10 rounded-lg border border-white/10 text-[10px] font-mono opacity-60">
                  Total Control: CSS @ Dashboard
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
