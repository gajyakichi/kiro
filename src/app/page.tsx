"use client";

import { Progress, Comment, DbLog, Project, Theme, DailyNote, SuggestedTask, Vault } from "@/lib/types";
import { useEffect, useState, useCallback } from 'react';
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
const SuggestedTasks = dynamic(() => import('@/components/SuggestedTasks'));
const DailyNotes = dynamic(() => import('@/components/DailyNotes'));
const ActivityHeatmap = dynamic(() => import('@/components/ActivityHeatmap'), {
  loading: () => <div className="h-64 w-full bg-neutral-50 rounded-3xl border border-dashed border-neutral-200 animate-pulse" />,
  ssr: false
});

import { Sparkles, ShieldAlert, PlusCircle, Plus, Folder, ChevronRight, Edit2, Trash2, Languages, Loader2, PanelBottom, X, Check, AlertTriangle } from 'lucide-react';
import { getTranslation } from '@/lib/i18n';

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

  // Heatmap State
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null);

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

  const updateSuggestedTaskStatus = async (taskId: number, status: string, task?: string) => {
    if (!activeProject) return;
    try {
      const res = await fetch('/api/absorb/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status, projectId: activeProject.id, task })
      });
      if (res.ok) {
        fetchAbsorbData(activeProject.id);
      }
    } catch (e) {
      console.error("Task Update Error:", e);
    }
  };

  const handleManualAddTask = async (task: string) => {
    if (!activeProject) return;
    try {
        const res = await fetch('/api/absorb/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: activeProject.id, task })
        });
        if (res.ok) {
            fetchAbsorbData(activeProject.id);
        }
    } catch (e) {
        console.error("Manual Task Add Error:", e);
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

  const renderContributionGraph = () => {
    // 1. Generate date range (last 52 weeks)
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364); // One year ago
    
    // Adjust to starting the week
    const firstDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - firstDayOfWeek);

    const aggregatedData = [
      ...dbLogs.map(l => ({ ...l, entryType: 'log', dateStr: new Date(l.timestamp).toISOString().split('T')[0] })),
      ...comments.map(c => ({ ...c, entryType: 'comment', dateStr: new Date(c.timestamp).toISOString().split('T')[0], type: 'note' })),
      ...dailyNotes.map(n => ({ ...n, entryType: 'daily_note', dateStr: n.date })),
      ...suggestedTasks.filter(t => t.status === 'completed' || t.status === 'added').map(t => ({ ...t, entryType: 'task', dateStr: new Date(t.timestamp).toISOString().split('T')[0], content: t.task }))
    ];

    type ActivityEntry = (typeof aggregatedData)[0];
    const activityMap = aggregatedData.reduce((acc: Record<string, ActivityEntry[]>, item) => {
      if (!acc[item.dateStr]) acc[item.dateStr] = [];
      acc[item.dateStr].push(item);
      return acc;
    }, {});

    return (
      <div className="animate-fade-in space-y-8">

        <ActivityHeatmap 
          activityMap={activityMap}
          selectedDate={selectedHeatmapDate}
          onSelectDate={setSelectedHeatmapDate}
          appLang={appLang}
          translations={t}
        />

        {selectedHeatmapDate && (
          <div className="bg-neutral-50/50 border border-(--border-color) rounded-3xl p-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-bold flex items-center gap-3">
                 <div className="w-2 h-8 bg-(--theme-primary) rounded-full" />
                 {new Date(selectedHeatmapDate).toLocaleDateString(appLang, { dateStyle: 'full' })}
               </h3>
               <span className="text-xs font-black text-white bg-(--theme-primary) px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                 {activityMap[selectedHeatmapDate]?.length || 0} {t.entry_marker}s
               </span>
            </div>
            
            <div className="space-y-4 relative">
              {/* Vertical Guide Line */}
              <div className="absolute left-[12px] top-4 bottom-4 w-px bg-(--border-color) opacity-50 z-0"></div>

              {(activityMap[selectedHeatmapDate] || []).map((entry, idx) => {
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 const anyEntry = entry as any;
                 const entryType = anyEntry.entryType || ('type' in entry && entry.type === 'git' ? 'log' : 'comment');
                 const ICON_SIZE = 12;
                 
                 let icon = <IconRenderer icon="FileText" size={ICON_SIZE} baseSet={appIconSet} />;
                 let typeLabel = "note";
                 let content = "";
                 let badgeBg = "bg-(--theme-primary)";
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 let metadata: any = null;

                 if (entryType === 'log') {
                     const l = anyEntry;
                     icon = l.type === 'git' ? 
                         <IconRenderer icon="Code" size={ICON_SIZE} baseSet={appIconSet} /> : 
                         <IconRenderer icon="FileText" size={ICON_SIZE} baseSet={appIconSet} />;
                     typeLabel = l.type; 
                     content = l.content;
                     try { metadata = l.metadata ? JSON.parse(l.metadata) : null; } catch {}
                 } else if (entryType === 'comment') {
                     typeLabel = anyEntry.type || 'note';
                     content = anyEntry.text;
                 } else if (entryType === 'daily_note') {
                     icon = <IconRenderer icon="Sparkles" size={ICON_SIZE} className="text-(--theme-accent)" baseSet={appIconSet} />;
                     typeLabel = "Daily Summary";
                     content = anyEntry.content;
                     badgeBg = "bg-(--theme-accent)";
                 } else if (entryType === 'task') {
                     icon = anyEntry.status === 'completed' ? 
                         <IconRenderer icon="CheckCircle" size={ICON_SIZE} className="text-(--theme-primary)" baseSet={appIconSet} /> : 
                         <IconRenderer icon="ListTodo" size={ICON_SIZE} className="text-(--theme-primary)/70" baseSet={appIconSet} />;
                     typeLabel = anyEntry.status === 'completed' ? 'Task Completed' : 'Task Added';
                     content = anyEntry.task || anyEntry.content;
                 }

                 return (
                   <div key={idx} className="group relative">
                      <div className="flex gap-4 items-start py-4 -mx-2 px-2 hover:bg-white/50 rounded-2xl transition-all">
                         {/* Marker */}
                         <div className="shrink-0 w-6 h-6 rounded-full bg-white border-2 border-(--theme-primary-bg) flex items-center justify-center text-(--theme-primary) shadow-sm group-hover:scale-110 group-hover:border-(--theme-primary) transition-all z-10">
                            {icon}
                         </div>
                         
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                               <span className={`text-[10px] ${badgeBg} text-white px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider shadow-sm`}>
                                  {typeLabel}
                               </span>
                            </div>
                            
                            <div className="text-sm text-neutral-700 leading-relaxed markdown-content">
                               <ReactMarkdown>{content}</ReactMarkdown>
                            </div>

                            {/* Git Metadata */}
                            {metadata && (
                               <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                                  <span className="bg-white border border-neutral-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                     {metadata.hash?.substring(0, 7) || '---'}
                                  </span>
                                  <span>•</span>
                                  <span>{metadata.author || t.unknown_author}</span>
                               </div>
                            )}
                         </div>
                      </div>
                   </div>
                 );
              })}
              {(!activityMap[selectedHeatmapDate] || activityMap[selectedHeatmapDate].length === 0) && (
                <div className="py-12 text-center relative z-10">
                  <p className="text-sm text-neutral-400 italic">{t.no_activity}</p>
                </div>
              )}
            </div>
          </div>
        )}
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
            onClick={() => setActiveTab("git")}
            className={`w-full notion-item flex items-center gap-3 ${activeTab === "git" ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === "git"}
          >
            <IconRenderer icon="Scroll" size={16} baseSet={appIconSet} />
            <span>{t.git_logs}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("progress")}
            className={`w-full notion-item flex items-center gap-3 ${activeTab === "progress" ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === "progress"}
          >
            <IconRenderer icon="CheckSquare" size={16} baseSet={appIconSet} />
            <span>{t.progress}</span>
          </button>

          <button 
            onClick={() => setActiveTab("daily_notes")}
            className={`w-full notion-item flex items-center gap-3 ${activeTab === "daily_notes" ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === "daily_notes"}
          >
            <IconRenderer icon="Sparkles" size={16} baseSet={appIconSet} />
            <div className="flex-1 flex justify-between items-center">
              <span>{t.daily_notes}</span>
              {dailyNotes.length > 0 && <span className="text-[10px] bg-(--theme-primary-bg) text-(--theme-primary) px-1.5 rounded-full font-bold">{dailyNotes.length}</span>}
            </div>
          </button>

          <button 
            onClick={() => setActiveTab("suggested_tasks")}
            className={`w-full notion-item flex items-center gap-3 ${activeTab === "suggested_tasks" ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === "suggested_tasks"}
          >
            <IconRenderer icon="Lightbulb" size={16} baseSet={appIconSet} />
            <div className="flex-1 flex justify-between items-center">
              <span>{t.suggestions}</span>
              {suggestedTasks.length > 0 && <span className="text-[10px] bg-(--theme-accent-bg) text-(--theme-accent) px-1.5 rounded-full font-bold">{suggestedTasks.length}</span>}
            </div>
          </button>

          <button 
            onClick={() => setActiveTab("calendar")}
            className={`w-full notion-item flex items-center gap-3 ${activeTab === "calendar" ? "active" : ""}`}
            role="tab"
            aria-selected={activeTab === "calendar"}
          >
            <IconRenderer icon="Calendar" size={16} baseSet={appIconSet} />
            <span>{t.calendar}</span>
          </button>

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
              {activeTab === "git" && t.git_history}
              {activeTab === "progress" && t.dev_progress}
              {activeTab === "daily_notes" && t.daily_notes}
              {activeTab === "suggested_tasks" && t.ai_suggestions}
              {activeTab === "comments" && t.dev_notes}
              {activeTab === "calendar" && t.system_calendar}
              {activeTab === "timeline" && "Project Timeline"}
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
            {activeTab === "git" && t.git_desc}
            {activeTab === "progress" && t.progress_desc}
            {activeTab === "daily_notes" && t.daily_desc}
            {activeTab === "suggested_tasks" && t.suggestions_desc}
            {activeTab === "comments" && t.notes_desc}
            {activeTab === "calendar" && t.calendar_desc}
            {activeTab === "timeline" && "A chronological view of all activities."}
          </p>
        </header>

        <section className="animate-fade-in">
           {activeTab === "timeline" && (
             <div className="relative">
                {/* Vertical Timeline Guide */}
                <div className="absolute left-[12px] top-6 bottom-6 w-px bg-(--border-color) opacity-50 z-0"></div>

                <div className="space-y-0 relative z-10">
                  {[
                    ...dbLogs.map(l => ({ ...l, entryType: 'log' as const })),
                    ...comments.map(c => ({ ...c, entryType: 'comment' as const })),
                    ...dailyNotes.map(n => ({ ...n, entryType: 'daily_note' as const, timestamp: n.timestamp || new Date().toISOString() })),
                    ...suggestedTasks.filter(t => t.status === 'completed' || t.status === 'added').map(t => ({
                       id: t.id,
                       entryType: 'task' as const,
                       content: t.task,
                       type: 'task',
                       timestamp: t.timestamp,
                       status: t.status
                    }))
                  ]
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((entry) => {
                    const entryType = entry.entryType;
                    const timestamp = new Date(entry.timestamp);
                    const ICON_SIZE = 12;
                    let icon = <IconRenderer icon="FileText" size={ICON_SIZE} baseSet={appIconSet} />;
                    let typeLabel = "Note";
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let content: any = "";
                    let metadata = null;

                    if (entryType === 'log') {
                       const l = entry as DbLog;
                       icon = l.type === 'git' ? 
                           <IconRenderer icon="Code" size={ICON_SIZE} baseSet={appIconSet} /> : 
                           <IconRenderer icon="FileText" size={ICON_SIZE} baseSet={appIconSet} />;
                       typeLabel = l.type;
                       content = l.content;
                       metadata = l.metadata ? JSON.parse(l.metadata) : null;
                    } else if (entryType === 'comment') {
                       const c = entry as Comment;
                       typeLabel = c.type || 'note';
                       content = c.text;
                       if (c.type === 'code') icon = <IconRenderer icon="Code" size={ICON_SIZE} baseSet={appIconSet} />;
                    } else if (entryType === 'task') {
                       // eslint-disable-next-line @typescript-eslint/no-explicit-any
                       const tEntry = entry as any;
                       icon = tEntry.status === 'completed' ? 
                           <IconRenderer icon="CheckCircle" size={ICON_SIZE} className="text-(--theme-primary)" baseSet={appIconSet} /> : 
                           <IconRenderer icon="ListTodo" size={ICON_SIZE} className="text-(--theme-primary)/70" baseSet={appIconSet} />;
                       typeLabel = tEntry.status === 'completed' ? 'Task Completed' : 'Task Added';
                       content = tEntry.content;
                    } else if (entryType === 'daily_note') {
                       icon = <IconRenderer icon="Sparkles" size={ICON_SIZE} className="text-(--theme-accent)" baseSet={appIconSet} />;
                       typeLabel = "Daily Summary";
                       // eslint-disable-next-line @typescript-eslint/no-explicit-any
                       content = (entry as any).content;
                    }

                    return (
                      <div key={`${entryType}-${entry.id}`} className="group relative">
                        <div className="flex gap-4 items-start py-6 -mx-4 px-4 hover:bg-gray-50/50 rounded-2xl transition-all">
                          {/* Marker Icon */}
                          <div className="shrink-0 w-6 h-6 rounded-full bg-white border-2 border-(--theme-primary-bg) flex items-center justify-center text-(--theme-primary) shadow-sm group-hover:scale-110 group-hover:border-(--theme-primary) transition-all z-10">
                            {icon}
                          </div>

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
                                        <p className={`text-[15px] font-medium leading-relaxed ${// eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        (entry as any).status === 'completed' ? 'line-through opacity-70' : ''}`}>
                                            {content}
                                        </p>
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
                         </div>
                       </div>
                     </div>
                   );
                 })}
                 
                 {dbLogs.length === 0 && comments.length === 0 && suggestedTasks.length === 0 && dailyNotes.length === 0 && (
                    <div className="py-20 text-center text-gray-400 italic">No activity yet.</div>
                 )}
               </div>
            </div>
          )}
          {activeTab === "git" && (
            <div className="space-y-6">
              {dbLogs.filter(log => log.type === "git").map((log, i) => (
                <div key={i} className="group p-4 -ml-4 rounded-lg hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl mt-1 opacity-40">◦</div>
                    <div>
                       <div className="font-medium text-[15px] mb-1">{log.content}</div>
                       <div className="flex items-center gap-2 text-xs notion-text-subtle font-mono">
                         <span className="bg-gray-200 px-1.5 py-0.5 rounded text-[10px]">{JSON.parse(log.metadata || '{}').hash?.substring(0, 7) || '---'}</span>
                         <span>{JSON.parse(log.metadata || '{}').author || t.unknown_author}</span>
                         <span>•</span>
                         <span>{new Date(log.timestamp).toLocaleDateString(appLang)} {new Date(log.timestamp).toLocaleTimeString(appLang, { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
              {dbLogs.filter(log => log.type === "git").length === 0 && (
                <p className="notion-text-subtle italic">{t.no_git_history}</p>
              )}
            </div>
          )}

          {activeTab === "progress" && (
            <div className="animate-fade-in space-y-6">
              <div className="group relative pl-6 border-l-2 border-(--theme-primary-bg) hover:border-(--theme-primary) transition-colors">
                 <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-(--theme-primary-bg) group-hover:border-(--theme-primary) transition-colors flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-(--theme-primary) opacity-30 group-hover:opacity-100 transition-opacity" />
                 </div>
                 
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
                 
                 <div className="bg-white notion-card p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <article className="prose prose-slate max-w-none text-gray-700 leading-relaxed">
                       <div className="markdown-content">
                          <ReactMarkdown>
                            {progressLang === 'ja' ? (progressTranslated || "翻訳中...") : (progress?.task || t.loading_progress)}
                          </ReactMarkdown>
                       </div>
                    </article>
                 </div>
              </div>
            </div>
          )}

          {activeTab === "calendar" && renderContributionGraph()}

          {activeTab === "daily_notes" && (
            <div className="animate-fade-in">
              <DailyNotes 
                notes={dailyNotes} 
                isJapanesePluginEnabled={!!settings?.ENABLED_PLUGINS?.includes('plugin-jp')} 
              />
            </div>
          )}

          {activeTab === "suggested_tasks" && (
            <div className="animate-fade-in">
              <SuggestedTasks 
                tasks={suggestedTasks} 
                onAdd={(t) => updateSuggestedTaskStatus(t.id, 'added', t.task)}
                onDismiss={(t) => updateSuggestedTaskStatus(t.id, 'dismissed')}
                onUpdateStatus={(t, status) => updateSuggestedTaskStatus(t.id, status, t.task)}
                onManualAdd={handleManualAddTask}
              />
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
