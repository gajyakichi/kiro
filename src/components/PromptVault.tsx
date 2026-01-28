'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Plus, Trash2, Edit2, Check, X, Download, Upload, Sparkles } from 'lucide-react';

type Prompt = {
  id: number;
  name: string;
  description: string | null;
  system_prompt: string;
  is_active: number;
  is_default: number;
  created_at: string;
  updated_at: string;
};

type PromptVaultProps = {
  language: string;
};

export const PromptVault: React.FC<PromptVaultProps> = ({ language }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', system_prompt: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (key: string) => {
    const translations: Record<string, { en: string; ja: string }> = {
      prompt_vault: { en: 'AI Prompt Vault', ja: 'AIプロンプト保管庫' },
      add_prompt: { en: 'Add Prompt', ja: 'プロンプトを追加' },
      export_all: { en: 'Export All', ja: '全てエクスポート' },
      import: { en: 'Import', ja: 'インポート' },
      name: { en: 'Name', ja: '名前' },
      description: { en: 'Description', ja: '説明' },
      system_prompt: { en: 'System Prompt', ja: 'システムプロンプト' },
      save: { en: 'Save', ja: '保存' },
      cancel: { en: 'Cancel', ja: 'キャンセル' },
      edit: { en: 'Edit', ja: '編集' },
      delete: { en: 'Delete', ja: '削除' },
      activate: { en: 'Activate', ja: 'アクティブ化' },
      active: { en: 'Active', ja: 'アクティブ' },
      default: { en: 'Default', ja: 'デフォルト' },
    };
    return translations[key]?.[language as 'en' | 'ja'] || key;
  };

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch('/api/prompts');
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPrompts]);


  const handleSave = async () => {
    if (!formData.name || !formData.system_prompt) return;

    try {
      const url = editingId ? '/api/prompts' : '/api/prompts';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchPrompts();
        setEditingId(null);
        setIsAdding(false);
        setFormData({ name: '', description: '', system_prompt: '' });
      }
    } catch (error) {
      console.error('Failed to save prompt:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const res = await fetch(`/api/prompts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPrompts();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete prompt');
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      const res = await fetch('/api/prompts/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        await fetchPrompts();
      }
    } catch (error) {
      console.error('Failed to activate prompt:', error);
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingId(prompt.id);
    setFormData({
      name: prompt.name,
      description: prompt.description || '',
      system_prompt: prompt.system_prompt,
    });
    setIsAdding(false);
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/prompts/import-export');
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prompts-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export prompts:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch('/api/prompts/import-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts: data.prompts || [] }),
      });

      if (res.ok) {
        const result = await res.json();
        alert(result.message);
        await fetchPrompts();
      }
    } catch (error) {
      console.error('Failed to import prompts:', error);
      alert('Failed to import prompts. Please check the file format.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot size={18} className="text-(-theme-primary)" />
          <div>
            <p className="text-sm font-bold text-(-foreground) tracking-tight">{t('prompt_vault')}</p>
            <p className="text-[9px] text-(-foreground) font-semibold uppercase tracking-widest opacity-60">
              {language === 'ja' ? 'プロンプトを管理・保存' : 'Manage & Store Prompts'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-wider transition-all bg-(-card-bg) hover:bg-(-hover-bg) border border-(-border-color) flex items-center gap-1.5"
          >
            <Download size={12} />
            {t('export_all')}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-wider transition-all bg-(-card-bg) hover:bg-(-hover-bg) border border-(-border-color) flex items-center gap-1.5"
          >
            <Upload size={12} />
            {t('import')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setFormData({ name: '', description: '', system_prompt: '' });
            }}
            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-wider transition-all bg-(-theme-primary) text-(-foreground) hover:opacity-90 flex items-center gap-1.5"
          >
            <Plus size={12} />
            {t('add_prompt')}
          </button>
        </div>
      </div>

      {/* Instruction */}
      <div className="flex items-start gap-2 p-3 bg-(-theme-primary-bg) border border-(-theme-primary)/20 rounded-lg">
        <Sparkles size={14} className="text-(-theme-primary) shrink-0 mt-0.5" />
        <div className="text-[11px] text-(-foreground) leading-relaxed">
          <p className="font-bold mb-1">
            {language === 'ja' ? '✓ 1つだけ選択できます' : '✓ Select one prompt at a time'}
          </p>
          <p className="opacity-70">
            {language === 'ja' 
              ? 'ボタンをクリックして使用するプロンプトを切り替えます。アクティブなプロンプトがAIチャットで使用されます。' 
              : 'Click the button to switch the active prompt. Only the active prompt will be used in AI chats.'}
          </p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId !== null) && (
        <div className="p-4 bg-(-card-bg) rounded-xl border border-(-border-color) space-y-3">
          <input
            type="text"
            placeholder={t('name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-(-sidebar-bg) border border-(-border-color) text-sm focus:outline-none focus:ring-2 focus:ring-(-theme-primary)/20"
          />
          <input
            type="text"
            placeholder={t('description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-(-sidebar-bg) border border-(-border-color) text-sm focus:outline-none focus:ring-2 focus:ring-(-theme-primary)/20"
          />
          <textarea
            placeholder={t('system_prompt')}
            value={formData.system_prompt}
            onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 rounded-lg bg-(-sidebar-bg) border border-(-border-color) text-sm focus:outline-none focus:ring-2 focus:ring-(-theme-primary)/20 font-mono"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setFormData({ name: '', description: '', system_prompt: '' });
              }}
              className="px-4 py-2 rounded-lg text-[10px] font-semibold tracking-wider transition-all bg-(-sidebar-bg) hover:bg-(-hover-bg) border border-(-border-color) flex items-center gap-1.5"
            >
              <X size={12} />
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-[10px] font-semibold tracking-wider transition-all bg-(-theme-primary) text-(-foreground) hover:opacity-90 flex items-center gap-1.5"
            >
              <Check size={12} />
              {t('save')}
            </button>
          </div>
        </div>
      )}

      {/* Prompt List */}
      <div className="space-y-2">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className={`p-4 rounded-xl border transition-all ${
              prompt.is_active
                ? 'bg-(-theme-primary-bg) border-(-theme-primary)/30'
                : 'bg-(-card-bg) border-(-border-color) hover:border-(-theme-primary)/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold">{prompt.name}</h3>
                  {prompt.is_active === 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-(-theme-primary) text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={10} />
                      {t('active')}
                    </span>
                  )}
                  {prompt.is_default === 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-(-sidebar-bg) text-(-foreground) text-[9px] font-bold uppercase tracking-wider">
                      {t('default')}
                    </span>
                  )}
                </div>
                {prompt.description && (
                  <p className="text-xs text-(-foreground) opacity-70 mb-2">{prompt.description}</p>
                )}
                <p className="text-xs text-(-foreground) opacity-60 font-mono line-clamp-2">
                  {prompt.system_prompt}
                </p>
              </div>
              <div className="flex gap-1 ml-4 shrink-0">
                {prompt.is_active === 0 && (
                  <button
                    onClick={() => handleActivate(prompt.id)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all bg-(-theme-primary) text-white hover:opacity-90 flex items-center gap-1"
                    title={t('activate')}
                  >
                    <Check size={12} />
                    {language === 'ja' ? 'これを使用' : 'Use This'}
                  </button>
                )}
                {prompt.is_default === 0 && (
                  <>
                    <button
                      onClick={() => handleEdit(prompt)}
                      className="p-2 rounded-lg hover:bg-(-hover-bg) transition-all"
                      title={t('edit')}
                    >
                      <Edit2 size={14} className="text-(-foreground) opacity-60" />
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.id)}
                      className="p-2 rounded-lg hover:bg-(-hover-bg) transition-all"
                      title={t('delete')}
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
