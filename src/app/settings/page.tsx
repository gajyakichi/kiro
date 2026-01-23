"use client";

import { useEffect, useState, useCallback } from 'react';
import { Settings, Database, Server, Save, RotateCcw, ArrowLeft, Cloud, ShieldCheck, AlertTriangle, RefreshCw, Plus, X, Folder, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { Vault, Theme } from '@/lib/types';

const VaultManager = ({ onVaultSwitch }: { onVaultSwitch: () => void }) => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newVaultName, setNewVaultName] = useState("");
  const [newVaultPath, setNewVaultPath] = useState("");
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-xs text-neutral-400 animate-pulse">Loading vaults...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm notion-text-subtle max-w-md leading-relaxed">
          Manage multiple storage locations (Vaults). Switching vaults changes the active database and file storage.
        </p>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-(--theme-primary) text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-sm"
        >
          {isAdding ? <X size={14} /> : <Plus size={14} />}
          {isAdding ? "Cancel" : "Add New Vault"}
        </button>
      </div>

      {isAdding && (
        <div className="bg-(--theme-primary-bg) p-6 rounded-2xl border border-(--border-color) animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-(--theme-primary) uppercase tracking-widest opacity-60">Vault Name</label>
              <input 
                type="text" 
                value={newVaultName}
                onChange={(e) => setNewVaultName(e.target.value)}
                placeholder="e.g. Personal Projects"
                className="w-full p-4 bg-white border border-(--border-color) rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/20 transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-(--theme-primary) uppercase tracking-widest opacity-60">Directory Path</label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={newVaultPath}
                  onChange={(e) => setNewVaultPath(e.target.value)}
                  placeholder="~/Documents/KiroVault"
                  className="w-full p-4 bg-white border border-(--border-color) rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/20 pr-12 transition-all font-mono"
                />
                <button 
                  onClick={handleSelectDirectory}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                    window.electron 
                    ? 'text-(--theme-primary) hover:bg-(--theme-primary-bg)' 
                    : 'text-neutral-300 opacity-20 cursor-not-allowed'
                  }`}
                  disabled={!window.electron}
                  title={window.electron ? "Select folder via native dialog" : "Native dialog not available"}
                >
                  <Folder size={18} />
                </button>
              </div>
              {!window.electron && <p className="text-[9px] text-orange-500 font-medium">Native directory dialog is only available in the desktop app.</p>}
            </div>
          </div>
          <button 
            onClick={handleAdd}
            className="w-full py-3 bg-(--theme-primary) text-white rounded-xl text-xs font-black shadow-lg shadow-(--theme-primary)/10 hover:opacity-90 transition-all"
          >
            CONFIRM AND ADD VAULT
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {vaults.map((vault) => (
          <div 
            key={vault.id} 
            className={`group flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
              vault.active 
                ? 'border-(--theme-primary) bg-white shadow-md' 
                : 'border-(--border-color) hover:border-neutral-300 bg-white/50'
            }`}
          >
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${vault.active ? 'bg-(--theme-primary) text-white' : 'bg-neutral-100 text-neutral-400 group-hover:bg-neutral-200'}`}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="font-bold text-[15px] flex items-center gap-3">
                  {vault.name}
                  {vault.active && <span className="text-[9px] bg-(--theme-success-bg) text-(--theme-success) px-2 py-0.5 rounded-full uppercase font-black tracking-tighter">Current Active</span>}
                </div>
                <div className="text-[11px] notion-text-subtle font-mono mt-1 opacity-60">{vault.path || "Internal/Default Storage"}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {!vault.active ? (
                <>
                  <button 
                    onClick={() => handleSwitch(vault.id)}
                    className="px-4 py-2 bg-neutral-100 text-(--theme-primary) hover:bg-(--theme-primary) hover:text-white rounded-xl text-[11px] font-black transition-all"
                  >
                    SELECT
                  </button>
                  {vault.id !== 'default' && (
                    <button 
                      onClick={() => handleDelete(vault.id)}
                      className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X size={18} />
                    </button>
                  )}
                </>
              ) : (
                <div className="p-2 text-(--theme-success)">
                   <ShieldCheck size={20} />
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
    VAULT_PATH: ''
  });
  const [themes, setThemes] = useState<Theme[]>([]);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
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
  }, [fetchSettings, fetchThemes]);

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

  if (loading) return <div className="p-8 text-(--theme-primary) animate-pulse">Loading settings...</div>;

  const activeTheme = themes.find(t => t.active);

  return (
    <div className={`min-h-screen bg-(--background) text-(--foreground) font-sans ${activeTheme ? 'theme-active' : ''}`}>
      <div className="max-w-3xl mx-auto py-16 px-6">
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="p-3 hover:bg-(--hover-bg) rounded-2xl transition-all shadow-sm bg-white border border-(--border-color)">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Settings className="text-(--theme-primary) opacity-40" size={28} />
                Environment Settings
              </h1>
              <p className="notion-text-subtle text-sm mt-1">Manage storage vaults, AI models, and account configuration.</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-(--theme-primary) text-white rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-(--theme-primary)/10 text-sm font-bold"
          >
            {saving ? <RotateCcw className="animate-spin" size={18} /> : <Save size={18} />}
            SAVE CONFIGURATION
          </button>
        </header>

        {message && (
          <div className={`mb-10 p-5 rounded-2xl flex items-center gap-4 border shadow-md animate-in slide-in-from-top-4 duration-500 ${
            message.type === 'success' 
              ? 'bg-(--theme-success-bg) border-(--theme-success)/10 text-(--theme-success)' 
              : 'bg-(--theme-error-bg) border-(--theme-error)/10 text-(--theme-error)'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${message.type === 'success' ? 'bg-(--theme-success) text-white' : 'bg-(--theme-error) text-white'}`}>
               {message.type === 'success' ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
            </div>
            <span className="text-sm font-black uppercase tracking-wider">{message.text}</span>
          </div>
        )}

        <div className="space-y-12 pb-32">
          {/* Section: Storage Mode */}
          <section className="bg-white p-8 rounded-3xl border border-(--border-color) shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Server size={22} className="text-(--theme-primary) opacity-40" />
              Storage Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <button
                onClick={() => setConfig({ ...config, STORAGE_MODE: 'local' })}
                className={`flex flex-col p-6 rounded-2xl border-2 transition-all text-left group ${
                  config.STORAGE_MODE === 'local' 
                    ? 'border-(--theme-primary) bg-(--theme-primary-bg)' 
                    : 'border-(--border-color) hover:border-neutral-300 bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${config.STORAGE_MODE === 'local' ? 'bg-(--theme-primary) text-white' : 'bg-neutral-100 text-neutral-400 opacity-40'}`}>
                  <Database size={24} />
                </div>
                <span className="font-black text-sm uppercase tracking-widest">Local Vaults</span>
                <span className="text-xs notion-text-subtle mt-2 leading-relaxed opacity-70">Highly private, file-based storage. Perfect for offline work and independent projects.</span>
              </button>
              <button
                onClick={() => setConfig({ ...config, STORAGE_MODE: 'server' })}
                className={`flex flex-col p-6 rounded-2xl border-2 transition-all text-left group ${
                  config.STORAGE_MODE === 'server' 
                    ? 'border-(--theme-primary) bg-(--theme-primary-bg)' 
                    : 'border-(--border-color) hover:border-neutral-300 bg-white'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${config.STORAGE_MODE === 'server' ? 'bg-(--theme-primary) text-white' : 'bg-neutral-100 text-neutral-400 opacity-40'}`}>
                  <Cloud size={24} />
                </div>
                <span className="font-black text-sm uppercase tracking-widest">Remote Sync</span>
                <span className="text-xs notion-text-subtle mt-2 leading-relaxed opacity-70">Cloud-based SQL connection. Access your development logs across all devices instantly.</span>
              </button>
            </div>
          </section>

          {/* Section: Vault Manager */}
          {config.STORAGE_MODE === 'local' && (
            <section className="bg-white p-8 rounded-3xl border border-(--border-color) shadow-sm animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-(--theme-primary)"></div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <LayoutGrid size={22} className="text-(--theme-primary) opacity-40" />
                Vault Management
              </h2>
              <VaultManager onVaultSwitch={fetchSettings} />
            </section>
          )}

          {config.STORAGE_MODE === 'server' && (
            <section className="bg-white p-8 rounded-3xl border border-(--border-color) shadow-sm animate-fade-in">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Database size={22} className="text-(--theme-primary) opacity-40" />
                SQL Connection URL
              </h2>
              <div className="space-y-5">
                <p className="text-sm notion-text-subtle leading-relaxed">
                  Provide your PostgreSQL, MySQL or SQLite connection string.
                </p>
                <input
                  type="text"
                  value={config.DATABASE_URL}
                  onChange={(e) => setConfig({ ...config, DATABASE_URL: e.target.value })}
                  className="w-full p-5 bg-neutral-50 rounded-2xl border border-(--border-color) font-mono text-xs focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/10 transition-all"
                  placeholder="postgresql://user:password@host:port/db"
                />
              </div>
            </section>
          )}

          {/* Section: AI Configuration */}
          <section className="bg-white p-8 rounded-3xl border border-(--border-color) shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <ShieldCheck size={22} className="text-(--theme-primary) opacity-40" />
                Intelligence Layer
              </h2>
              <div className="text-[9px] bg-neutral-100 text-neutral-400 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                API Configuration
              </div>
            </div>
            <div className="space-y-10">
              <div className="flex bg-neutral-100 p-1.5 rounded-2xl gap-1.5">
                <button
                  onClick={() => setConfig({ ...config, AI_PROVIDER: 'openai' })}
                  className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-xs font-black transition-all ${
                    config.AI_PROVIDER === 'openai' ? 'bg-white shadow-md text-(--theme-primary)' : 'text-neutral-400 hover:text-neutral-500'
                  }`}
                >
                  <Cloud size={16} />
                  OPENAI (CLOUD)
                </button>
                <button
                  onClick={() => setConfig({ ...config, AI_PROVIDER: 'ollama' })}
                  className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-xs font-black transition-all ${
                    config.AI_PROVIDER === 'ollama' ? 'bg-white shadow-md text-(--theme-primary)' : 'text-neutral-400 hover:text-neutral-500'
                  }`}
                >
                  <Server size={16} />
                  OLLAMA (LOCAL)
                </button>
              </div>

              {config.AI_PROVIDER === 'openai' ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">OpenAI API Key</label>
                    <div className="relative group">
                      <input
                        type="password"
                        value={config.OPENAI_API_KEY}
                        autoComplete="off"
                        onChange={(e) => setConfig({ ...config, OPENAI_API_KEY: e.target.value })}
                        className="w-full p-5 bg-neutral-50 rounded-2xl border border-(--border-color) font-mono text-xs focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/10 transition-all pr-12"
                        placeholder="sk-proj-..."
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-(--theme-primary) transition-colors">
                        <ShieldCheck size={20} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Target Model</label>
                    <div className="relative">
                      <select
                        value={config.AI_MODEL}
                        onChange={(e) => setConfig({ ...config, AI_MODEL: e.target.value })}
                        className="w-full p-5 bg-neutral-50 rounded-2xl border border-(--border-color) text-sm focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/10 transition-all appearance-none cursor-pointer font-bold"
                      >
                        <option value="gpt-4o-mini">GPT-4o mini (Recommended)</option>
                        <option value="gpt-4o">GPT-4o (High Intelligence)</option>
                        <option value="o1-mini">o1-mini (Reasoning)</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                        <Plus size={16} className="rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Ollama Base URL</label>
                    <input
                      type="text"
                      value={config.OLLAMA_BASE_URL}
                      onChange={(e) => setConfig({ ...config, OLLAMA_BASE_URL: e.target.value })}
                      className="w-full p-5 bg-neutral-50 rounded-2xl border border-(--border-color) font-mono text-xs focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/10 transition-all"
                      placeholder="http://localhost:11434"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1 flex items-center justify-between">
                      Active Model
                      <button 
                        onClick={fetchOllamaModels}
                        disabled={fetchingModels}
                        className="text-[9px] text-(--theme-primary) hover:underline flex items-center gap-1.5"
                      >
                        <RefreshCw size={10} className={fetchingModels ? 'animate-spin' : ''} />
                        REFRESH MODELS
                      </button>
                    </label>
                    <div className="relative">
                      {ollamaModels.length > 0 ? (
                        <select
                          value={config.AI_MODEL}
                          onChange={(e) => setConfig({ ...config, AI_MODEL: e.target.value })}
                          className="w-full p-5 bg-neutral-50 rounded-2xl border border-(--border-color) text-sm focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/10 transition-all appearance-none cursor-pointer font-bold"
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
                            className="w-full p-5 bg-red-50/30 rounded-2xl border border-red-100 text-(--theme-error) font-bold text-sm focus:outline-none"
                            placeholder="e.g. llama3"
                          />
                          <p className="text-[10px] text-(--theme-error) font-bold px-1">Could not detect any local Ollama models. Ensure Ollama is running.</p>
                        </div>
                      )}
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                        <Plus size={16} className="rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 bg-(--theme-warning-bg) border border-(--theme-warning)/10 rounded-2xl text-(--theme-warning) text-xs">
                <AlertTriangle size={18} className="shrink-0" />
                <span className="font-bold leading-relaxed">
                   CRITICAL: Server restart required after key changes. Never share API keys in screenshots or logs.
                </span>
              </div>
            </div>
          </section>

          <footer className="text-center notion-text-subtle text-[10px] font-black uppercase tracking-widest pt-12 opacity-30">
            <p>© 2026 KIRO • MODERN DEVELOPMENT FLOW</p>
          </footer>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        ${activeTheme?.css || ''}
        .theme-active body { background-color: var(--background) !important; color: var(--foreground) !important; }
        .theme-active .notion-card { border-color: var(--border-color); }
      `}} />
    </div>
  );
}
