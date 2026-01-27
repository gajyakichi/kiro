"use client";

import { Progress, Comment, DbLog, Project, Theme, DailyNote, SuggestedTask, Vault } from "@/lib/types";
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { IconRenderer } from '@/components/IconRenderer';
import dynamic from 'next/dynamic';

// Dynamic Imports for Code Splitting / Bundle Optimization
const NotionEditor = dynamic(() => import('@/components/NotionEditor'), { 
  loading: () => <div className="h-full w-full bg-gray-50 flex items-center justify-center text-xs text-gray-400">Loading Editor...</div>,
  ssr: false // Editor is client-only usually
});
const ThemeLab = dynamic(() => import('@/components/ThemeLab').then(mod => mod.ThemeLab), { 
  loading: () => <div className="p-4 text-xs text-center text-gray-400">Loading Themes...</div> 
});
const IconPicker = dynamic(() => import('@/components/IconPicker').then(mod => mod.IconPicker), { ssr: false });
const VaultSwitcher = dynamic(() => import('@/components/VaultSwitcher').then(mod => mod.VaultSwitcher), { ssr: false });
const InlineChatBox = dynamic(() => import('@/components/InlineChatBox').then(mod => mod.InlineChatBox), { ssr: false });

import { Sparkles, ShieldAlert, PlusCircle, Plus, Folder, ChevronRight, Edit2, Trash2, Languages, Loader2, PanelBottom, X, Check, AlertTriangle, Search } from 'lucide-react';
import { getTranslation } from '@/lib/i18n';

type TimelineEntry = {
  id: number;
  entryType: 'log' | 'comment' | 'task' | 'daily_note';
  timestamp: string;
  content: string;
  metadata?: string;
  status?: string;
  type?: string; 
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [dialogState, setDialogState] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({ open: false, title: "", message: "", type: 'success' });
  const [dbLogs, setDbLogs] = useState<DbLog[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  
  // Timeline State
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'log' | 'note' | 'task' | 'daily_note'>('all');
  const [timelineSearch, setTimelineSearch] = useState("");
  
  const handleDeleteComment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await fetch(`/api/comments?id=${id}`, { method: 'DELETE' });
      if (activeProject) fetchAbsorbData(activeProject.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateComment = async () => {
    if (!editingCommentId) return;
    try {
      await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCommentId, text: editingContent })
      });
      setEditingCommentId(null);
      setEditingContent("");
      if (activeProject) fetchAbsorbData(activeProject.id);
    } catch (e) {
      console.error(e);
    }
  };

  const startEditingComment = (id: number, currentText: string) => {
      setEditingCommentId(id);
      setEditingContent(currentText);
  };
  const [activeBlockType, setActiveBlockType] = useState<'markdown' | 'text' | 'code'>('markdown');
  const [activeTab, setActiveTab] = useState("timeline");
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [iconPickerTarget, setIconPickerTarget] = useState<string | null>(null); // 'add' | 'header'
  const [themes, setThemes] = useState<Theme[]>([]);
  const [previewCss, setPreviewCss] = useState("");
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [isAbsorbing, setIsAbsorbing] = useState(false);
  
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isVaultLoading, setIsVaultLoading] = useState(true);
  const [appLang, setAppLang] = useState("en");
  const [appIconSet, setAppIconSet] = useState("lucide");
  const [settings, setSettings] = useState<Record<string, string | undefined> | null>(null); // To store full settings object if needed

  // New Workspace State
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false);
  const [newWName, setNewWName] = useState("");
  const [newWPath, setNewWPath] = useState("");
  const [isCreatingW, setIsCreatingW] = useState(false);

  // AI Chat State
  const [chatState, setChatState] = useState<{ open: boolean; targetId: string | null; context: string; title: string }>({ open: false, targetId: null, context: "", title: "" });

  const handleOpenChat = (targetId: string, context: string, title: string) => {
      setChatState(prev => prev.targetId === targetId && prev.open 
        ? { open: false, targetId: null, context: "", title: "" }
        : { open: true, targetId, context, title }
      );
  };

  // Heatmap State


  // Progress Translation State
  const [progressLang, setProgressLang] = useState<'en' | 'ja'>('en');
  const [progressTranslated, setProgressTranslated] = useState<string | null>(null);
  const [isTranslatingProgress, setIsTranslatingProgress] = useState(false);
  const [showBottomPane, setShowBottomPane] = useState(true);

  const handleToggleProgressLang = async () => {
    if (progressLang === 'ja') {
        setProgressLang('en');
    } else {
        if (!progressTranslated && progress?.task) {
            setIsTranslatingProgress(true);
            try {
                const res = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: progress.task, targetLang: 'ja' })
                });
                const data = await res.json();
                if (data.translated) {
                    setProgressTranslated(data.translated);
                    setProgressLang('ja');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsTranslatingProgress(false);
            }
        } else if (progressTranslated) {
            setProgressLang('ja');
        }
    }
  };

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
      if (data.APP_LANG) setAppLang(data.APP_LANG);
      if (data.APP_ICON_SET) setAppIconSet(data.APP_ICON_SET);
    } catch (e) {
      console.error("Settings Fetch Error:", e);
    }
  }, []);

  const fetchVaults = useCallback(async () => {
    try {
      const res = await fetch('/api/vaults');
      const data = await res.json();
      setVaults(data);
    } catch (e) {
      console.error("Vault Fetch Error:", e);
    } finally {
      setIsVaultLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
      if (data.length > 0 && !activeProject) {
        setActiveProject(data[0]);
      }
    } catch (e) {
      console.error("Project Fetch Error:", e);
    }
  }, [activeProject]);

  const fetchAbsorbData = useCallback(async (projectId: number) => {
    try {
      const res = await fetch(`/api/absorb/data?projectId=${projectId}&t=${Date.now()}`, {
         cache: 'no-store'
      });
      const data = await res.json();
      setDailyNotes(data.dailyNotes || []);
      setSuggestedTasks(data.suggestedTasks || []);
    } catch (e) {
      console.error("Absorb Data Fetch Error:", e);
    }
  }, []);

  const fetchData = useCallback(async (projectId: number) => {
    try {
      await fetch('/api/sync', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      
      const dbLogsRes = await fetch(`/api/sync?projectId=${projectId}`);
      const logsData = await dbLogsRes.json();
      setDbLogs(logsData);

      const progRes = await fetch('/api/progress'); 
      const progData = await progRes.json();
      setProgress(progData);

      const commentRes = await fetch(`/api/comments?projectId=${projectId}`);
      const commentData = await commentRes.json();
      setComments(commentData);

      fetchAbsorbData(projectId);
    } catch (e) {
      console.error("Fetch Error:", e);
    }
  }, [fetchAbsorbData]);

  const fetchThemes = useCallback(async () => {
    try {
      const res = await fetch('/api/themes');
      const data = await res.json();
      setThemes(data);
    } catch (e) {
      console.error("Theme Fetch Error:", e);
    }
  }, []);

  const filteredTimelineData = useMemo(() => {
    const raw: TimelineEntry[] = [
      ...dbLogs.map(l => ({ 
        id: l.id,
        entryType: 'log' as const,
        timestamp: new Date(l.timestamp).toISOString(),
        content: l.content,
        metadata: l.metadata || undefined,
        type: l.type
      })),
      ...comments.map(c => ({ 
        id: c.id,
        entryType: 'comment' as const, 
        timestamp: new Date(c.timestamp).toISOString(), 
        content: c.text,
        type: c.type
      })),
      ...dailyNotes.map(n => ({ 
        id: n.id,
        entryType: 'daily_note' as const, 
        timestamp: n.timestamp ? new Date(n.timestamp).toISOString() : new Date().toISOString(),
        content: n.content
      })),
      ...suggestedTasks.filter(t => t.status === 'completed' || t.status === 'added').map(t => ({
          id: t.id,
          entryType: 'task' as const,
          content: t.task,
          type: 'task',
          timestamp: t.timestamp ? new Date(t.timestamp).toISOString() : new Date().toISOString(),
          status: t.status
      }))
    ];

    return raw
      .filter(item => {
        if (timelineFilter !== 'all' && item.entryType !== timelineFilter) return false;
        if (timelineSearch) {
          const searchLower = timelineSearch.toLowerCase();
          const content = item.content || "";
          const meta = item.metadata || "";
          return content.toLowerCase().includes(searchLower) || meta.toLowerCase().includes(searchLower);
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [dbLogs, comments, dailyNotes, suggestedTasks, timelineFilter, timelineSearch]);

  useEffect(() => {
    setMounted(true);
    fetchVaults();
    fetchProjects();
    fetchThemes();
    fetchSettings();
  }, [fetchProjects, fetchThemes, fetchVaults, fetchSettings]);

  useEffect(() => {
    if (activeProject) {
      fetchData(activeProject.id);
      const interval = setInterval(() => fetchData(activeProject.id), 30000);
      return () => clearInterval(interval);
    }
  }, [activeProject, fetchData]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !activeProject) return;
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: newComment, 
          projectId: activeProject.id,
          type: activeBlockType
        })
      });
      if (res.ok) {
        setNewComment("");
        setActiveBlockType("markdown");
        fetchData(activeProject.id);
        setActiveTab("comments");
      }
    } catch (e) {
      console.error("Comment Error:", e);
    }
  };

  const handleSelectTheme = async (id: number) => {
    try {
      const res = await fetch('/api/themes', { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: id !== -1 })
      });
      if (res.ok) fetchThemes();
    } catch (e) {
      console.error("Theme Select Error:", e);
    }
  };

  const handleUpdateProjectIcon = async (icon: string) => {
    if (!activeProject) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeProject.id, icon })
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveProject(updated);
        fetchProjects();
      }
    } catch (e) {
      console.error("Icon Update Error:", e);
    }
  };

  const handleAddWorkspace = async () => {
    if (!newWName || !newWPath) return;
    setIsCreatingW(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWName,
          git_path: newWPath,
          artifact_path: newWPath, // Defaulting same as git_path for simplicity
          icon: 'lucide:Folder'
        })
      });
      if (res.ok) {
        await res.json();
        setNewWName("");
        setNewWPath("");
        setIsAddingWorkspace(false);
        fetchProjects();
        // Option: automatically select new project
        // setActiveProject({ id: result.id, ... }); 
      }
    } catch (e) {
      console.error("Workspace Creation Error:", e);
    } finally {
      setIsCreatingW(false);
    }
  };

  const handleSelectWDir = async () => {
    if (window.electron?.selectDirectory) {
      const path = await window.electron.selectDirectory();
      if (path) {
          setNewWPath(path);
      }
    }
  };

  const handleAbsorb = async () => {
    if (!activeProject) return;
    setIsAbsorbing(true);
    try {
      const res = await fetch('/api/absorb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: activeProject.id })
      });
      if (res.ok) {
        await fetchAbsorbData(activeProject.id);
        setDialogState({
          open: true,
          title: "完了",
          message: "Absorbが完了しました",
          type: 'success'
        });
      } else {
        throw new Error("Absorbに失敗しました");
      }
    } catch (e) {
      console.error("Absorb Error:", e);
      setDialogState({
        open: true,
        title: "エラー",
        message: `エラー: ${(e as Error).message}`,
        type: 'error'
      });
    }
    setIsAbsorbing(false);
  };

  const handleUpdateSettings = async (newSettings: Partial<Record<string, string>>) => {
    // Optimistic state updates
    if (newSettings.APP_LANG) setAppLang(newSettings.APP_LANG);
    if (newSettings.APP_ICON_SET) setAppIconSet(newSettings.APP_ICON_SET);
    
    const nextSettings = { ...settings, ...newSettings };
    const oldSettings = settings;
    setSettings(nextSettings);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextSettings)
      });
      if (!res.ok) throw new Error("Failed to save settings");
      fetchSettings(); // Refresh from server to sync
    } catch (e) {
      console.error("Settings Update Error:", e);
      // Rollback on error
      setSettings(oldSettings);
      if (oldSettings?.APP_LANG) setAppLang(oldSettings.APP_LANG);
      if (oldSettings?.APP_ICON_SET) setAppIconSet(oldSettings.APP_ICON_SET);
    }
  };

  const handleSaveTheme = async (name: string, css: string, active?: boolean, isPreset?: boolean) => {
    try {
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, css, active, isPreset })
      });
      if (res.ok) {
        fetchThemes();
        setPreviewCss("");
      }
    } catch (e) {
      console.error("Theme Save Error:", e);
    }
  };

  const handleDeleteTheme = async (id: number) => {
    try {
      const res = await fetch(`/api/themes?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchThemes();
    } catch (e) {
      console.error("Theme Delete Error:", e);
    }
  };

  const renderMiniCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    
    const activityDays = new Set([
      ...dbLogs.map(l => new Date(l.timestamp).getDate()),
      ...comments.map(c => new Date(c.timestamp).getDate())
    ]);

    return (
      <div className="mt-8 px-2">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[11px] font-bold notion-text-subtle uppercase tracking-wider">
            {new Intl.DateTimeFormat(appLang, { month: 'short', year: 'numeric' }).format(currentDate)}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-0.5 hover:bg-gray-100 rounded text-gray-400" aria-label="Previous month">‹</button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-0.5 hover:bg-gray-100 rounded text-gray-400" aria-label="Next month">›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px text-[10px] text-center">
          {t.days_short[0] === 'Sun' 
            ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={`${d}-${i}`} className="py-1 text-gray-400 font-medium">{d}</div>)
            : t.days_short.map((d, i) => <div key={`${d}-${i}`} className="py-1 text-gray-400 font-medium">{d}</div>)
          }
          {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: days }, (_, i) => i + 1).map(day => (
            <div 
              key={day} 
              className={`py-1 rounded-sm transition-colors cursor-default ${activityDays.has(day) ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
    );
  };



  // Mandatory Vault Check
  const activeVault = vaults.find(v => v.active);
  const isVaultMandatory = !activeVault || !activeVault.path;

  if (!mounted || isVaultLoading) return <div className="min-h-screen bg-(--background)" />;

  const t = getTranslation(appLang);

  return (
    <div className={`flex h-screen overflow-hidden text-[14px] ${((previewCss || themes.some(t => t.active))) ? 'theme-active' : ''}`}>
      {/* Mandatory Vault Overlay */}
      {isVaultMandatory && (
        <div className="fixed inset-0 z-9999 bg-(--background)/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-(--border-color) rounded-3xl shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6 text-(--theme-primary)">
              <ShieldAlert size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">{t.vault_required}</h2>
            <p className="text-sm notion-text-subtle mb-8 leading-relaxed">
              {t.vault_desc}
            </p>
            <div className="space-y-3">
              <Link 
                href="/settings"
                className="w-full bg-foreground text-background py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-neutral-100 no-underline"
              >
                <PlusCircle size={18} />
                {t.configure_vault}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Notion Sidebar */}
      <aside className="w-80 notion-sidebar flex flex-col pt-8 pb-4 px-3 sticky top-0 h-screen overflow-y-auto">
        <div className="mb-6">
          <div className="px-2 mt-4">
            <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-semibold notion-text-subtle uppercase">{t.workspace}</div>
                <button 
                    onClick={() => setIsAddingWorkspace(!isAddingWorkspace)}
                    className="p-1 hover:bg-neutral-100 rounded transition-colors text-neutral-400 hover:text-neutral-600"
                    title={t.add_workspace}
                >
                    <Plus size={14} />
                </button>
            </div>
            
            {isAddingWorkspace && (
                <div className="mb-4 p-4 bg-neutral-50/50 border border-(--border-color) rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">{t.workspace_name}</label>
                        <input 
                            type="text"
                            value={newWName}
                            onChange={(e) => setNewWName(e.target.value)}
                            className="w-full text-xs p-3 bg-white border border-(--border-color) rounded-xl focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/10 shadow-sm font-medium transition-all"
                            placeholder="e.g. My Repo"
                        />
                    </div>
                    <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">{t.workspace_path}</label>
                        <div className="relative group">
                            <input 
                                type="text"
                                value={newWPath}
                                onChange={(e) => setNewWPath(e.target.value)}
                                className="w-full text-[11px] p-3 pr-10 bg-white border border-(--border-color) rounded-xl focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/10 shadow-sm font-mono transition-all"
                                placeholder="/Users/..."
                            />
                            <button 
                                onClick={handleSelectWDir}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-(--theme-primary) transition-all"
                                title={t.select_folder_title}
                            >
                                <Folder size={14} />
                            </button>
                        </div>
                    </div>
                    <button 
                        onClick={handleAddWorkspace}
                        disabled={isCreatingW || !newWName || !newWPath}
                        className="w-full py-2.5 bg-foreground text-background text-[11px] font-black rounded-xl hover:opacity-90 disabled:opacity-30 transition-all shadow-md shadow-neutral-100 uppercase tracking-wider"
                    >
                        {isCreatingW ? t.saving : t.confirm_add_workspace}
                    </button>
                </div>
            )}

            <div className="relative">
                <select 
                value={activeProject?.id || ""}
                onChange={(e) => {
                    const p = projects.find(proj => proj.id === parseInt(e.target.value));
                    if (p) setActiveProject(p);
                }}
                className="w-full bg-white border border-(--border-color) rounded px-2 py-1.5 pl-8 text-sm focus:outline-none appearance-none"
                >
                <option value="" disabled>{t.select_workspace}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {activeProject ? (
                        <IconRenderer icon={activeProject.icon} size={14} className="opacity-70" baseSet={appIconSet} />
                    ) : (
                        <span className="text-xs opacity-40">◦</span>
                    )}
                </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1" role="tablist">
          <button 
            onClick={() => setActiveTab("timeline")}
            className={`w-full notion-item flex items-center gap-3 ${activeTab === "timeline" ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === "timeline"}
          >
            <IconRenderer icon="History" size={16} baseSet={appIconSet} />
            <span>Timeline</span>
          </button>

          <button 
            onClick={() => setActiveTab("comments")}
            className={`w-full notion-item flex items-center gap-3 ${activeTab === "comments" ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === "comments"}
          >
            <IconRenderer icon="SquarePen" size={16} baseSet={appIconSet} />
            <div className="flex-1 flex justify-between items-center">
              <span>{t.notes}</span>
              <span className="text-xs notion-text-subtle">{comments.length}</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab("themes")}
            className={`w-full notion-item flex items-center gap-3 ${activeTab === "themes" ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === "themes"}
          >
            <IconRenderer icon="Palette" size={16} baseSet={appIconSet} className={activeTab === "themes" ? "" : "animate-pulse"} />
            <span>{t.theme_lab}</span>
          </button>

          <Link 
            href="/settings"
            className="notion-item flex items-center gap-3 no-underline text-inherit"
          >
            <IconRenderer icon="Settings" size={16} baseSet={appIconSet} />
            <span>{t.settings}</span>
          </Link>
        </nav>

        {renderMiniCalendar()}

        {/* Layout Controls */}
        <div className="mt-8 px-2">
             <div className="text-[10px] font-bold notion-text-subtle uppercase tracking-widest mb-2 px-1">Layout</div>
             <button 
                onClick={() => setShowBottomPane(!showBottomPane)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-xs font-semibold ${showBottomPane ? 'bg-(--theme-primary-bg) text-(--theme-primary)' : 'text-neutral-500 hover:bg-neutral-100'}`}
             >
                <PanelBottom size={16} />
                <span>Bottom Note</span>
                <span className={`ml-auto w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${showBottomPane ? 'bg-(--theme-primary)' : 'bg-neutral-300'}`}>
                    <span className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${showBottomPane ? 'translate-x-4' : ''}`} />
                </span>
             </button>
        </div>

        {/* Vault Switcher Integration */}
        <div className="mt-4 pt-4 border-t border-(--border-color)">
          <div className="text-[10px] font-bold notion-text-subtle uppercase tracking-widest px-2 mb-2">{t.active_storage}</div>
          <VaultSwitcher appLang={appLang} onSwitch={fetchProjects} className="px-2" />
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-12 lg:px-20 xl:px-40 custom-scrollbar">
        <header className="mb-12 animate-fade-in relative z-50">
          <h1 className="group relative flex items-center text-4xl font-bold tracking-tight mb-2">
            <div className="relative mr-4">
              <button 
                onClick={() => setIconPickerTarget('header')}
                aria-label="Change project icon"
                className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-100 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
              >
                {activeProject?.icon ? (
                    <IconRenderer icon={activeProject.icon} size={32} baseSet={appIconSet} />
                ) : (
                    <span className="text-2xl opacity-20">◦</span>
                )}
              </button>
              {iconPickerTarget === 'header' && (
                <div className="absolute left-0 top-full z-100">
                  <IconPicker 
                    selectedIcon={activeProject?.icon}
                    onSelect={(icon: string) => {
                      handleUpdateProjectIcon(icon);
                      setIconPickerTarget(null);
                    }}
                    onClose={() => setIconPickerTarget(null)}
                  />
                </div>
              )}
            </div>
            <span>
              {activeTab === "comments" && t.dev_notes}

              {activeTab === "timeline" && "Project Timeline"}
              {activeTab === "themes" && t.theme_lab}
            </span>
            {activeProject && <span className="text-lg ml-4 opacity-30 font-normal">/ {activeProject.name}</span>}
            
            {activeProject && (
              <button 
                onClick={handleAbsorb}
                disabled={isAbsorbing}
                aria-busy={isAbsorbing}
                className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isAbsorbing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100' 
                    : 'bg-white text-foreground border border-gray-200 hover:bg-gray-100 shadow-xs'
                }`}
              >
                <Sparkles size={14} className={isAbsorbing ? 'animate-spin' : 'text-(--theme-accent) transition-colors'} />
                {isAbsorbing ? t.absorbing : t.absorb_context}
              </button>
            )}
          </h1>
          <p className="text-lg notion-text-subtle">
            {activeTab === "comments" && t.notes_desc}

            {activeTab === "timeline" && "A chronological view of all activities."}
          </p>
        </header>

        <section className="animate-fade-in">
          {activeTab === "timeline" && (
             <div className="relative animate-fade-in space-y-8">
                
                {/* 1. Current Progress (Pinned) */}
                <div className="group relative pl-6 border-l-2 border-(--theme-primary-bg) hover:border-(--theme-primary) transition-colors">
                  <button 
                    onClick={() => handleOpenChat(
                        'current-status',
                        `Current Status Task:\n${progress?.task || 'No task set'}`,
                        "Current Status AI"
                    )}
                    className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-(--theme-primary-bg) group-hover:border-(--theme-primary) transition-colors flex items-center justify-center cursor-pointer hover:scale-110 z-10"
                    title="Ask AI about this status"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-(--theme-primary) opacity-30 group-hover:opacity-100 transition-opacity" />
                  </button>
                  
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Current Status</span>
                    </div>
                    {settings?.ENABLED_PLUGINS?.includes('plugin-jp') && (
                        <button
                          onClick={handleToggleProgressLang}
                          disabled={isTranslatingProgress}
                          className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-gray-400 hover:text-(--theme-primary) hover:bg-(--theme-primary-bg) rounded transition-colors"
                          title="Toggle Language"
                        >
                          {isTranslatingProgress ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
                          {progressLang === 'en' ? 'EN' : 'JA'}
                        </button>
                    )}
                  </div>
                  
                  <div className="bg-white notion-card p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <article className="prose prose-slate max-w-none text-gray-700 leading-relaxed text-sm">
                        <div className="markdown-content">
                          <ReactMarkdown>
                            {progressLang === 'ja' ? (progressTranslated || "翻訳中...") : (progress?.task || t.loading_progress)}
                          </ReactMarkdown>
                        </div>
                    </article>
                  </div>
                  
                  {/* Inline Chat for Current Status */}
                  {chatState.open && chatState.targetId === 'current-status' && (
                    <InlineChatBox 
                      onClose={() => setChatState(prev => ({ ...prev, open: false, targetId: null }))}
                      initialContext={chatState.context}
                      title={chatState.title}
                    />
                  )}
                </div>

                {/* 2. Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 bg-(--background) py-4 z-20 backdrop-blur-sm bg-opacity-90 border-b border-(--border-color)">
                   <div className="relative w-full md:w-auto md:min-w-[300px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="Search timeline..." 
                        value={timelineSearch}
                        onChange={(e) => setTimelineSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--theme-primary)/20"
                      />
                   </div>
                   <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-1">
                      {[
                        { id: 'all', label: 'All', icon: null },
                        { id: 'log', label: 'Git', icon: 'Code' },
                        { id: 'comment', label: 'Notes', icon: 'FileText' },
                        { id: 'daily_note', label: 'Daily', icon: 'Sparkles' },
                        { id: 'task', label: 'Tasks', icon: 'CheckCircle' }
                      ].map(filter => (
                        <button
                          key={filter.id}
                          onClick={() => setTimelineFilter(filter.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                            timelineFilter === filter.id 
                              ? 'bg-(--theme-primary) text-white shadow-md' 
                              : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {filter.icon && <IconRenderer icon={filter.icon} size={12} baseSet={appIconSet} className={timelineFilter === filter.id ? 'text-white' : 'text-gray-400'} />}
                          {filter.label}
                        </button>
                      ))}
                   </div>
                </div>

                {/* 3. Timeline List */}
                <div className="relative">
                  {/* Vertical Timeline Guide */}
                  <div className="absolute left-[12px] top-6 bottom-6 w-px bg-(--border-color) opacity-50 z-0"></div>

                  <div className="space-y-0 relative z-10 pb-20">
                    {filteredTimelineData.map((entry) => {
                      const entryType = entry.entryType;
                      const timestamp = new Date(entry.timestamp);
                      const ICON_SIZE = 12;
                      let icon = <IconRenderer icon="FileText" size={ICON_SIZE} baseSet={appIconSet} />;
                      let typeLabel = "Note";
                      const content = entry.content;
                      let metadata: any = null;

                      if (entryType === 'log') {
                         icon = entry.type === 'git' ? 
                             <IconRenderer icon="Code" size={ICON_SIZE} baseSet={appIconSet} /> : 
                             <IconRenderer icon="FileText" size={ICON_SIZE} baseSet={appIconSet} />;
                         typeLabel = entry.type || 'log';
                         if (entry.metadata) {
                             try {
                                metadata = JSON.parse(entry.metadata);
                             } catch (e) { /* ignore */ }
                         }
                      } else if (entryType === 'comment') {
                         typeLabel = entry.type || 'note';
                         if (entry.type === 'code') icon = <IconRenderer icon="Code" size={ICON_SIZE} baseSet={appIconSet} />;
                      } else if (entryType === 'task') {
                         icon = entry.status === 'completed' ? 
                             <IconRenderer icon="CheckCircle" size={ICON_SIZE} className="text-(--theme-primary)" baseSet={appIconSet} /> : 
                             <IconRenderer icon="ListTodo" size={ICON_SIZE} className="text-(--theme-primary)/70" baseSet={appIconSet} />;
                         typeLabel = entry.status === 'completed' ? 'Task Completed' : 'Task Added';
                      } else if (entryType === 'daily_note') {
                         icon = <IconRenderer icon="Sparkles" size={ICON_SIZE} className="text-(--theme-accent)" baseSet={appIconSet} />;
                         typeLabel = "Daily Summary";
                      }

                      return (
                        <div key={`${entryType}-${entry.id}`} className="group relative">
                          <div className="flex gap-4 items-start py-6 -mx-4 px-4 hover:bg-gray-50/50 rounded-2xl transition-all">
                            {/* Marker Icon (Clickable for AI Chat) */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenChat(
                                        `${entryType}-${entry.id}`,
                                        `Entry Type: ${entryType}\nTimestamp: ${timestamp.toLocaleString()}\nContent:\n${content}`,
                                        `Chat about ${typeLabel}`
                                    );
                                }}
                                className="shrink-0 w-6 h-6 rounded-full bg-white border-2 border-(--theme-primary-bg) flex items-center justify-center text-(--theme-primary) shadow-sm group-hover:scale-110 group-hover:border-(--theme-primary) transition-all z-10 cursor-pointer hover:bg-blue-50"
                                title="Ask AI about this item"
                            >
                              {icon}
                            </button>

                           <div className="flex-1 min-w-0">
                             {entryType === 'daily_note' ? (
                               <details className="group/details">
                                 <summary className="list-none cursor-pointer flex items-center gap-3 mb-2 focus:outline-none select-none">
                                   <span className="text-[10px] bg-(--theme-accent) text-white px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 hover:opacity-90 transition-opacity">
                                     {typeLabel}
                                     <ChevronRight size={10} className="group-open/details:rotate-90 transition-transform" />
                                   </span>
                                   <span className="text-[10px] notion-text-subtle font-bold uppercase tracking-widest bg-(--theme-primary-bg) px-2.5 py-1 rounded-lg border border-(--border-color)">
                                     {timestamp.toLocaleDateString(appLang)}
                                   </span>
                                 </summary>
                                 <div className="mt-4 markdown-content pl-2 border-l-2 border-(--theme-accent)/30 animate-in slide-in-from-top-2 duration-300">
                                    <ReactMarkdown>{content}</ReactMarkdown>
                                 </div>
                               </details>
                             ) : (
                               <>
                                 {/* Edit Mode for Comment */}
                                 {entryType === 'comment' && editingCommentId === entry.id ? (
                                    <div className="mt-2 border border-(--theme-primary) rounded-xl overflow-hidden shadow-sm">
                                        <NotionEditor 
                                          value={editingContent}
                                          iconSet={appIconSet}
                                          onChange={setEditingContent}
                                          onSave={handleUpdateComment}
                                          onCancel={() => {
                                              setEditingCommentId(null);
                                              setEditingContent("");
                                          }}
                                        />
                                    </div>
                                 ) : (
                                    <>
                                      {/* Metadata Header & Actions */}
                                      <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-3">
                                              <span className="text-[10px] bg-(--theme-primary) text-white px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider shadow-sm">
                                                  {typeLabel}
                                              </span>
                                              <span className="text-[10px] notion-text-subtle font-bold uppercase tracking-widest bg-(--theme-primary-bg) px-2.5 py-1 rounded-lg border border-(--border-color)">
                                                  {timestamp.toLocaleDateString(appLang)} {timestamp.toLocaleTimeString(appLang, { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                          </div>
                                          
                                          {/* Actions for Comments */}
                                          {entryType === 'comment' && (
                                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button 
                                                      onClick={() => startEditingComment(entry.id, content)}
                                                      className="p-1.5 text-gray-400 hover:text-(--theme-primary) hover:bg-gray-100 rounded transition-colors"
                                                      title="Edit"
                                                  >
                                                      <Edit2 size={14} />
                                                  </button>
                                                  <button 
                                                      onClick={() => handleDeleteComment(entry.id)}
                                                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                      title="Delete"
                                                  >
                                                      <Trash2 size={14} />
                                                  </button>
                                              </div>
                                          )}
                                      </div>

                                      {/* Content Area */}
                                      <div className={`mt-3 ${entryType === 'log' && 'py-1'}`}>
                                      {entryType === 'log' && metadata?.hash ? (
                                          <div>
                                          <p className="text-[15px] font-medium leading-relaxed">{content}</p>
                                          <div className="mt-2 flex items-center gap-2 text-[10px] notion-text-subtle font-mono">
                                              <span className="bg-(--theme-primary-bg) px-1.5 py-0.5 rounded border border-(--border-color)">
                                              {metadata.hash.substring(0, 7)}
                                              </span>
                                              <span>{metadata.author || 'Unknown'}</span>
                                          </div>
                                          </div>
                                      ) : entryType === 'task' ? (
                                          <div className="flex items-center gap-2">
                                              {entry.status === 'completed' && <Check size={14} className="text-green-500"/>}
                                              <p className={`text-[15px] font-medium leading-relaxed ${entry.status === 'completed' ? 'line-through opacity-70' : ''}`}>
                                                {content}
                                              </p>
                                          </div>
                                      ) : (
                                          <div className="markdown-content">
                                          <ReactMarkdown>{content}</ReactMarkdown>
                                          </div>
                                      )}
                                      </div>
                                     </>
                                  )}
                                </>
                              )}
                              
                              {/* Inline Chat Box */}
                              {chatState.open && chatState.targetId === `${entryType}-${entry.id}` && (
                                <InlineChatBox 
                                  onClose={() => setChatState(prev => ({ ...prev, open: false, targetId: null }))}
                                  initialContext={chatState.context}
                                  title={chatState.title}
                                />
                              )}
                            </div>
                           </div>
                         </div>
                       );
                     })}
                    
                    {filteredTimelineData.length === 0 && (
                       <div className="py-20 text-center text-gray-400 italic">No activity matching your filters.</div>
                    )}
                  </div>
                </div>
             </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex-1 flex flex-col">
                <h2 className="text-2xl font-bold tracking-tight mb-4">{t.dev_notes}</h2>
                <div className="flex-1 border border-(--border-color) rounded-xl overflow-hidden bg-white flex flex-col shadow-sm min-h-[500px]">
                  <NotionEditor 
                    value={newComment}
                    iconSet={appIconSet}
                    onChange={setNewComment}
                    onSave={() => {
                      handleAddComment();
                      // Optional: Toast or feedback
                    }}
                    onCancel={() => setNewComment("")} // Clear
                  />
                </div>
              </div>

              {/* Past Notes List - Simplified */}
              <div className="space-y-4">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Previous Notes</h3>
                 {comments.length === 0 && <p className="text-gray-400 italic text-sm">No notes yet.</p>}
                 {comments.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(c => (
                    <div key={c.id} className="bg-white p-4 rounded-xl border border-(--border-color) shadow-sm group">
                       {editingCommentId === c.id ? (
                           <div className="border border-(--theme-primary) rounded-xl overflow-hidden shadow-sm">
                               <NotionEditor 
                                 value={editingContent}
                                 iconSet={appIconSet}
                                 onChange={setEditingContent}
                                 onSave={handleUpdateComment}
                                 onCancel={() => {
                                     setEditingCommentId(null);
                                     setEditingContent("");
                                 }}
                               />
                           </div>
                       ) : (
                           <>
                               <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded text-gray-500">
                                    {new Date(c.timestamp).toLocaleDateString()}
                                  </span>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => startEditingComment(c.id, c.text)}
                                            className="p-1.5 text-gray-400 hover:text-(--theme-primary) hover:bg-gray-100 rounded transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteComment(c.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                  </div>
                               </div>
                               <div className="markdown-content text-sm">
                                  {c.type === 'code' ? (
                                     <pre className="bg-neutral-900 text-emerald-400 p-2 rounded"><code>{c.text}</code></pre>
                                  ) : (
                                     <ReactMarkdown>{c.text}</ReactMarkdown>
                                  )}
                               </div>
                           </>
                       )}
                    </div>
                 ))}
              </div>
            </div>
          )}

          {activeTab === "themes" && (
            <ThemeLab 
              themes={themes}
              onSave={handleSaveTheme}
              onDelete={handleDeleteTheme}
              onToggle={(theme) => handleSelectTheme(theme ? theme.id : -1)}
              onPreview={setPreviewCss}
              appIconSet={appIconSet}
              onUpdateIconSet={(set) => handleUpdateSettings({ APP_ICON_SET: set })}
            />
          )}
        </section>

        <footer className="mt-24 pt-8 border-t border-(--border-color) text-xs notion-text-subtle flex justify-between items-center">
          <span>{activeProject?.name || t.ready}</span>
          <span>{t.status_online}</span>
        </footer>
        </div>
        {showBottomPane && (
            <div className="h-72 border-t border-(--border-color) bg-white shrink-0 flex flex-col animate-in slide-in-from-bottom-5 duration-300 shadow-2xl relative z-40">
                <div className="flex items-center justify-between px-6 py-2 border-b border-(--border-color) bg-neutral-50/50">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Quick Note / Scratchpad</span>
                    <button onClick={() => setShowBottomPane(false)} className="text-neutral-400 hover:text-neutral-600"><X size={14}/></button>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                    <NotionEditor 
                      value={newComment}
                      iconSet={appIconSet}
                      onChange={setNewComment}
                      onSave={handleAddComment}
                      onCancel={() => setNewComment("")}
                    />
                </div>
            </div>
        )}
      {/* Custom Dialog */}
      {dialogState.open && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-neutral-100">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${dialogState.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <Check size={24} className={dialogState.type === 'success' ? 'block' : 'hidden'} />
              <AlertTriangle size={24} className={dialogState.type === 'error' ? 'block' : 'hidden'} />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">{dialogState.title}</h3>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed whitespace-pre-wrap">
              {dialogState.message}
            </p>
            <button
              onClick={() => setDialogState(prev => ({ ...prev, open: false }))}
              className="w-full py-2.5 bg-neutral-900 text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
      </main>

      <style key={previewCss ? 'preview-active' : (themes.find(t => t.active)?.id || 'original')} dangerouslySetInnerHTML={{ __html: `
        ${previewCss || themes.find(t => t.active)?.css || ''}
        .theme-active body { line-height: 1.6; letter-spacing: 0.015em; -webkit-font-smoothing: subpixel-antialiased; }
        .theme-active .notion-card { box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important; transition: transform 0.2s ease; }
        .markdown-content ul { list-style-type: none; padding-left: 0; }
        .markdown-content li { margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px; }
        .markdown-content li input[type="checkbox"] { margin-top: 4px; pointer-events: none; }
        .markdown-content p { margin: 0; }
        .markdown-content h1, .markdown-content h2, .markdown-content h3 { font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; }
        .markdown-content h1 { font-size: 1.5em; }
        .markdown-content h2 { font-size: 1.25em; border-bottom: 1px solid var(--border-color); padding-bottom: 2px; }
        .markdown-content blockquote { border-left: 3px solid var(--theme-primary); padding-left: 1rem; color: var(--theme-primary); opacity: 0.8; font-style: italic; background: var(--theme-primary-bg); border-radius: 0 4px 4px 0; margin: 1em 0; padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .markdown-content pre { background: var(--theme-primary-bg) !important; border: 1px solid var(--theme-primary-bg) !important; border-radius: 8px; }
        .markdown-content code { color: var(--theme-primary); }
      `}} />
    </div>
  );
}
