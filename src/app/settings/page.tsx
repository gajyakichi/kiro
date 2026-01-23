"use client";

import { useEffect, useState } from 'react';
import { Settings, Database, Server, Save, RotateCcw, ArrowLeft, Cloud, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

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
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

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

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setConfig(data);
    } catch (e) {
      console.error('Failed to fetch settings', e);
    } finally {
      setLoading(false);
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

  if (loading) return <div className="p-8 text-neutral-500">Loading settings...</div>;

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 font-sans">
      <div className="max-w-3xl mx-auto py-12 px-6">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-neutral-200 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <Settings className="text-neutral-400" size={24} />
                Environment Settings
              </h1>
              <p className="text-neutral-500 text-sm">Configure your storage and connection preferences</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-sm"
          >
            {saving ? <RotateCcw className="animate-spin" size={18} /> : <Save size={18} />}
            Save Changes
          </button>
        </header>

        {message && (
          <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border shadow-sm ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
              : 'bg-red-50 border-red-100 text-red-700'
          }`}>
            {message.type === 'success' ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="space-y-8">
          {/* Section: Storage Mode */}
          <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Server size={18} className="text-neutral-400" />
              Storage Mode
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setConfig({ ...config, STORAGE_MODE: 'local' })}
                className={`flex flex-col p-4 rounded-xl border transition-all text-left ${
                  config.STORAGE_MODE === 'local' 
                    ? 'border-neutral-900 bg-neutral-50 shadow-inner' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <Database size={24} className={config.STORAGE_MODE === 'local' ? 'text-neutral-900' : 'text-neutral-400'} />
                <span className="font-semibold mt-2">Local (SQLite)</span>
                <span className="text-xs text-neutral-500 mt-1">Zero-config, saves data to a local file. Ideal for solo dev.</span>
              </button>
              <button
                onClick={() => setConfig({ ...config, STORAGE_MODE: 'server' })}
                className={`flex flex-col p-4 rounded-xl border transition-all text-left ${
                  config.STORAGE_MODE === 'server' 
                    ? 'border-neutral-900 bg-neutral-50 shadow-inner' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <Cloud size={24} className={config.STORAGE_MODE === 'server' ? 'text-neutral-900' : 'text-neutral-400'} />
                <span className="font-semibold mt-2">Remote (SQL)</span>
                <span className="text-xs text-neutral-500 mt-1">Connect to PostgreSQL/MySQL for cross-device sync and teams.</span>
              </button>
            </div>
          </section>

          {/* Section: AI Configuration */}
          <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <ShieldCheck size={18} className="text-neutral-400" />
                AI Configuration
              </h2>
              <div className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                External API
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-sm text-neutral-500">
                Choose between OpenAI (Cloud) or Ollama (Local/Private).
                The server requires a restart to reload settings from the environment.
              </p>

              <div className="flex bg-neutral-100 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setConfig({ ...config, AI_PROVIDER: 'openai' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                    config.AI_PROVIDER === 'openai' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-400 hover:text-neutral-500'
                  }`}
                >
                  <Cloud size={16} />
                  OpenAI
                </button>
                <button
                  onClick={() => setConfig({ ...config, AI_PROVIDER: 'ollama' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                    config.AI_PROVIDER === 'ollama' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-400 hover:text-neutral-500'
                  }`}
                >
                  <Server size={16} />
                  Ollama (Local)
                </button>
              </div>

              {config.AI_PROVIDER === 'openai' ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="relative group">
                    <input
                      type="password"
                      value={config.OPENAI_API_KEY}
                      autoComplete="off"
                      onChange={(e) => setConfig({ ...config, OPENAI_API_KEY: e.target.value })}
                      className="w-full p-4 bg-neutral-100 rounded-xl border border-neutral-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all pr-12"
                      placeholder="sk-proj-..."
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-neutral-500 transition-colors">
                      <ShieldCheck size={20} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">OpenAI Model</label>
                    <select
                      value={config.AI_MODEL}
                      onChange={(e) => setConfig({ ...config, AI_MODEL: e.target.value })}
                      className="w-full p-4 bg-neutral-100 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all appearance-none cursor-pointer"
                    >
                      <option value="gpt-4o-mini">GPT-4o mini (Fast & Cost-efficient)</option>
                      <option value="gpt-4o">GPT-4o (Most Capable)</option>
                      <option value="o1-mini">o1-mini (Reasoning focus)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Ollama Base URL</label>
                    <input
                      type="text"
                      value={config.OLLAMA_BASE_URL}
                      onChange={(e) => setConfig({ ...config, OLLAMA_BASE_URL: e.target.value })}
                      className="w-full p-4 bg-neutral-100 rounded-xl border border-neutral-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
                      placeholder="http://localhost:11434"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                      Ollama Model
                      <button 
                        onClick={fetchOllamaModels}
                        disabled={fetchingModels}
                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 bg-none border-none p-0"
                      >
                        <RefreshCw size={10} className={fetchingModels ? 'animate-spin' : ''} />
                        Refresh
                      </button>
                    </label>
                    <div className="relative">
                      {ollamaModels.length > 0 ? (
                        <select
                          value={config.AI_MODEL}
                          onChange={(e) => setConfig({ ...config, AI_MODEL: e.target.value })}
                          className="w-full p-4 bg-neutral-100 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all appearance-none cursor-pointer"
                        >
                          {!ollamaModels.includes(config.AI_MODEL) && (
                            <option value={config.AI_MODEL}>{config.AI_MODEL} (Current)</option>
                          )}
                          {ollamaModels.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={config.AI_MODEL}
                            onChange={(e) => setConfig({ ...config, AI_MODEL: e.target.value })}
                            className="w-full p-4 bg-neutral-100 rounded-xl border border-neutral-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all text-red-500"
                            placeholder="e.g. llama3"
                          />
                          <p className="text-[10px] text-red-400">Could not find any Ollama models. Is it running?</p>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400">Ensure the model is already pulled via <code>ollama run [model]</code>.</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 text-xs">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>Never share your API key with others. The server requires a restart to reload settings from the environment.</span>
              </div>
            </div>
          </section>

          {/* Section: Storage Configuration (Dynamic) */}
          <section className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm animate-fade-in">
            {config.STORAGE_MODE === 'local' ? (
              <>
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-500" />
                  Vault Configuration
                </h2>
                <div className="space-y-4">
                  <p className="text-sm text-neutral-500">
                    Your data is stored locally. Specify a **Vault directory** (e.g., in Dropbox or iCloud) to keep your notes portable and backed up.
                  </p>
                  <div className="relative group">
                    <input
                      type="text"
                      value={config.VAULT_PATH}
                      onChange={(e) => setConfig({ ...config, VAULT_PATH: e.target.value })}
                      className="w-full p-4 bg-neutral-100 rounded-xl border border-neutral-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="~/KiroVault"
                    />
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-xs">
                    <Cloud size={14} className="shrink-0" />
                    <span>{config.VAULT_PATH 
                      ? `Active Vault: ${config.VAULT_PATH}/kiro.db` 
                      : 'Using default internal storage. Set a path to externalize your data.'}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Database size={18} className="text-purple-500" />
                  Remote Database Connection
                </h2>
                <div className="space-y-4">
                  <p className="text-sm text-neutral-500">
                    Enter your database connection string to sync data across multiple devices.
                  </p>
                  <input
                    type="text"
                    value={config.DATABASE_URL}
                    onChange={(e) => setConfig({ ...config, DATABASE_URL: e.target.value })}
                    className="w-full p-4 bg-neutral-100 rounded-xl border border-neutral-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
                    placeholder="postgresql://user:password@host:port/db"
                  />
                  <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-100 rounded-xl text-purple-700 text-xs">
                    <Server size={14} className="mt-0.5 shrink-0" />
                    <span>Supports PostgreSQL, MySQL, and other SQL providers via Prisma.</span>
                  </div>
                </div>
              </>
            )}
          </section>

          <footer className="text-center text-neutral-400 text-xs pt-8">
            <p>© 2026 Kaihatsunote • Modern Development Workflow</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
