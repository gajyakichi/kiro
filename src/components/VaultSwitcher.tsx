import { useEffect, useState } from 'react';
import { Database, ShieldCheck, ChevronRight, Check, AlertTriangle, Plus, Settings, Edit2, X } from 'lucide-react';
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
  const [targetVault, setTargetVault] = useState<Vault | null>(null);

  // New States for Custom Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'internal' | 'external'>('internal');
  const [newName, setNewName] = useState('');
  const [newPath, setNewPath] = useState('');

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
      window.location.reload();
    } catch (e) {
      console.error("Failed to switch vault", e);
    }
  };

  const handleCreateSubmit = async () => {
    if (!newName.trim()) {
        alert(t.vault_name_placeholder || "Please enter a vault name");
        return;
    }
    
    if (createType === 'external' && !newPath) {
        alert(t.dir_path_placeholder || "Please select a folder path");
        return;
    }

    try {
        const res = await fetch('/api/vaults', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newName,
                type: createType,
                path: createType === 'external' ? newPath : undefined
            })
        });

        if (res.ok) {
            const newVault = await res.json();
            setVaults(prev => [...prev, newVault]);
            fetchVaults();
            
            setShowCreateModal(false);
            setNewName('');
            setNewPath('');
            setIsOpen(false);
            
            alert(`Vault "${newVault.name}" created!`);
        } else {
            throw new Error("Failed to create vault");
        }
    } catch (e) {
        console.error(e);
        alert("Failed to create vault.");
    }
  };

  const handleSelectFolder = async () => {
    if (typeof window !== 'undefined' && window.electron?.selectDirectory) {
        const selected = await window.electron.selectDirectory();
        if (selected) {
            setNewPath(selected);
            if (!newName) {
                setNewName(selected.split(/[/\\]/).pop() || "New Vault");
            }
        }
    } else {
        const input = prompt("Enter absolute path for vault:", "/Users/satoshiyamaguchi/Developer/kaihatsunote/vault");
        if (input) setNewPath(input);
    }
  };

  const handleAddVault = () => {
      setShowCreateModal(true);
  };

  const handleUpdateVaultPath = async (vault: Vault) => {
    let newPath = "";
    
    if (typeof window !== 'undefined' && window.electron?.selectDirectory) {
       const selected = await window.electron.selectDirectory();
       if (selected) newPath = selected;
    } else {
       const input = prompt("Update vault path:", vault.path);
       if (input) newPath = input;
    }

    if (newPath && newPath !== vault.path) {
        try {
            const res = await fetch('/api/vaults', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: vault.id, path: newPath })
            });
            if (res.ok) {
                fetchVaults();
                // If the updated vault was active, reload to apply changes
                if (vault.active) window.location.reload();
            }
        } catch (e) {
            console.error("Failed to update vault path", e);
        }
    }
  };

  const activeVault = vaults.find(v => v.active);

  if (loading) return <div className="text-[10px] notion-text-subtle animate-pulse">{t.loading_vault}</div>;

  return (
    <div className={`relative ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 notion-item group border border-(--border-color) bg-(--card-bg)/50 backdrop-blur-sm"
      >
        <div className="w-5 h-5 rounded-md bg-(--theme-primary-bg) flex items-center justify-center text-(--theme-primary)">
          <Database size={12} />
        </div>
        <div className="flex-1 text-left">
          <div className="text-[11px] font-bold truncate leading-tight text-(--foreground)">
            {activeVault?.name || t.select_vault}
          </div>
          <div className="text-[9px] notion-text-subtle truncate">
            {activeVault?.path ? t.external : t.internal}
          </div>
        </div>
        <ChevronRight size={14} className={`notion-text-subtle transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-(--background) border border-(--border-color) rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-(--border-color) bg-(--hover-bg)">
            <span className="text-[10px] font-bold notion-text-subtle uppercase tracking-widest px-2">{t.storage_vaults}</span>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {vaults.map((vault) => (
              <div
                key={vault.id}
                onClick={() => {
                   if (vault.id === activeVault?.id) return;
                   setTargetVault(vault);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors cursor-pointer ${
                  vault.active ? 'bg-(--hover-bg)' : 'hover:bg-(--hover-bg)'
                }`}
                role="button"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${vault.active ? 'bg-(--theme-primary) text-(--background)' : 'bg-(--hover-bg) text-(--foreground) opacity-50'}`}>
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${vault.active ? 'text-(--theme-primary)' : 'text-(--foreground)'}`}>
                      {vault.name}
                    </div>
                    <div className="text-[10px] notion-text-subtle truncate max-w-[120px]">
                      {vault.path || t.internal}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       handleUpdateVaultPath(vault);
                     }}
                     className="p-1.5 text-(--foreground) opacity-30 hover:opacity-100 hover:bg-(--hover-bg) rounded transition-all"
                     title="Edit Vault Path"
                   >
                     <Edit2 size={12} />
                   </button>
                   {vault.active && <Check size={16} className="text-(--theme-primary)" />}
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer Actions */}
          <div className="p-2 border-t border-(--border-color) bg-(--hover-bg) flex gap-2">
            <button 
               onClick={handleAddVault}
               className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-(--theme-primary) bg-(--theme-primary)/10 rounded-lg hover:bg-(--theme-primary)/20 transition-colors"
            >
              <Plus size={12} />
              {t.add_new_vault || "Add Vault"}
            </button>
            <a 
              href="/settings" 
              className="shrink-0 flex items-center justify-center w-8 bg-(--card-bg) border border-(--border-color) rounded-lg hover:bg-(--hover-bg) hover:text-(--foreground) text-(--theme-primary) transition-all"
              title={t.manage_vaults}
            >
              <Settings size={14} />
            </a>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {targetVault && (
        <div className="fixed inset-0 z-9999 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-(--card-bg) rounded-2xl shadow-2xl max-w-sm w-full border border-(--border-color) overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-(--theme-warning-bg) text-(--theme-warning) rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-(--foreground)">Switch Vault?</h3>
                    <p className="text-xs notion-text-subtle mb-6 leading-relaxed">
                        {t.confirm_vault_switch || "Switching vaults will reload the application. Current session states might be reset."}
                    </p>
                    
                    <div className="bg-(--background) rounded-xl p-4 mb-6 border border-(--border-color) flex items-center justify-between">
                        <div className="text-left">
                           <div className="text-[10px] font-bold notion-text-subtle uppercase">From</div>
                           <div className="text-xs font-bold text-(--foreground)">{activeVault?.name}</div>
                        </div>
                        <ChevronRight size={16} className="notion-text-subtle" />
                        <div className="text-right">
                           <div className="text-[10px] font-bold text-(--theme-primary) uppercase">To</div>
                           <div className="text-xs font-bold text-(--theme-primary)">{targetVault.name}</div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setTargetVault(null)}
                            className="flex-1 py-2.5 rounded-xl border border-(--border-color) text-xs font-bold text-(--foreground) hover:bg-(--hover-bg) transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => handleSwitch(targetVault.id)}
                            className="flex-1 py-2.5 rounded-xl bg-(--theme-primary) text-(--background) text-xs font-bold hover:opacity-90 transition-opacity shadow-lg shadow-(--theme-primary)/20"
                        >
                            Confirm Switch
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
      {showCreateModal && (
        <div className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-(--card-bg) rounded-2xl shadow-2xl max-w-sm w-full border border-(--border-color) overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-(--border-color) flex justify-between items-center">
                    <h3 className="text-sm font-bold">Create New Vault</h3>
                    <button onClick={() => setShowCreateModal(false)} className="text-(--foreground) opacity-50 hover:opacity-100"><X size={16} /></button>
                </div>
                <div className="p-4 space-y-4">
                    {/* Vault Name */}
                    <div>
                        <label className="text-[10px] font-bold notion-text-subtle uppercase block mb-1">Vault Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-(--bg-secondary) border border-(--border-color) rounded-md px-3 py-2 text-sm focus:outline-none focus:border-(--theme-primary)"
                            placeholder="My Notes"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>

                    {/* Storage Type */}
                    <div>
                        <label className="text-[10px] font-bold notion-text-subtle uppercase block mb-2">Storage Type</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCreateType('internal')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border ${createType === 'internal' ? 'border-(--theme-primary) bg-(--theme-primary)/10 text-(--theme-primary)' : 'border-(--border-color) hover:bg-(--hover-bg)'}`}
                            >
                                Internal (App)
                            </button>
                            <button 
                                onClick={() => setCreateType('external')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border ${createType === 'external' ? 'border-(--theme-primary) bg-(--theme-primary)/10 text-(--theme-primary)' : 'border-(--border-color) hover:bg-(--hover-bg)'}`}
                            >
                                External (Folder)
                            </button>
                        </div>
                    </div>

                    {/* External Path Selection */}
                    {createType === 'external' && (
                        <div>
                             <label className="text-[10px] font-bold notion-text-subtle uppercase block mb-1">Location</label>
                             <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    className="flex-1 bg-(--bg-secondary) border border-(--border-color) rounded-md px-3 py-2 text-xs truncate opacity-50 cursor-not-allowed"
                                    value={newPath}
                                    readOnly
                                    placeholder="Select a folder..."
                                />
                                <button 
                                    onClick={handleSelectFolder}
                                    className="px-3 py-2 bg-(--hover-bg) border border-(--border-color) rounded-md text-xs font-bold hover:bg-(--border-color) transition-colors"
                                >
                                    Select
                                </button>
                             </div>
                        </div>
                    )}
                    
                    <div className="text-[10px] notion-text-subtle">
                        {createType === 'internal' 
                             ? "Vault will be created inside the application. Easy to move and backup." 
                             : "Vault will be created in an external folder on your computer."}
                    </div>
                </div>

                <div className="p-4 border-t border-(--border-color) bg-(--hover-bg) flex gap-3">
                    <button 
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 py-2 text-xs font-bold hover:bg-(--border-color)/50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleCreateSubmit}
                        className="flex-1 py-2 bg-(--theme-primary) text-(--background) text-xs font-bold rounded-lg hover:opacity-90 shadow-lg shadow-(--theme-primary)/20 transition-all"
                    >
                        Create Vault
                    </button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};
