"use client";

import { useEffect, useState, useCallback } from 'react';
import { Settings, Database, Server, Save, RotateCcw, ArrowLeft, Cloud, ShieldCheck, AlertTriangle, RefreshCw, Plus, X, Folder, LayoutGrid, Package, Blocks, Languages } from 'lucide-react';
import Link from 'next/link';
import { Vault, Theme } from '@/lib/types';
import { getTranslation } from '@/lib/i18n';
import { AVAILABLE_PLUGINS } from '@/lib/plugins';
import { PromptVault } from '@/components/PromptVault';


const VaultManager = ({ appLang = 'en', onVaultSwitch }: { appLang?: string, onVaultSwitch: () => void }) => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newVaultName, setNewVaultName] = useState("");
  const [newVaultPath, setNewVaultPath] = useState("");
  const [loading, setLoading] = useState(true);

  const t = getTranslation(appLang);

  useEffect(() => {
    fetchVaults();
  }, []);

  const fetchVaults = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vaults');
      const data = await res.json();
      setVaults(data);
    } catch (e) {
      console.error("Failed to fetch vaults", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newVaultName || !newVaultPath) return;
    try {
      await fetch('/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newVaultName, path: newVaultPath })
      });
      setNewVaultName("");
      setNewVaultPath("");
      setIsAdding(false);
      fetchVaults();
    } catch (e) {
      console.error("Failed to add vault", e);
    }
  };

  const handleSwitch = async (id: string) => {
    try {
      await fetch('/api/vaults', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchVaults();
      onVaultSwitch();
      // Reload is often simpler to reset all states across the app
      window.location.reload();
    } catch (e) {
      console.error("Failed to switch vault", e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/vaults?id=${id}`, { method: 'DELETE' });
      fetchVaults();
    } catch (e) {
      console.error("Failed to delete vault", e);
    }
  };

  const handleSelectDirectory = async () => {
    if (window.electron?.selectDirectory) {
      const path = await window.electron.selectDirectory();
      if (path) {
        setNewVaultPath(path);
      }
    }
  };

  if (loading) return <div className="text-xs text-(-foreground) animate-pulse">{t.loading_vault}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs notion-text-subtle max-w-md leading-relaxed">
          {t.vault_manager_desc}
        </p>
        <div className="flex gap-2">
            <button 
              onClick={fetchVaults}
              className="p-2 bg-(-card-bg) text-(-foreground) rounded-xl hover:bg-(-hover-bg) transition-all shadow-sm"
              title="Refresh"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-2 px-4 py-2 bg-(-theme-primary) text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-sm whitespace-nowrap"
            >
              {isAdding ? <X size={12} /> : <Plus size={12} />}
              {isAdding ? t.cancel : t.add_new_vault}
            </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-(--theme-primary-bg) px-3 py-2 rounded-md border-(-border-color) animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-(--theme-primary) uppercase tracking-widest opacity-60">{t.vault_name_label}</label>
              <input 
                type="text" 
                value={newVaultName}
                onChange={(e) => setNewVaultName(e.target.value)}
                placeholder={t.vault_name_placeholder}
                className="w-full p-4 bg-(-card-bg) border border-(-border-color) rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/20 transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-(--theme-primary) uppercase tracking-widest opacity-60">{t.dir_path_label}</label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={newVaultPath}
                  onChange={(e) => setNewVaultPath(e.target.value)}
                  placeholder={t.dir_path_placeholder}
                  className="w-full p-4 bg-(-card-bg) border border-(-border-color) rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/20 pr-12 transition-all font-mono"
                />
                <button 
                  onClick={handleSelectDirectory}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                    window.electron 
                    ? 'text-(--theme-primary) hover:bg-(--theme-primary-bg)' 
                    : 'text-(-foreground) opacity-20 cursor-not-allowed'
                  }`}
                  disabled={!window.electron}
                  title={window.electron ? t.select_folder_title : t.native_dialog_not_available}
                >
                  <Folder size={14} />
                </button>
              </div>
              {!window.electron && <p className="text-[9px] text-orange-500 font-medium">{t.native_desc_only_desktop}</p>}
            </div>
          </div>
          <button 
            onClick={handleAdd}
            className="w-full py-3 bg-(-theme-primary) text-white rounded-xl text-xs font-black shadow-lg shadow-(--theme-primary)/10 hover:opacity-90 transition-all"
          >
            {t.confirm_add_vault}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {vaults.map((vault) => (
          <div 
            key={vault.id} 
            className={`group flex items-center justify-between px-3 py-2 rounded-md border transition-all ${
              vault.active 
                ? 'border-(--theme-primary) bg-(-card-bg) shadow-md' 
                : 'border-(-border-color) hover:border-(-border-color) bg-(-card-bg)/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${vault.active ? 'bg-(-theme-primary) text-white' : 'bg-(-card-bg) text-(-foreground) group-hover:bg-(-hover-bg)'}`}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="font-bold text-[15px] flex items-center gap-3">
                  {vault.name}
                  {vault.active && <span className="text-[9px] bg-(--theme-success-bg) text-(--theme-success) px-2 py-0.5 rounded-full uppercase font-black tracking-tighter">{t.current_active}</span>}
                </div>
                <div className="text-[11px] notion-text-subtle font-mono mt-1 opacity-60">{vault.path || t.internal}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {!vault.active ? (
                <>
                  <button 
                    onClick={() => handleSwitch(vault.id)}
                    className="px-4 py-2 bg-(-card-bg) text-(--theme-primary) hover:bg-(-theme-primary) hover:text-white rounded-xl text-[11px] font-black transition-all"
                  >
                    {t.select}
                  </button>
                  {vault.id !== 'default' && (
                    <button 
                      onClick={() => handleDelete(vault.id)}
                      className="p-2 text-(-foreground) hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X size={14} />
                    </button>
                  )}
                </>
              ) : (
                <div className="p-2 text-(--theme-success)">
                   <ShieldCheck size={12} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const [config, setConfig] = useState({
    STORAGE_MODE: 'local',
    DATABASE_URL: 'file:./prisma.db',
    OPENAI_API_KEY: '',
    AI_MODEL: 'gpt-4o-mini',
    AI_PROVIDER: 'openai',
    OLLAMA_BASE_URL: 'http://localhost:11434',
    VAULT_PATH: '',
    APP_LANG: 'en',
    ENABLED_PLUGINS: ''
  });
  const [themes, setThemes] = useState<Theme[]>([]);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [customPlugins, setCustomPlugins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setConfig(data);
    } catch (e) {
      console.error('Failed to fetch settings', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomPlugins = useCallback(async () => {
      try {
          const res = await fetch('/api/plugins');
          const data = await res.json();
          if (Array.isArray(data)) {
            setCustomPlugins(data);
          }
      } catch (e) {
          console.error("Failed to fetch custom plugins", e);
      }
  }, []);

  const handlePluginToggle = (pluginId: string) => {
    const currentPlugins = config.ENABLED_PLUGINS ? config.ENABLED_PLUGINS.split(',') : [];
    const isEnabled = currentPlugins.includes(pluginId);
    let newPlugins: string[] = [];

    if (isEnabled) {
      newPlugins = currentPlugins.filter(p => p !== pluginId);
    } else {
      newPlugins = [...currentPlugins, pluginId];
    }
    
    setConfig(prev => ({ ...prev, ENABLED_PLUGINS: newPlugins.join(',') }));
  };

  const handleImportPlugin = async () => {
      try {
          const text = await navigator.clipboard.readText();
          const pluginDef = JSON.parse(text);
          
          if (!pluginDef.id || !pluginDef.name) {
              setMessage({ type: 'error', text: 'Invalid plugin definition in clipboard' });
              return;
          }

          const res = await fetch('/api/plugins', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pluginDef)
          });

          if (res.ok) {
              setMessage({ type: 'success', text: `Plugin "${pluginDef.name}" imported!` });
              fetchCustomPlugins();
          } else {
              const err = await res.json();
              setMessage({ type: 'error', text: err.error || 'Failed to import plugin' });
          }
      } catch {
          setMessage({ type: 'error', text: 'Failed to read from clipboard or parse JSON' });
      }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleExportPlugin = (plugin: any) => {
      const json = JSON.stringify(plugin, null, 2);
      navigator.clipboard.writeText(json);
      setMessage({ type: 'success', text: `Exported "${plugin.name}" to clipboard` });
  };

  const handleDeletePlugin = async (id: string, name: string) => {
      if (!confirm(`Delete plugin "${name}"?`)) return;
      
      try {
          await fetch(`/api/plugins?id=${id}`, { method: 'DELETE' });
          setMessage({ type: 'success', text: 'Plugin deleted' });
          fetchCustomPlugins();
          
          // Also disable it if enabled
          if (config.ENABLED_PLUGINS.includes(id)) {
              handlePluginToggle(id);
          }
      } catch {
          setMessage({ type: 'error', text: 'Failed to delete plugin' });
      }
  };

  const fetchThemes = useCallback(async () => {
    try {
      const res = await fetch('/api/themes');
      const data = await res.json();
      setThemes(data);
    } catch (e) {
      console.error("Theme Fetch Error:", e);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchThemes();
    fetchCustomPlugins();
  }, [fetchSettings, fetchThemes, fetchCustomPlugins]);

  useEffect(() => {
    if (config.AI_PROVIDER === 'ollama') {
      fetchOllamaModels();
    }
  }, [config.AI_PROVIDER]);

  const fetchOllamaModels = async () => {
    setFetchingModels(true);
    try {
      const res = await fetch('/api/settings/ollama-models');
      const data = await res.json();
      if (data.models) {
        setOllamaModels(data.models);
      }
    } catch (e) {
      console.error('Failed to fetch Ollama models', e);
    } finally {
      setFetchingModels(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-(--theme-primary) animate-pulse">{getTranslation(config.APP_LANG).loading_settings}</div>;

  const activeTheme = themes.find(t => t.active);
  const t = getTranslation(config.APP_LANG);

  return (
    <div className={`min-h-screen font-sans bg-(--background) text-(--foreground) ${activeTheme ? 'theme-active' : ''}`} >
      <div className="max-w-4xl mx-auto py-6 px-4">
        <header className="flex items-center justify-between mb-4 pb-4 border-b border-(-border-color)">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-2 hover:bg-(-hover-bg) rounded-lg transition-all bg-(-card-bg) border border-(-border-color)">
              <ArrowLeft size={12} />
            </Link>
            <div>
              <h1 className="text-base font-semibold tracking-tight flex items-center gap-2">
                <Settings className="text-(--theme-primary) opacity-40" size={12} />
                {t.environment_settings}
              </h1>
              <p className="notion-text-subtle text-xs mt-0.5">{t.settings_desc}</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-(-theme-primary) text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all text-xs font-bold"
          >
            {saving ? <RotateCcw className="animate-spin" size={12} /> : <Save size={12} />}
            {saving ? t.saving : t.save_config}
          </button>
        </header>

        {message && (
          <div className={`mb-6 px-3 py-2 rounded-lg flex items-center gap-3 border text-xs animate-in slide-in-from-top-4 duration-500 ${
            message.type === 'success' 
              ? 'bg-(--theme-success-bg) border-(--theme-success)/10 text-(--theme-success)' 
              : 'bg-(--theme-error-bg) border-(--theme-error)/10 text-(--theme-error)'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${message.type === 'success' ? 'bg-(--theme-success) text-white' : 'bg-(--theme-error) text-white'}`}>
               {message.type === 'success' ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
            </div>
            <span className="font-bold uppercase tracking-wider">{message.text}</span>
          </div>
        )}

        <div className="space-y-4 pb-16">
          {/* Section: Storage Mode */}
          <section className="bg-(-card-bg) px-3 py-2 rounded-md border-(-border-color) shadow-sm">
            <h2 className="text-xs font-semibold mb-2 flex items-center gap-3">
              <Server size={12} className="text-(--theme-primary) opacity-40" />
              {t.storage_identity}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                onClick={() => setConfig({ ...config, STORAGE_MODE: 'local' })}
                className={`flex flex-col px-3 py-2 rounded-md border transition-all text-left group ${
                  config.STORAGE_MODE === 'local' 
                    ? 'border-(--theme-primary) bg-(--theme-primary-bg)' 
                    : 'border-(-border-color) hover:border-(-border-color) bg-(-card-bg)'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-4 transition-colors ${config.STORAGE_MODE === 'local' ? 'bg-(-theme-primary) text-white' : 'bg-(-card-bg) text-(-foreground) opacity-40'}`}>
                  <Database size={24} />
                </div>
                <span className="font-black text-xs uppercase tracking-widest">{t.local_vaults}</span>
                <span className="text-xs notion-text-subtle mt-2 leading-relaxed opacity-70">{t.local_vault_desc}</span>
              </button>
              <button
                onClick={() => setConfig({ ...config, STORAGE_MODE: 'server' })}
                className={`flex flex-col px-3 py-2 rounded-md border transition-all text-left group ${
                  config.STORAGE_MODE === 'server' 
                    ? 'border-(--theme-primary) bg-(--theme-primary-bg)' 
                    : 'border-(-border-color) hover:border-(-border-color) bg-(-card-bg)'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-4 transition-colors ${config.STORAGE_MODE === 'server' ? 'bg-(-theme-primary) text-white' : 'bg-(-card-bg) text-(-foreground) opacity-40'}`}>
                  <Cloud size={24} />
                </div>
                <span className="font-black text-xs uppercase tracking-widest">{t.remote_sync}</span>
                <span className="text-xs notion-text-subtle mt-2 leading-relaxed opacity-70">{t.remote_sync_desc}</span>
              </button>
            </div>
          </section>

          {/* Section: Vault Manager */}
          {config.STORAGE_MODE === 'local' && (
            <section className="bg-(-card-bg) px-3 py-2 rounded-md border-(-border-color) shadow-sm animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-(-theme-primary)"></div>
              <h2 className="text-xs font-semibold mb-2 flex items-center gap-3">
                <LayoutGrid size={12} className="text-(--theme-primary) opacity-40" />
                {t.vault_management}
              </h2>
              <VaultManager appLang={config.APP_LANG} onVaultSwitch={fetchSettings} />
            </section>
          )}

          {config.STORAGE_MODE === 'server' && (
            <section className="bg-(-card-bg) px-3 py-2 rounded-md border-(-border-color) shadow-sm animate-fade-in">
              <h2 className="text-xs font-semibold mb-2 flex items-center gap-3">
                <Database size={12} className="text-(--theme-primary) opacity-40" />
                {t.sql_connection}
              </h2>
              <div className="space-y-4">
                <p className="text-xs notion-text-subtle leading-relaxed">
                  {t.sql_connection}
                </p>
                <input
                  type="text"
                  value={config.DATABASE_URL}
                  onChange={(e) => setConfig({ ...config, DATABASE_URL: e.target.value })}
                  className="w-full p-3 bg-(-sidebar-bg) rounded-lg border border-(-border-color) font-mono text-xs focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/10 transition-all"
                  placeholder="postgresql://user:password@host:port/db"
                />
              </div>
            </section>
          )}

          {/* Section: Plugin Management */}
          <section className="bg-(-card-bg) px-3 py-2 rounded-md border-(-border-color) shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold flex items-center gap-3">
                <Package size={12} className="text-(--theme-primary) opacity-40" />
                Plugins & Extensions
              </h2>
              <button 
                onClick={handleImportPlugin}
                className="flex items-center gap-2 px-3 py-1.5 bg-(-card-bg) text-(-foreground) rounded-lg text-xs font-bold hover:bg-(-hover-bg) transition-all"
                title="Import JSON from Clipboard"
              >
                <Plus size={12} />
                Import
              </button>
            </div>
            
            <div className="space-y-4">
              {[...AVAILABLE_PLUGINS, ...customPlugins].map(plugin => {
                const isEnabled = config.ENABLED_PLUGINS ? config.ENABLED_PLUGINS.split(',').includes(plugin.id) : false;
                const isSystem = AVAILABLE_PLUGINS.some(p => p.id === plugin.id);

                return (
                  <div key={plugin.id} className="group relative flex items-center justify-between p-3 bg-(-sidebar-bg) rounded-lg border border-(-border-color) hover:border-(-border-color) transition-all">
                    <div className="flex items-start gap-2 flex-1">
                      <div className={`p-2 rounded-lg transition-colors ${isEnabled ? 'bg-(-theme-primary) text-white shadow-md shadow-(--theme-primary)/20' : 'bg-(-card-bg) text-(-foreground)'}`}>
                        <Blocks size={12} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs flex items-center gap-2">
                          {plugin.name}
                          <span className="text-[9px] bg-(-hover-bg) text-(-foreground) px-1.5 py-0.5 rounded font-mono">{plugin.version}</span>
                          {!isSystem && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase">Custom</span>}
                        </h3>
                        <p className="text-xs text-(-foreground) mt-1 max-w-sm leading-relaxed">{plugin.description}</p>
                        <p className="text-[10px] text-(-foreground) mt-1 font-mono opacity-60">ID: {plugin.id} • by {plugin.author}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleExportPlugin(plugin)}
                                className="p-2 text-(-foreground) hover:text-(--theme-primary) hover:bg-(-card-bg) rounded-lg transition-all"
                                title="Export JSON to Clipboard"
                            >
                                <Cloud size={12} />
                            </button>
                            {!isSystem && (
                                <button 
                                    onClick={() => handleDeletePlugin(plugin.id, plugin.name)}
                                    className="p-2 text-(-foreground) hover:text-red-500 hover:bg-(-card-bg) rounded-lg transition-all"
                                    title="Delete Plugin"
                                >
                                    <X size={12} />
                                </button>
                            )}
                         </div>

                        <button 
                          onClick={() => handlePluginToggle(plugin.id)}
                          className={`relative w-12 h-7 rounded-full transition-colors ${isEnabled ? 'bg-(-theme-primary)' : 'bg-(-hover-bg)'}`}
                        >
                          <div className={`absolute top-1 left-1 bg-(-card-bg) w-5 h-5 rounded-full shadow-sm transition-transform ${isEnabled ? 'translate-x-5' : ''}`}></div>
                        </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {(AVAILABLE_PLUGINS.length + customPlugins.length) === 0 && (
                <p className="text-center text-xs text-(-foreground) mt-6 italic">No plugins available.</p>
            )}
          </section>

          {/* Section: AI Configuration */}
          <section className="bg-(-card-bg) px-3 py-2 rounded-md border-(-border-color) shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold flex items-center gap-3">
                <ShieldCheck size={12} className="text-(--theme-primary) opacity-40" />
                {t.intelligence_layer}
              </h2>
              <div className="text-[9px] bg-(-card-bg) text-(-foreground) px-3 py-1 rounded-full font-black uppercase tracking-widest">
                {t.api_config}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex bg-(-card-bg) p-1.5 rounded-lg gap-1.5">
                <button
                  onClick={() => setConfig({ ...config, AI_PROVIDER: 'openai' })}
                  className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-xs font-black transition-all ${
                    config.AI_PROVIDER === 'openai' ? 'bg-(-card-bg) shadow-md text-(--theme-primary)' : 'text-(-foreground) hover:text-(-foreground)'
                  }`}
                >
                  <Cloud size={12} />
                  OPENAI (CLOUD)
                </button>
                <button
                  onClick={() => setConfig({ ...config, AI_PROVIDER: 'ollama' })}
                  className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-xs font-black transition-all ${
                    config.AI_PROVIDER === 'ollama' ? 'bg-(-card-bg) shadow-md text-(--theme-primary)' : 'text-(-foreground) hover:text-(-foreground)'
                  }`}
                >
                  <Server size={12} />
                  {t.ollama_local}
                </button>
              </div>

              <div className="space-y-4 animate-fade-in">
                 <div className="flex items-center gap-2 mb-2">
                    <label className="text-[10px] font-black text-(-foreground) uppercase tracking-widest px-1">{t.language}</label>
                 </div>
                 <div className="flex bg-(-card-bg) p-1.5 rounded-lg gap-1.5">
                    <button 
                      onClick={() => setConfig({ ...config, APP_LANG: 'en' })}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${
                        config.APP_LANG === 'en' ? 'bg-(-card-bg) shadow-md text-(--theme-primary)' : 'text-(-foreground) hover:text-(-foreground)'
                      }`}
                    >
                      <Languages size={12} />
                      {t.english}
                    </button>
                    {config.ENABLED_PLUGINS?.includes('plugin-jp') ? (
                      <button 
                        onClick={() => setConfig({ ...config, APP_LANG: 'ja' })}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${
                          config.APP_LANG === 'ja' ? 'bg-(-card-bg) shadow-md text-(--theme-primary)' : 'text-(-foreground) hover:text-(-foreground)'
                        }`}
                      >
                        <Languages size={12} />
                        {t.japanese}
                      </button>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold text-(-foreground) bg-(-sidebar-bg) border border-transparent cursor-not-allowed group relative" title="Enable 'Japanese Language Support' plugin to unlock">
                         <Languages size={12} />
                         {t.japanese}
                         <span className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">Plugin Required</span>
                      </div>
                    )}
                 </div>
              </div>

              {config.AI_PROVIDER === 'openai' ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-(-foreground) uppercase tracking-widest px-1">OpenAI API Key</label>
                    <div className="relative group">
                      <input
                        type="password"
                        value={config.OPENAI_API_KEY}
                        autoComplete="off"
                        onChange={(e) => setConfig({ ...config, OPENAI_API_KEY: e.target.value })}
                        className="w-full p-3 bg-(-sidebar-bg) rounded-lg border border-(-border-color) font-mono text-xs focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/10 transition-all pr-12"
                        placeholder="sk-proj-..."
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-(-foreground) group-focus-within:text-(--theme-primary) transition-colors">
                        <ShieldCheck size={12} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-(-foreground) uppercase tracking-widest px-1">{t.target_model}</label>
                    <div className="relative">
                      <select
                        value={config.AI_MODEL}
                        onChange={(e) => setConfig({ ...config, AI_MODEL: e.target.value })}
                        className="w-full p-3 bg-(-sidebar-bg) rounded-lg border border-(-border-color) text-xs focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/10 transition-all appearance-none cursor-pointer font-bold"
                      >
                        <option value="gpt-4o-mini">GPT-4o mini (Recommended)</option>
                        <option value="gpt-4o">GPT-4o (High Intelligence)</option>
                        <option value="o1-mini">o1-mini (Reasoning)</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-(-foreground)">
                        <Plus size={12} className="rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-(-foreground) uppercase tracking-widest px-1">Ollama Base URL</label>
                    <input
                      type="text"
                      value={config.OLLAMA_BASE_URL}
                      onChange={(e) => setConfig({ ...config, OLLAMA_BASE_URL: e.target.value })}
                      className="w-full p-3 bg-(-sidebar-bg) rounded-lg border border-(-border-color) font-mono text-xs focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/10 transition-all"
                      placeholder="http://localhost:11434"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-(-foreground) uppercase tracking-widest px-1 flex items-center justify-between">
                      {t.active_model}
                      <button 
                        onClick={fetchOllamaModels}
                        disabled={fetchingModels}
                        className="text-[9px] text-(--theme-primary) hover:underline flex items-center gap-1.5"
                      >
                        <RefreshCw size={10} className={fetchingModels ? 'animate-spin' : ''} />
                        {t.refresh_models}
                      </button>
                    </label>
                    <div className="relative">
                      {ollamaModels.length > 0 ? (
                        <select
                          value={config.AI_MODEL}
                          onChange={(e) => setConfig({ ...config, AI_MODEL: e.target.value })}
                          className="w-full p-3 bg-(-sidebar-bg) rounded-lg border border-(-border-color) text-xs focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/10 transition-all appearance-none cursor-pointer font-bold"
                        >
                          {!ollamaModels.includes(config.AI_MODEL) && (
                            <option value={config.AI_MODEL}>{config.AI_MODEL} (Custom)</option>
                          )}
                          {ollamaModels.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={config.AI_MODEL}
                            onChange={(e) => setConfig({ ...config, AI_MODEL: e.target.value })}
                            className="w-full p-3 bg-red-50/30 rounded-lg border border-red-100 text-(--theme-error) font-bold text-xs focus:outline-none"
                            placeholder="e.g. llama3"
                          />
                          <p className="text-[10px] text-(--theme-error) font-bold px-1">Could not detect any local Ollama models. Ensure Ollama is running.</p>
                        </div>
                      )}
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-(-foreground)">
                        <Plus size={12} className="rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-(--theme-warning-bg) border border-(--theme-warning)/10 rounded-lg text-(--theme-warning) text-xs">
                <AlertTriangle size={14} className="shrink-0" />
                <span className="font-bold leading-relaxed">
                   {t.restart_required}
                </span>
              </div>
            </div>
          </section>

          {/* AI Prompt Vault */}
          <section className="space-y-4 pb-8 border-b border-(-border-color)/30">
            <PromptVault language={config.APP_LANG || 'en'} />
          </section>

          <footer className="text-center notion-text-subtle text-[10px] font-black uppercase tracking-widest pt-12 opacity-30">
            <p>© 2026 KIRO • MODERN DEVELOPMENT FLOW</p>
          </footer>
        </div>
      </div>

      {activeTheme && (
        <style key={activeTheme.id} dangerouslySetInnerHTML={{ __html: activeTheme.css }} />
      )}
    </div>
  );
}
