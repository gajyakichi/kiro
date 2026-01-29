// Force recompile - 2026-01-28 20:20 - GitHub Dimmed removed
import React, { useState } from 'react';
import { Theme } from '@/lib/types';
import { MagicWand, Trash, Palette, CheckCircle, Circle, Folder, Clock, DownloadSimple, UploadSimple } from '@phosphor-icons/react';
import { IconRenderer } from './IconRenderer';

interface ThemeLabProps {
  themes: Theme[];
  onSave: (name: string, css: string, active?: boolean, isPreset?: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggle: (theme: Theme | null) => Promise<void>;
  onPreview: (css: string) => void;
  appIconSet: string;
  onUpdateIconSet: (set: string) => void;
  appSkin: string;
  onUpdateSkin: (skin: string) => void;
}

const minifyCss = (css: string) => {
  return css.replace(/\s+/g, ' ').replace(/\/\*.*?\*\//g, '').trim();
};

const PRESET_THEMES = [
    {
      name: "Nord",
      isPreset: true,
      css: `html, body { background: #2e3440 !important; color: #d8dee9 !important; --background: #2e3440; --foreground: #d8dee9; --card-bg: #434c5e; --sidebar-bg: #3b4252; --hover-bg: rgba(255,255,255,0.1); --theme-primary: #88c0d0; --theme-primary-bg: rgba(136, 192, 208, 0.15); --border-color: rgba(255, 255, 255, 0.1); --theme-accent: #88c0d0; } .notion-sidebar { background: #3b4252 !important; } .notion-card { background: #434c5e !important; border: 1px solid #4c566a !important; color: #eceff4 !important; } .notion-item:hover, .notion-item.active { background: #4c566a !important; color: #88c0d0 !important; } .notion-text-subtle { color: #616e88 !important; } h1, h2, h3 { color: #81a1c1 !important; } .accent-text { color: #88c0d0 !important; } :root, .theme-active { --background: #2e3440; --foreground: #d8dee9; --card-bg: #434c5e; --sidebar-bg: #3b4252; --hover-bg: rgba(255,255,255,0.1); --border-color: rgba(255, 255, 255, 0.1); --theme-primary: #88c0d0; --theme-primary-bg: rgba(136, 192, 208, 0.15); --theme-accent: #88c0d0; }`
    },
    {
      name: "Monokai",
      isPreset: true,
      css: `html, body { background: #272822 !important; color: #f8f8f2 !important; --background: #272822; --foreground: #f8f8f2; --card-bg: #23241f; --sidebar-bg: #1e1f1c; --hover-bg: rgba(255,255,255,0.1); --theme-primary: #ae81ff; --theme-primary-bg: rgba(174, 129, 255, 0.15); --border-color: rgba(255, 255, 255, 0.1); } .notion-sidebar { background: #1e1f1c !important; } .notion-card { background: #23241f !important; border: 1px solid #49483e !important; color: #f8f8f2 !important; } .notion-item:hover, .notion-item.active { background: #3e3d32 !important; color: #f92672 !important; } .notion-text-subtle { color: #88846f !important; } h1, h2, h3 { color: #ae81ff !important; } .accent-text { color: #a6e22e !important; } :root, .theme-active { --background: #272822; --foreground: #f8f8f2; --card-bg: #23241f; --sidebar-bg: #1e1f1c; --hover-bg: rgba(255,255,255,0.1); --border-color: rgba(255, 255, 255, 0.1); --theme-primary: #ae81ff; --theme-primary-bg: rgba(174, 129, 255, 0.15); --theme-accent: #f92672; }`
    },
    {
      name: "Solarized Light",
      isPreset: true,
      css: `html, body { background: #fdf6e3 !important; color: #657b83 !important; --background: #fdf6e3; --foreground: #657b83; --card-bg: #fdf6e3; --sidebar-bg: #eee8d5; --hover-bg: rgba(0,0,0,0.05); --border-color: #dcd3ba; --theme-primary: #268bd2; --theme-primary-bg: rgba(38, 139, 210, 0.1); --theme-accent: #859900; }
.notion-sidebar { background: #eee8d5 !important; }
.notion-card { background: #fdf6e3 !important; border: 1px solid #dcd3ba !important; }
.notion-item:hover, .notion-item.active { background: #eee8d5 !important; color: #268bd2 !important; }
h1, h2, h3 { color: #268bd2 !important; }
:root, .theme-active { --background: #fdf6e3; --foreground: #657b83; --card-bg: #fdf6e3; --sidebar-bg: #eee8d5; --hover-bg: rgba(0,0,0,0.05); --border-color: #dcd3ba; --theme-primary: #268bd2; --theme-primary-bg: rgba(38, 139, 210, 0.1); --theme-accent: #859900; }`
    },
    {
      name: "Solarized Dark",
      isPreset: true,
      css: `html, body { background: #002b36 !important; color: #839496 !important; --background: #002b36; --foreground: #839496; --card-bg: #002b36; --sidebar-bg: #073642; --hover-bg: rgba(255,255,255,0.1); --border-color: #073642; --theme-primary: #268bd2; --theme-primary-bg: rgba(38, 139, 210, 0.1); --theme-accent: #859900; }
.notion-sidebar { background: #073642 !important; }
.notion-card { background: #002b36 !important; border: 1px solid #073642 !important; color: #839496 !important; }
.notion-item:hover, .notion-item.active { background: #073642 !important; color: #268bd2 !important; }
h1, h2, h3 { color: #268bd2 !important; }
:root, .theme-active { --background: #002b36; --foreground: #839496; --card-bg: #002b36; --sidebar-bg: #073642; --hover-bg: rgba(255,255,255,0.1); --border-color: #073642; --theme-primary: #268bd2; --theme-primary-bg: rgba(38, 139, 210, 0.1); --theme-accent: #859900; }`
    },
    {
      name: "Darcula",
      isPreset: true,
      css: `html, body { background: #2b2b2b !important; color: #a9b7c6 !important; font-weight: 450; --background: #2b2b2b; --foreground: #a9b7c6; --card-bg: #313335; --sidebar-bg: #3c3f41; --hover-bg: rgba(255,255,255,0.1); --border-color: #4e5052; --theme-primary: #cc7832; --theme-primary-bg: rgba(204, 120, 50, 0.15); --theme-accent: #cc7832; }
.notion-sidebar { background: #3c3f41 !important; border-right: 1px solid #2b2b2b !important; }
.notion-card { background: #313335 !important; border: 1px solid #4e5052 !important; box-shadow: none !important; color: #cfd8dc !important; }
.notion-item:hover, .notion-item.active { background: #4e5254 !important; color: #cc7832 !important; }
h1, h2, h3 { color: #cc7832 !important; }
:root, .theme-active { --background: #2b2b2b; --foreground: #a9b7c6; --card-bg: #313335; --sidebar-bg: #3c3f41; --hover-bg: rgba(255,255,255,0.1); --border-color: #4e5052; --theme-primary: #cc7832; --theme-primary-bg: rgba(204, 120, 50, 0.15); --theme-accent: #cc7832; }`
    },
    {
      name: "Synthwave '84",
      isPreset: true,
      css: `html, body { background: #2b213a !important; color: #fff !important; background: linear-gradient(to bottom, #2b213a 0%, #241b35 100%) fixed !important; --background: #2b213a; --foreground: #fff; --card-bg: #2b213a; --sidebar-bg: #241b35; --hover-bg: rgba(255,255,255,0.1); --border-color: rgba(255,255,255,0.13); --theme-primary: #ff7edb; --theme-primary-bg: rgba(255, 126, 219, 0.2); --theme-accent: #36f9f6; --theme-accent-bg: rgba(54, 249, 246, 0.2); }
.notion-sidebar { background: #241b35 !important; border-right: 1px solid #fff2 !important; }
.notion-card { background: #2b213a !important; border: 1px solid #ff7edb !important; box-shadow: 0 0 10px rgba(255, 126, 219, 0.2) !important; color: #fff !important; }
.notion-item:hover, .notion-item.active { background: #34294f !important; color: #f97e72 !important; text-shadow: 0 0 5px rgba(249, 126, 114, 0.6); }
h1, h2, h3 { color: #fe4450 !important; text-shadow: 0 0 10px rgba(254, 68, 80, 0.5); }
:root, .theme-active { --background: #2b213a; --foreground: #fff; --card-bg: #2b213a; --sidebar-bg: #241b35; --hover-bg: rgba(255,255,255,0.1); --border-color: rgba(255,255,255,0.13); --theme-primary: #ff7edb; --theme-primary-bg: rgba(255, 126, 219, 0.2); --theme-accent: #36f9f6; --theme-accent-bg: rgba(54, 249, 246, 0.2); }
.notion-text-subtle { color: #72f1b8 !important; }`
    }
  ];

export const ThemeLab: React.FC<ThemeLabProps> = React.memo(({ themes, onSave, onDelete, onToggle, onPreview, appIconSet, onUpdateIconSet, appSkin, onUpdateSkin }) => {
  const [newName, setNewName] = useState("");
  const [newCss, setNewCss] = useState("");
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const activeTheme = React.useMemo(() => themes.find(t => t.active) || null, [themes]);
  
  const displayedPresets = React.useMemo(() => 
    PRESET_THEMES.filter(p => !themes.some(t => t.name === p.name)),
  [themes]);

  const handleSelectForEdit = React.useCallback((preset: (typeof PRESET_THEMES)[0]) => {
    setNewName(preset.name);
    const minified = minifyCss(preset.css);
    setNewCss(minified);
    setEditingTheme({ id: -1, name: preset.name, css: minified, active: false, isPreset: true });
    onPreview(minified);
  }, [onPreview]);

  const handleSave = async () => {
    if (!newName || !newCss) return;
    const minified = minifyCss(newCss);
    await onSave(newName, minified);
    setNewName("");
    setNewCss("");
    setIsAdding(false);
    setEditingTheme(null);
  };

  const handleQuickAdd = async (preset: { name: string, css: string, isPreset?: boolean }) => {
    const existing = themes.find(t => t.name === preset.name);
    if (existing) {
      await onToggle(existing);
    } else {
      await onSave(preset.name, minifyCss(preset.css), true, preset.isPreset);
    }
  };

  const handleExport = () => {
    // Export full configuration: skin, icon set, and custom themes
    const exportData = {
      type: 'kiro-config',
      version: 1,
      settings: {
        appSkin,
        appIconSet
      },
      themes: themes.filter(t => !t.isPreset)
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "kiro_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = async (e) => {
        try {
          if (e.target?.result) {
            const rawData = JSON.parse(e.target.result as string);
            
            // Check if it's the new config format
            if (rawData.type === 'kiro-config' && rawData.settings) {
                if (rawData.settings.appSkin) onUpdateSkin(rawData.settings.appSkin);
                if (rawData.settings.appIconSet) onUpdateIconSet(rawData.settings.appIconSet);
                
                if (Array.isArray(rawData.themes)) {
                    let importedCount = 0;
                    for (const theme of rawData.themes) {
                        if (!theme.name || !theme.css) continue;
                        await onSave(theme.name, theme.css, false, false);
                        importedCount++;
                    }
                    alert(`Configuration imported!\n- Updated Settings\n- Imported ${importedCount} themes`);
                } else {
                    alert('Configuration imported (Settings updated)');
                }
            } 
            // Legacy support: Array of themes
            else if (Array.isArray(rawData)) {
              for (const theme of rawData) {
                // Skip if not valid theme object
                if (!theme.name || !theme.css) continue;
                // Import as new custom theme
                await onSave(theme.name, theme.css, false, false);
              }
              alert(`Successfully imported ${rawData.length} themes!`);
            } else {
                 alert("Unknown file format.");
            }
          }
        } catch (error) {
          console.error("Error importing themes:", error);
          alert("Failed to import. Invalid JSON file.");
        }
      };
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* Theme Selector Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Palette size={16} className="text-(-foreground)" weight="bold" />
          <h2 className="text-sm font-bold tracking-tight text-(-foreground) uppercase">Theme Selector</h2>
        </div>

        {/* Global Icon Settings Row */}
        {/* Global Icon Settings Row */}
        <div className="mb-4 p-3 bg-(-card-bg) rounded-lg border border-(-border-color) flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
             <div className="w-8 h-8 shrink-0 rounded-lg bg-(-sidebar-bg) border border-(-border-color) flex items-center justify-center shadow-xs">
                <IconRenderer icon="Settings" size={16} className="text-(-foreground)" baseSet={appIconSet} />
             </div>
             <div className="min-w-0">
                <p className="text-xs font-bold text-(-foreground) tracking-tight truncate">Global Icon Set</p>
                <p className="text-[9px] text-(-foreground) font-semibold uppercase tracking-widest whitespace-nowrap truncate">Selected style applies everywhere</p>
             </div>
          </div>
          <div className="flex bg-(-sidebar-bg) p-1.5 rounded-xl border border-(-border-color) gap-1 shrink-0 shadow-sm whitespace-nowrap overflow-x-auto max-w-full no-scrollbar">
             <button 
                onClick={() => onUpdateIconSet('lucide')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-semibold tracking-widest transition-all duration-300 active:scale-95 ${appIconSet === 'lucide' ? 'bg-(-theme-primary) text-(-foreground) shadow-lg ring-2 ring-(--theme-primary)/20' : 'text-(-foreground) opacity-60 hover:opacity-100 hover:bg-(-hover-bg)'}`}
             >
                LUCIDE
             </button>
             <button 
                onClick={() => onUpdateIconSet('phosphor')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-semibold tracking-widest transition-all duration-300 active:scale-95 ${appIconSet === 'phosphor' ? 'bg-(-theme-primary) text-(-foreground) shadow-lg ring-2 ring-(--theme-primary)/20' : 'text-(-foreground) opacity-60 hover:opacity-100 hover:bg-(-hover-bg)'}`}
             >
                PHOSPHOR
             </button>
             <button 
                onClick={() => onUpdateIconSet('original')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-semibold tracking-widest transition-all duration-300 active:scale-95 ${appIconSet === 'original' ? 'bg-(-theme-primary) text-(-foreground) shadow-lg ring-2 ring-(--theme-primary)/20' : 'text-(-foreground) opacity-60 hover:opacity-100 hover:bg-(-hover-bg)'}`}
             >
                ORIGINAL
             </button>
          </div>
        </div>

        {/* Global Skin Settings Row */}
        <div className="mb-4 p-3 bg-(-card-bg) rounded-lg border border-(-border-color) flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
             <div className="w-8 h-8 shrink-0 rounded-lg bg-(-sidebar-bg) border border-(-border-color) flex items-center justify-center shadow-xs">
                <Palette size={16} className="text-(-foreground)" weight="fill" />
             </div>
             <div className="min-w-0">
                <p className="text-xs font-bold text-(-foreground) tracking-tight truncate">Display Skin</p>
                <p className="text-[9px] text-(-foreground) font-semibold uppercase tracking-widest whitespace-nowrap truncate">Layout Density & Spacing</p>
             </div>
          </div>
          <div className="flex bg-(-sidebar-bg) p-1.5 rounded-xl border border-(-border-color) gap-1 shrink-0 shadow-sm whitespace-nowrap overflow-x-auto max-w-full no-scrollbar">
             <button 
                onClick={() => onUpdateSkin('notion')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-semibold tracking-widest transition-all duration-300 active:scale-95 ${appSkin !== 'vscode' ? 'bg-(-theme-primary) text-(-foreground) shadow-lg' : 'text-(-foreground) opacity-60 hover:opacity-100 hover:bg-(-hover-bg)'}`}
             >
                ROUND (DEFAULT)
             </button>
             <button 
                onClick={() => onUpdateSkin('vscode')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-semibold tracking-widest transition-all duration-300 active:scale-95 ${appSkin === 'vscode' ? 'bg-(-theme-primary) text-(-foreground) shadow-lg' : 'text-(-foreground) opacity-60 hover:opacity-100 hover:bg-(-hover-bg)'}`}
             >
                COMPACT (DENSE)
             </button>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 pt-2 pb-2">
          <button 
            onClick={() => onToggle(null)}
            onMouseEnter={() => onPreview("")}
            onMouseLeave={() => onPreview(newCss)}
            className={`group flex items-center gap-3 px-3 py-2 rounded-md border-2 transition-all duration-200 bg-(-card-bg) hover:-translate-y-1 hover:shadow-lg hover:z-20 active:scale-[0.98] outline-none relative ${!activeTheme ? 'border-(--theme-primary) shadow-xl' : 'border-(-border-color) hover:border-(--theme-primary)/50 '}`}
          >
            <div className={`w-5 h-5 rounded-full bg-(-card-bg) border border-(-border-color) flex items-center justify-center text-(-foreground) group-hover:scale-110 transition-transform duration-200 ${!activeTheme ? 'text-foreground border-foreground/10' : ''}`}>
              {!activeTheme ? <CheckCircle size={12} weight="fill" className="text-foreground" /> : <Circle size={12} />}
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-sm tracking-tight">Original</div>
              <div className="text-[10px] text-(-foreground) uppercase tracking-widest font-semibold opacity-60">Default System</div>
            </div>
          </button>

          {/* Render Presets that haven't been added yet */}
          {displayedPresets.map(preset => (
            <button 
              key={preset.name}
              onClick={() => handleQuickAdd(preset)}
              onMouseEnter={() => onPreview(preset.css)}
              onMouseLeave={() => onPreview(newCss)}
              className={`group flex items-center gap-3 px-3 py-2 rounded-md border border-(-border-color) bg-(-card-bg) transition-all duration-200 hover:bg-(-hover-bg) active:scale-[0.98] outline-none relative`}
            >
              <div className="w-5 h-5 rounded-full bg-(-hover-bg) border border-(-border-color) flex items-center justify-center text-gray-300 group-hover:scale-110 transition-transform">
                <Circle size={12} />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-sm tracking-tight flex items-center gap-2">
                  {preset.name}
                </div>
                <div className="text-[10px] text-(-foreground) uppercase tracking-widest font-semibold opacity-60">Built-in Preset</div>
              </div>
            </button>
          ))}

          {themes.map(theme => (
            <button 
              key={theme.id}
              onClick={() => onToggle(theme)}
              onMouseEnter={() => onPreview(theme.css)}
              onMouseLeave={() => onPreview(newCss)}
              className={`group flex items-center gap-3 px-3 py-2 rounded-md border-2 transition-all duration-200 bg-(-card-bg) hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:z-20 active:scale-[0.98] outline-none relative ${theme.active ? 'border-(--theme-primary) shadow-xl' : 'border-(-border-color) hover:border-(--theme-primary)/50 '}`}
            >
              <div className={`w-5 h-5 rounded-full bg-(-hover-bg) border border-(-border-color) flex items-center justify-center text-(-foreground) group-hover:scale-110 transition-transform duration-200 ${theme.active ? 'text-(--theme-primary) border-(--theme-primary)/20' : ''}`}>
                {theme.active ? <CheckCircle size={12} weight="fill" className="text-foreground" /> : <Circle size={12} />}
              </div>
              <div className="text-left relative">
                 <div className="font-semibold text-sm flex items-center gap-2 tracking-tight">
                   {theme.name}
                   {!theme.isPreset && (
                     <span onClick={(e) => { e.stopPropagation(); onDelete(theme.id); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all duration-300 transform hover:scale-125">
                       <Trash size={16} />
                     </span>
                   )}
                 </div>
                 <div className="text-[10px] text-(-foreground) uppercase tracking-widest font-semibold opacity-60">{theme.isPreset ? 'Built-in Preset' : 'Custom Style'}</div>
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
            onClick={() => {
              if (!isAdding) {
                setNewName(activeTheme?.name || "");
                setNewCss(activeTheme?.css || "");
                setEditingTheme(activeTheme);
                onPreview(activeTheme?.css || "");
              } else {
                onPreview("");
                setEditingTheme(null);
                setNewName("");
                setNewCss("");
              }
              setIsAdding(!isAdding);
            }}
            className={`notion-item px-4 py-2 rounded-md font-medium text-sm transition-all ${isAdding ? 'bg-(-card-bg) text-(-foreground)' : 'bg-foreground text-background'}`}
          >
            {isAdding ? "Close Editor" : "Open CSS Editor"}
          </button>
                    <div className="flex gap-2 ml-2">
              <button
                onClick={handleExport}
                title="Export Configuration (Themes, Skin, Icons)"
                className="p-2 rounded-md bg-(-card-bg) border border-(-border-color) text-(-foreground) hover:bg-(-sidebar-bg) hover:text-foreground transition-all"
              >
                 <DownloadSimple size={18} weight="bold" />
              </button>
              <label
                title="Import Configuration"
                className="p-2 rounded-md bg-(-card-bg) border border-(-border-color) text-(-foreground) hover:bg-(-sidebar-bg) hover:text-foreground transition-all cursor-pointer"
              >
                 <UploadSimple size={18} weight="bold" />
                 <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
           </div>
        </div>

        {isAdding && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-200">
            <div className="bg-(-card-bg) notion-card p-6 border border-(-border-color) space-y-6">
              <div className="flex items-center gap-3">
                 <Palette size={20} className="text-foreground" />
                 <span className="font-bold">Laboratory</span>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest pl-1">Theme Name</label>
                <input 
                  className="w-full border border-(-border-color) rounded-xl p-3 text-sm focus:ring-2 ring-gray-900 outline-none transition-all shadow-sm disabled:opacity-50"
                  placeholder="e.g. Cyberpunk"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={editingTheme?.isPreset}
                />
              </div>

              <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest pl-1">Custom CSS</label>
                  <textarea 
                    className="w-full h-80 border border-(-border-color) rounded-2xl p-4 text-xs font-mono bg-(-sidebar-bg) focus:bg-(-card-bg) transition-all focus:ring-2 ring-gray-900 outline-none leading-relaxed shadow-xs disabled:opacity-50"
                    placeholder="/* Add your custom CSS here */"
                    value={newCss}
                    readOnly={editingTheme?.isPreset}
                    onChange={(e) => {
                        if (!editingTheme?.isPreset) {
                          setNewCss(e.target.value);
                          onPreview(e.target.value);
                        }
                    }}
                  />
                  {editingTheme?.isPreset && <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Note: Presets are fixed and cannot be edited</p>}
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESET_THEMES.map(preset => (
                  <button 
                    key={preset.name}
                    onClick={() => handleSelectForEdit(preset)}
                    className={`text-[10px] px-3 py-1.5 rounded-full font-bold transition-all ${newName === preset.name ? 'bg-purple-600 text-white' : 'bg-(-card-bg) text-(-foreground) hover:bg-foreground hover:text-background'}`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleSave}
                disabled={editingTheme?.isPreset}
                className="w-full bg-foreground text-background font-semibold py-4 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-gray-200 active:scale-[0.98] disabled:opacity-50"
              >
                {editingTheme?.isPreset ? 'PRESET MODE ACTIVE (READ-ONLY)' : 'SAVE & ADD TO SELECTOR'}
              </button>
            </div>

            <div className="bg-[#0a0a0a] rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-start items-center space-y-8 border border-white/5 transition-colors duration-700 ease-in-out" style={newCss && editingTheme === null && !activeTheme ? {} : { transition: 'background 0.5s', background: 'var(--background)' }}>
              {/* Overlay for "Original" mode or when no specific theme is active in preview but we want base dark bg */}
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0,transparent_100%)] pointer-events-none mix-blend-overlay"></div>
              
              <div className="z-10 w-full flex justify-between items-center bg-(-card-bg)/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <div className="w-8 h-8 rounded-full bg-(-theme-primary) flex items-center justify-center text-white shadow-lg">
                    <CheckCircle size={18} weight="fill" />
                  </div>
                  <div>
                    <p className="text-[10px] opacity-60 font-semibold uppercase tracking-widest">Live System</p>
                    <p className="text-sm font-bold">Theme Preview</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-(-theme-primary) text-white rounded-full text-[9px] font-semibold uppercase tracking-tighter shadow-sm animate-pulse">LIVE</div>
              </div>

              <div className="z-10 w-full space-y-4">
                {/* Sample UI 1: Project Card */}
                <div className="notion-card p-5 border shadow-2xl scale-100 transition-all duration-200 rounded-3xl w-full text-left" style={{ background: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-2xl bg-(--theme-primary-bg) text-(--theme-primary) flex items-center justify-center shadow-inner">
                        <Folder size={20} weight="fill" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm tracking-tight leading-none mb-1">Preview Project</h4>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                          <span className="text-[9px] uppercase tracking-widest font-bold opacity-50">Active Now</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                     <div className="flex justify-between text-[10px] font-bold opacity-60">
                        <span>Progress</span>
                        <span>75%</span>
                     </div>
                     <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                       <div className="h-full bg-(-theme-primary) w-[75%] rounded-full shadow-[0_0_10px_var(--theme-primary)]"></div>
                     </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-2 py-1 rounded bg-(--theme-primary-bg) text-(--theme-primary) text-[8px] font-semibold uppercase tracking-wider border border-transparent hover:border-(--theme-primary) transition-colors cursor-default">Refactor</div>
                    <div className="px-2 py-1 rounded bg-(--theme-accent-bg) text-(--theme-accent) text-[8px] font-semibold uppercase tracking-wider border border-transparent hover:border-(--theme-accent) transition-colors cursor-default">UI/UX</div>
                  </div>
                </div>

                {/* Sample UI 2: Small Note */}
                <div className="notion-card p-5 border opacity-90 scale-95 origin-top transition-all duration-200 rounded-3xl w-full text-left" style={{ background: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border-color)' }}>
                   <p className="text-[11px] font-medium leading-relaxed mb-4">
                     This is how your <span className="text-(--theme-primary) font-semibold">Colors</span> and <span className="opacity-60 italic">Typography</span> will feel in the actual editor.
                   </p>
                   {/* Dummy Checklist */}
                   <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs">
                         <div className="w-4 h-4 rounded bg-(-theme-primary) flex items-center justify-center text-white"><CheckCircle size={10} weight="fill" /></div>
                         <span className="opacity-50 line-through">Completed Task</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                         <div className="w-4 h-4 rounded border border-(-border-color)"></div>
                         <span>Pending Task</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 pt-2 border-t border-(-border-color) opacity-50 uppercase text-[8px] font-semibold tracking-widest">
                      <Clock size={10} /> 2 Minutes Ago
                   </div>
                </div>
              </div>

              <div className="z-10 bg-(-card-bg)/5 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/5 text-[10px] text-neutral-400 font-bold uppercase tracking-[0.2em] shadow-xl">
                 Real-time Reflecting...
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
});

ThemeLab.displayName = 'ThemeLab';
