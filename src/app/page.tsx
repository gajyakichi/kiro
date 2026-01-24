"use client";

import { Progress, Comment, DbLog, Project, Theme, DailyNote, SuggestedTask, Vault } from "@/lib/types";
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { IconRenderer } from '@/components/IconRenderer';
import { IconPicker } from '@/components/IconPicker';
import { ThemeLab } from '@/components/ThemeLab';
import { Sparkles, PenTool, AlignLeft, FileText, Code, ShieldAlert, PlusCircle, Plus, Folder } from 'lucide-react';
import DailyNotes from '@/components/DailyNotes';
import SuggestedTasks from '@/components/SuggestedTasks';
import MarkdownEditor from '@/components/MarkdownEditor';
import { VaultSwitcher } from '@/components/VaultSwitcher';
import { getTranslation, Translations } from '@/lib/i18n';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [dbLogs, setDbLogs] = useState<DbLog[]>([]);
  const [newComment, setNewComment] = useState("");
  const [activeBlockType, setActiveBlockType] = useState<'markdown' | 'text' | 'code'>('markdown');
  const [activeTab, setActiveTab] = useState("git");
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [iconPickerTarget, setIconPickerTarget] = useState<string | null>(null); // 'add' | 'header'
  const [themes, setThemes] = useState<Theme[]>([]);
  const [previewCss, setPreviewCss] = useState("");
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [isAbsorbing, setIsAbsorbing] = useState(false);
  const [isFullEditorOpen, setIsFullEditorOpen] = useState(false);
  
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isVaultLoading, setIsVaultLoading] = useState(true);
  const [appLang, setAppLang] = useState("en");
  const [appIconSet, setAppIconSet] = useState("lucide");
  const [settings, setSettings] = useState<any>(null); // To store full settings object if needed

  // New Workspace State
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false);
  const [newWName, setNewWName] = useState("");
  const [newWPath, setNewWPath] = useState("");
  const [isCreatingW, setIsCreatingW] = useState(false);

  // Heatmap State
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null);

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
      const res = await fetch(`/api/absorb/data?projectId=${projectId}`);
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
        method: 'POST',
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
        fetchAbsorbData(activeProject.id);
      }
    } catch (e) {
      console.error("Absorb Error:", e);
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

  const handleSaveTheme = async (name: string, css: string) => {
    try {
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, css })
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
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-0.5 hover:bg-gray-100 rounded text-gray-400">‹</button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-0.5 hover:bg-gray-100 rounded text-gray-400">›</button>
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
      ...dbLogs.map(l => ({ ...l, dateStr: new Date(l.timestamp).toISOString().split('T')[0] })),
      ...comments.map(c => ({ ...c, dateStr: new Date(c.timestamp).toISOString().split('T')[0], type: 'note' }))
    ];

    type ActivityEntry = (typeof aggregatedData)[0];
    const activityMap = aggregatedData.reduce((acc: Record<string, ActivityEntry[]>, item) => {
      if (!acc[item.dateStr]) acc[item.dateStr] = [];
      acc[item.dateStr].push(item);
      return acc;
    }, {});

    const getColor = (count: number) => {
      if (count === 0) return 'bg-neutral-50 border border-neutral-100/50';
      if (count <= 2) return 'bg-emerald-100 border border-emerald-200';
      if (count <= 5) return 'bg-emerald-300 border border-emerald-400';
      if (count <= 10) return 'bg-emerald-500 border border-emerald-600';
      return 'bg-emerald-700 border border-emerald-800';
    };

    const weeks = [];
    const current = new Date(startDate);

    for (let i = 0; i < 53; i++) {
      const days = [];
      for (let j = 0; j < 7; j++) {
        const dStr = current.toISOString().split('T')[0];
        const dayData = activityMap[dStr] || [];
        days.push({
          date: new Date(current),
          dateStr: dStr,
          data: dayData
        });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(days);
    }

    return (
      <div className="animate-fade-in space-y-8">
        <div className="bg-white border border-(--border-color) p-8 rounded-3xl shadow-sm">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight">{t.system_calendar}</h2>
              <p className="text-sm notion-text-subtle">{t.calendar_desc}</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-100">
              <span>{t.less}</span>
              <div className="flex gap-1">
                {[0, 2, 5, 10, 15].map(v => <div key={v} className={`w-3 h-3 rounded-sm ${getColor(v)}`} />)}
              </div>
              <span>{t.more}</span>
            </div>
          </div>

          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex gap-1.5 min-w-max">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1.5">
                  {week.map((day, di) => (
                    <button
                      key={di}
                      onClick={() => setSelectedHeatmapDate(day.dateStr)}
                      title={t.activity_level.replace('{count}', day.data.length.toString()).replace('{date}', day.dateStr)}
                      className={`w-4 h-4 rounded-sm transition-all hover:scale-125 hover:z-10 ${getColor(day.data.length)} ${selectedHeatmapDate === day.dateStr ? 'ring-2 ring-(--theme-primary) ring-offset-2' : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

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
            
            <div className="space-y-4">
              {(activityMap[selectedHeatmapDate] || []).map((entry, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-(--border-color) shadow-xs flex gap-5 group hover:shadow-md transition-all">
                   <div className="shrink-0 w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-(--theme-primary-bg) group-hover:text-(--theme-primary) transition-colors">
                      {'type' in entry && entry.type === 'git' ? <Code size={18} /> : <FileText size={18} />}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                        {('type' in entry && entry.type === 'git') ? t.type_git : t.type_note}
                      </div>
                      <div className="text-[15px] font-medium leading-relaxed">
                        {'content' in entry ? entry.content : 'text' in entry ? entry.text : ''}
                      </div>
                      {('metadata' in entry && entry.metadata) && (
                        <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                          <span className="bg-neutral-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            {JSON.parse(entry.metadata as string).hash?.substring(0, 7) || '---'}
                          </span>
                          <span>•</span>
                          <span>{JSON.parse(entry.metadata as string).author || t.unknown_author}</span>
                        </div>
                      )}
                   </div>
                </div>
              ))}
              {(activityMap[selectedHeatmapDate]?.length === 0) && (
                <div className="py-12 text-center">
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
      <aside className="w-64 notion-sidebar flex flex-col pt-8 pb-4 px-3 sticky top-0 h-screen overflow-y-auto">
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

        <nav className="flex-1 space-y-1">
          <div 
            onClick={() => setActiveTab("git")}
            className={`notion-item flex items-center gap-3 ${activeTab === "git" ? "active" : ""}`}
          >
            <span>📜</span>
            <span>{t.git_logs}</span>
          </div>
          
          <div 
            onClick={() => setActiveTab("progress")}
            className={`notion-item flex items-center gap-3 ${activeTab === "progress" ? "active" : ""}`}
          >
            <span>✅</span>
            <span>{t.progress}</span>
          </div>

          <div 
            onClick={() => setActiveTab("daily_notes")}
            className={`notion-item flex items-center gap-3 ${activeTab === "daily_notes" ? "active" : ""}`}
          >
            <span>✨</span>
            <div className="flex-1 flex justify-between items-center">
              <span>{t.daily_notes}</span>
              {dailyNotes.length > 0 && <span className="text-[10px] bg-(--theme-primary-bg) text-(--theme-primary) px-1.5 rounded-full font-bold">{dailyNotes.length}</span>}
            </div>
          </div>

          <div 
            onClick={() => setActiveTab("suggested_tasks")}
            className={`notion-item flex items-center gap-3 ${activeTab === "suggested_tasks" ? "active" : ""}`}
          >
            <span>💡</span>
            <div className="flex-1 flex justify-between items-center">
              <span>{t.suggestions}</span>
              {suggestedTasks.length > 0 && <span className="text-[10px] bg-(--theme-accent-bg) text-(--theme-accent) px-1.5 rounded-full font-bold">{suggestedTasks.length}</span>}
            </div>
          </div>

          <div 
            onClick={() => setActiveTab("calendar")}
            className={`notion-item flex items-center gap-3 ${activeTab === "calendar" ? "active" : ""}`}
          >
            <span>📅</span>
            <span>{t.calendar}</span>
          </div>

          <div 
            onClick={() => setActiveTab("comments")}
            className={`notion-item flex items-center gap-3 ${activeTab === "comments" ? "active" : ""}`}
          >
            <span>📝</span>
            <div className="flex-1 flex justify-between items-center">
              <span>{t.notes}</span>
              <span className="text-xs notion-text-subtle">{comments.length}</span>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab("themes")}
            className={`notion-item flex items-center gap-3 ${activeTab === "themes" ? "active" : ""}`}
          >
            <span className="animate-pulse">✨</span>
            <span>{t.theme_lab}</span>
          </div>

          <Link 
            href="/settings"
            className="notion-item flex items-center gap-3 no-underline text-inherit"
          >
            <span>⚙️</span>
            <span>{t.settings}</span>
          </Link>
        </nav>

        {renderMiniCalendar()}

        {/* Vault Switcher Integration */}
        <div className="mt-8 pt-4 border-t border-(--border-color)">
          <div className="text-[10px] font-bold notion-text-subtle uppercase tracking-widest px-2 mb-2">{t.active_storage}</div>
          <VaultSwitcher appLang={appLang} onSwitch={fetchProjects} className="px-2" />
        </div>

        <div className="mt-auto px-2 pt-4 border-t border-(--border-color)">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-[10px] text-gray-500 uppercase tracking-widest bg-gray-100/50 w-fit px-2 py-0.5 rounded">{t.quick_note}</div>
            <div className="flex gap-1.5 bg-gray-100/30 p-1 rounded-lg border border-gray-100/50">
              <button 
                onClick={() => setActiveBlockType('text')}
                className={`p-1 rounded transition-all ${activeBlockType === 'text' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Text"
              >
                <AlignLeft size={12} />
              </button>
              <button 
                onClick={() => setActiveBlockType('markdown')}
                className={`p-1 rounded transition-all ${activeBlockType === 'markdown' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Markdown"
              >
                <FileText size={12} />
              </button>
              <button 
                onClick={() => setActiveBlockType('code')}
                className={`p-1 rounded transition-all ${activeBlockType === 'code' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Code"
              >
                <Code size={12} />
              </button>
            </div>
          </div>
          <textarea 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full bg-white border border-(--border-color) rounded-md p-2 text-sm focus:outline-none focus:border-gray-400 h-20 mb-2 resize-none text-neutral-800 placeholder:text-neutral-400 font-medium"
            placeholder={activeBlockType === 'code' ? t.placeholder_code : activeBlockType === 'markdown' ? t.placeholder_markdown : t.placeholder_text}
          />
          <button 
            onClick={handleAddComment}
            className="w-full bg-foreground text-background hover:opacity-90 font-medium py-1.5 rounded-md transition-colors text-xs flex items-center justify-center gap-2"
          >
            {activeBlockType === 'code' && <Code size={12} />}
            {activeBlockType === 'markdown' && <FileText size={12} />}
            {activeBlockType === 'text' && <AlignLeft size={12} />}
            {t.add_block.replace('{type}', (t[`type_${activeBlockType}` as keyof Translations] as string) || activeBlockType)}
          </button>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto p-12 lg:px-20 xl:px-40">
        <header className="mb-12 animate-fade-in relative z-50">
          <h1 className="group relative flex items-center text-4xl font-bold tracking-tight mb-2">
            <div className="relative mr-4">
              <div 
                onClick={() => setIconPickerTarget('header')}
                className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-100 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
              >
                {activeProject?.icon ? (
                    <IconRenderer icon={activeProject.icon} size={32} baseSet={appIconSet} />
                ) : (
                    <span className="text-2xl opacity-20">◦</span>
                )}
              </div>
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
            </span>
            {activeProject && <span className="text-lg ml-4 opacity-30 font-normal">/ {activeProject.name}</span>}
            
            {activeProject && (
              <button 
                onClick={handleAbsorb}
                disabled={isAbsorbing}
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
          </p>
        </header>

        <section className="animate-fade-in">
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
            <div key="progress-content" className="prose prose-slate max-w-none">
              <div className="markdown-content">
                <ReactMarkdown>
                  {progress?.task || t.loading_progress}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {activeTab === "calendar" && renderContributionGraph()}

          {activeTab === "daily_notes" && (
            <div className="animate-fade-in">
              <DailyNotes notes={dailyNotes} />
            </div>
          )}

          {activeTab === "suggested_tasks" && (
            <div className="animate-fade-in">
              <SuggestedTasks 
                tasks={suggestedTasks} 
                onAdd={(t) => updateSuggestedTaskStatus(t.id, 'added', t.task)}
                onDismiss={(t) => updateSuggestedTaskStatus(t.id, 'dismissed')}
              />
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-6">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{t.project_timeline}</h2>
                  <p className="text-sm text-gray-500">{t.timeline_desc}</p>
                </div>
                {!isFullEditorOpen && (
                  <button 
                    onClick={() => setIsFullEditorOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-(--border-color) rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm group"
                  >
                    <PenTool size={14} className="text-blue-500 group-hover:rotate-12 transition-transform" />
                    {t.add_note}
                  </button>
                )}
              </div>

              {isFullEditorOpen ? (
                <MarkdownEditor 
                  value={newComment}
                  onChange={setNewComment}
                  onCancel={() => setIsFullEditorOpen(false)}
                  onSave={() => {
                    handleAddComment();
                    setIsFullEditorOpen(false);
                  }}
                />
              ) : (
                <div key="unified-timeline" className="relative">
                  {/* Vertical Timeline Guide */}
                  <div className="absolute left-[18px] top-6 bottom-6 w-px bg-(--border-color) opacity-50 z-0"></div>

                  <div className="space-y-0 relative z-10">
                    {[
                      ...dbLogs.map(l => ({ ...l, entryType: 'log' as const })),
                      ...comments.map(c => ({ ...c, entryType: 'comment' as const }))
                    ]
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((entry) => {
                      const isLog = entry.entryType === 'log';
                      const type = isLog ? (entry as DbLog).type : (entry as Comment).type;
                      const content = isLog ? (entry as DbLog).content : (entry as Comment).text;
                      const timestamp = new Date(entry.timestamp);

                      return (
                        <div key={`${entry.entryType}-${entry.id}`} className="group relative">
                          <div className="flex gap-6 items-start py-6 -mx-4 px-4 hover:bg-gray-50/50 rounded-2xl transition-all">
                            {/* Marker Icon */}
                            <div className="shrink-0 w-9 h-9 rounded-xl bg-(--theme-primary-bg) border border-(--border-color) flex items-center justify-center text-(--theme-primary) shadow-sm group-hover:scale-110 transition-transform">
                              {type === 'git' && <Code size={16} />}
                              {type === 'task' && <span>✅</span>}
                              {type === 'walkthrough' && <span>✨</span>}
                              {type === 'markdown' && <FileText size={16} />}
                              {type === 'code' && <Code size={16} />}
                              {type === 'text' && <AlignLeft size={16} />}
                              {(!type || type === 'unknown' || type === 'note') && <span className="text-[10px] font-bold">{t.entry_marker}</span>}
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Metadata Header */}
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] bg-(--theme-primary) text-white px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider shadow-sm">
                                  {type === 'git' ? t.type_git : 
                                   type === 'task' ? t.type_task : 
                                   type === 'walkthrough' ? t.type_walkthrough : 
                                   type === 'code' ? t.type_code : 
                                   type === 'markdown' ? t.type_markdown : t.type_note}
                                </span>
                                <span className="text-[10px] notion-text-subtle font-bold uppercase tracking-widest bg-(--theme-primary-bg) px-2.5 py-1 rounded-lg border border-(--border-color)">
                                  {timestamp.toLocaleDateString(appLang)} {timestamp.toLocaleTimeString(appLang, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              {/* Content Area - WordPress Block Style */}
                              <div className={`mt-3 ${type === 'git' ? 'py-1' : ''}`}>
                                {type === 'git' ? (
                                  <div>
                                    <p className="text-[15px] font-medium leading-relaxed">{content}</p>
                                    <div className="mt-2 flex items-center gap-2 text-[10px] notion-text-subtle font-mono">
                                      <span className="bg-(--theme-primary-bg) px-1.5 py-0.5 rounded border border-(--border-color)">
                                        {JSON.parse((entry as DbLog).metadata || '{}').hash?.substring(0, 7) || '---'}
                                      </span>
                                      <span>{JSON.parse((entry as DbLog).metadata || '{}').author || t.unknown_author}</span>
                                    </div>
                                  </div>
                                ) : type === 'code' ? (
                                  <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-inner my-2">
                                    <pre className="text-sm font-mono text-emerald-400 overflow-x-auto p-0 m-0 bg-transparent border-none">
                                      <code>{content}</code>
                                    </pre>
                                  </div>
                                ) : (
                                  <div className="markdown-content">
                                    <ReactMarkdown>
                                      {content}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {comments.length === 0 && dbLogs.length === 0 && (
                      <p className="notion-text-subtle italic text-center py-20">{t.no_activity}</p>
                    )}
                  </div>
                </div>
              )}
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
      </main>

      <style key={themes.find(t => t.active)?.id || 'original'} dangerouslySetInnerHTML={{ __html: `
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
