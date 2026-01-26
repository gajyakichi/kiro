"use client";

import { useEffect, useState } from 'react';
import { Database, ShieldCheck, ChevronRight, Check } from 'lucide-react';
import { Vault } from '@/lib/types';

import { getTranslation } from '@/lib/i18n';

interface VaultSwitcherProps {
  appLang?: string;
  onSwitch?: () => void;
  className?: string;
}

export const VaultSwitcher = ({ appLang = 'en', onSwitch, className = "" }: VaultSwitcherProps) => {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const t = getTranslation(appLang);

  useEffect(() => {
    fetchVaults();
  }, []);

  const fetchVaults = async () => {
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

  const handleSwitch = async (id: string) => {
    try {
      await fetch('/api/vaults', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchVaults();
      setIsOpen(false);
      if (onSwitch) onSwitch();
      // Reload page to refresh all data from new DB
      window.location.reload();
    } catch (e) {
      console.error("Failed to switch vault", e);
    }
  };

  const activeVault = vaults.find(v => v.active);

  if (loading) return <div className="text-[10px] notion-text-subtle animate-pulse">{t.loading_vault}</div>;

  return (
    <div className={`relative ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 notion-item group border border-(--border-color) bg-white/50 backdrop-blur-sm"
      >
        <div className="w-5 h-5 rounded-md bg-(--theme-primary-bg) flex items-center justify-center text-(--theme-primary)">
          <Database size={12} />
        </div>
        <div className="flex-1 text-left">
          <div className="text-[11px] font-bold truncate leading-tight">
            {activeVault?.name || t.select_vault}
          </div>
          <div className="text-[9px] notion-text-subtle truncate">
            {activeVault?.path ? t.external : t.internal}
          </div>
        </div>
        <ChevronRight size={14} className={`notion-text-subtle transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-64 bg-white border border-(--border-color) rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="p-2 border-b border-(--border-color) bg-neutral-50/50">
            <span className="text-[10px] font-bold notion-text-subtle uppercase tracking-widest px-2">{t.storage_vaults}</span>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {vaults.map((vault) => (
              <button
                key={vault.id}
                onClick={() => {
                   if (confirm(t.confirm_vault_switch || "Switching vaults will reload the application. Continue?")) {
                       handleSwitch(vault.id);
                   }
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                  vault.active ? 'bg-(--theme-primary-bg) cursor-default' : 'hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${vault.active ? 'bg-(--theme-primary) text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${vault.active ? 'text-(--theme-primary)' : 'text-neutral-700'}`}>
                      {vault.name}
                    </div>
                    <div className="text-[10px] notion-text-subtle truncate max-w-[120px]">
                      {vault.path || t.internal}
                    </div>
                  </div>
                </div>
                {vault.active && <Check size={16} className="text-(--theme-primary)" />}
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-(--border-color) bg-neutral-50/20">
            <a 
              href="/settings" 
              className="block w-full text-center py-2 text-[10px] font-bold notion-text-subtle hover:text-(--theme-primary) transition-colors"
            >
              {t.manage_vaults}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
