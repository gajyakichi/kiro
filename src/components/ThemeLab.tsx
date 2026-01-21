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
      css: `body { background: #2b2b2b !important; color: #a9b7c6 !important; }
.notion-sidebar { background: #3c3f41 !important; border-right: 1px solid #2b2b2b !important; }
.notion-card { background: #313335 !important; border: 1px solid #4e5052 !important; box-shadow: none !important; color: #a9b7c6 !important; }
.notion-item:hover, .notion-item.active { background: #4e5254 !important; color: #cc7832 !important; }
.accent-text { color: #cc7832 !important; }`
    },
    {
      name: "Monokai",
      css: `body { background: #272822 !important; color: #f8f8f2 !important; }
.notion-sidebar { background: #1e1f1c !important; }
.notion-card { background: #23241f !important; border: 1px solid #49483e !important; }
.notion-item:hover, .notion-item.active { background: #3e3d32 !important; color: #f92672 !important; }
.accent-text { color: #a6e22e !important; }`
    },
    {
      name: "Catppuccin",
      css: `body { background: #1e1e2e !important; color: #cdd6f4 !important; }
.notion-sidebar { background: #181825 !important; }
.notion-card { background: #313244 !important; border: 1px solid #45475a !important; color: #cdd6f4 !important; }
.notion-item:hover, .notion-item.active { background: #45475a !important; color: #cba6f7 !important; }
.accent-text { color: #f5c2e7 !important; }`
    },
    {
      name: "Solarized Dark",
      css: `body { background: #002b36 !important; color: #839496 !important; }
.notion-sidebar { background: #073642 !important; border-right: 1px solid #586e75 !important; }
.notion-card { background: #073642 !important; border: 1px solid #586e75 !important; color: #93a1a1 !important; }
.notion-item:hover, .notion-item.active { background: #586e75 !important; color: #eee8d5 !important; }
.accent-text { color: #268bd2 !important; }`
    },
    {
      name: "Nord",
      css: `body { background: #2e3440 !important; color: #d8dee9 !important; }
.notion-sidebar { background: #3b4252 !important; }
.notion-card { background: #434c5e !important; border: 1px solid #4c566a !important; color: #eceff4 !important; }
.notion-item:hover, .notion-item.active { background: #4c566a !important; color: #88c0d0 !important; }
.accent-text { color: #88c0d0 !important; }`
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
            className={`group flex items-center gap-4 px-6 py-4 rounded-xl border-2 transition-all duration-300 bg-white ${!activeTheme ? 'border-black shadow-lg shadow-gray-100' : 'border-gray-100 hover:border-gray-200 opacity-60 hover:opacity-100'}`}
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
              {!activeTheme ? <CheckCircle size={20} weight="fill" className="text-black" /> : <Circle size={20} />}
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
              className={`group flex items-center gap-4 px-6 py-4 rounded-xl border-2 transition-all duration-300 bg-white ${theme.active ? 'border-purple-500 shadow-lg shadow-purple-50' : 'border-gray-100 hover:border-gray-200 opacity-60 hover:opacity-100'}`}
            >
              <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                {theme.active ? <CheckCircle size={20} weight="fill" className="text-purple-500" /> : <Circle size={20} />}
              </div>
              <div className="text-left relative">
                 <div className="font-bold text-sm flex items-center gap-2">
                   {theme.name}
                   <span onClick={(e) => { e.stopPropagation(); onDelete(theme.id); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity">
                     <Trash size={14} />
                   </span>
                 </div>
                 <div className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">Custom Style</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Editor Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <MagicWand size={24} className="text-purple-500 animate-pulse" weight="fill" />
            <h2 className="text-xl font-bold tracking-tight text-gray-800 uppercase">Editor & Preview</h2>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`notion-item px-4 py-2 rounded-md font-medium text-sm transition-all ${isAdding ? 'bg-gray-100 text-gray-600' : 'bg-black text-white'}`}
          >
            {isAdding ? "Close Editor" : "Open CSS Editor"}
          </button>
        </div>

        {isAdding && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-500">
            {/* Left: Editor */}
            <div className="bg-white notion-card p-6 border-2 border-purple-100">
              <div className="flex items-center gap-3 mb-4">
                 <Palette size={20} className="text-purple-500" />
                 <span className="font-bold">Laboratory</span>
              </div>
              <div className="space-y-4">
                <input 
                  className="w-full border border-gray-200 rounded p-2 text-sm focus:ring-2 ring-purple-500 outline-none transition-all"
                  placeholder="Theme Name (e.g. Cyberpunk)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <textarea 
                  className="w-full h-80 border border-gray-200 rounded p-4 text-xs font-mono bg-gray-50 focus:bg-white transition-all focus:ring-2 ring-purple-500 outline-none leading-relaxed"
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
                      className="text-[10px] bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full hover:bg-purple-600 hover:text-white font-bold transition-all"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleSave}
                  className="w-full bg-purple-600 text-white font-black py-4 rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 active:scale-[0.98] mt-4"
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
