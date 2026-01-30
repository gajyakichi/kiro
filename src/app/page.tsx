"use client";

import { Progress, Comment, DbLog, Project, Theme, DailyNote, SuggestedTask, Vault, ConversationLog } from "@/lib/types";
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
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
const ProjectSwitcher = dynamic(() => import('@/components/ProjectSwitcher').then(mod => mod.ProjectSwitcher), { ssr: false });
const InlineChatBox = dynamic(() => import('@/components/InlineChatBox').then(mod => mod.InlineChatBox), { ssr: false });
const AnnotationMenu = dynamic(() => import('@/components/AnnotationMenu').then(mod => mod.AnnotationMenu), { ssr: false });
const InlineMemoEditor = dynamic(() => import('@/components/InlineMemoEditor').then(mod => mod.InlineMemoEditor), { ssr: false });
const SuggestedTasks = dynamic(() => import('@/components/SuggestedTasks'), { ssr: false });


import { Sparkles, ShieldAlert, PlusCircle, Plus, Folder, FolderGit2, ChevronRight, Edit2, Trash2, Languages, Loader2, Check, AlertTriangle, HelpCircle, Search } from 'lucide-react';
import { getTranslation } from '@/lib/i18n';

type TimelineEntry = {
  id: number;
  entryType: 'log' | 'comment' | 'task' | 'daily_note' | 'conversation';
  timestamp: string;
  content: string;
  metadata?: string;
  status?: string;
  type?: string;
  agent?: string; // For conversation entries
};

type TimelineFilter = 'all' | 'log' | 'comment' | 'task' | 'daily_note' | 'conversation';

interface Metadata {
  hash?: string;
  author?: string;
  sourceType?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// Helper function to clean HTML tags from markdown content
function cleanMarkdownContent(content: string): string {
  return content
    .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> tags to newlines
    .replace(/<[^>]+>/g, '');        // Remove all other HTML tags
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  const [dbLogs, setDbLogs] = useState<DbLog[]>([]);
  // Removed unused comment editing state
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingType, setEditingType] = useState<'markdown' | 'block'>('markdown');
  
  // Timeline State
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all');
  const [timelineSearch, setTimelineSearch] = useState("");
  
  // Delete Confirmation State (inline, not full-screen)
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  
  const handleDeleteComment = async (id: number) => {
    if (deletingCommentId === id) {
      // User confirmed deletion
      try {
        // Optimistic update
        setComments(prev => prev.filter(c => c.id !== id));
        setDeletingCommentId(null);
        
        const res = await fetch(`/api/comments?id=${id}`, { method: 'DELETE' });
        if (!res.ok) {
          throw new Error("Failed to delete");
        }
        
        if (activeProject) {
           const commentRes = await fetch(`/api/comments?projectId=${activeProject.id}`);
           const commentData = await commentRes.json();
           setComments(commentData);
           fetchAbsorbData(activeProject.id);
        }
      } catch (e) {
        console.error(e);
        setDialogState({
          open: true,
          title: appLang === 'ja' ? 'エラー' : 'Error',
          message: appLang === 'ja' 
            ? `コメントの削除に失敗しました: ${(e as Error).message}` 
            : `Failed to delete comment: ${(e as Error).message}`,
          type: 'error'
        });
        // Revert on error - would need to re-fetch to restore
        if (activeProject) {
          const commentRes = await fetch(`/api/comments?projectId=${activeProject.id}`);
          const commentData = await commentRes.json();
          setComments(commentData);
        }
      }
      // First click - show confirmation
      setDeletingCommentId(id);
    }
  };

  const handleUpdateComment = async () => {
    if (!editingCommentId) return;
    try {
      await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCommentId, text: editingContent, type: editingType })
      });
      setEditingCommentId(null);
      setEditingContent("");
      setEditingType('markdown');
      if (activeProject) fetchAbsorbData(activeProject.id);
    } catch (e) {
      console.error(e);
    }
  };

  const startEditingComment = (id: number, currentText: string, type: string | undefined) => {
      setEditingCommentId(id);
      setEditingContent(currentText);
      setEditingType(type === 'block' ? 'block' : 'markdown');
  };
  const [activeTab, setActiveTab] = useState("timeline");
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [iconPickerTarget, setIconPickerTarget] = useState<string | null>(null); // 'add' | 'header'
  const [themes, setThemes] = useState<Theme[]>([]);
  const [previewCss, setPreviewCss] = useState("");
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const [isAbsorbing, setIsAbsorbing] = useState(false);
  const [conversationLogs, setConversationLogs] = useState<ConversationLog[]>([]);

  
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [isVaultLoading, setIsVaultLoading] = useState(true);
  const [appLang, setAppLang] = useState("en");
  const [appIconSet, setAppIconSet] = useState("lucide");
  const [appSkin, setAppSkin] = useState("notion");
  const [settings, setSettings] = useState<Record<string, string | undefined> | null>(null); // To store full settings object if needed



  // Dialog State
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ open: false, type: 'success', title: '', message: '' });

  // Selected Date for Timeline Filtering
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // AI Chat State
  const [chatState, setChatState] = useState<{ 
    open: boolean; 
    targetId: string | null; 
    context: string; 
    title: string;
    mode: 'menu' | 'ai' | 'memo';
  }>({ open: false, targetId: null, context: "", title: "", mode: 'menu' });

  const handleOpenChat = (targetId: string, context: string, title: string) => {
      setChatState(prev => prev.targetId === targetId && prev.open 
        ? { open: false, targetId: null, context: "", title: "", mode: 'menu' }
        : { open: true, targetId, context, title, mode: 'menu' }
      );
  };
  
  const handleSaveMemo = async (content: string, editorType: 'markdown' | 'block') => {
    if (!activeProject) return;
    
    try {
      // Extract source entry info from chatState.targetId
      let sourceType = null;
      let sourceId = null;
      if (chatState.targetId && chatState.targetId !== 'current-status') {
        const parts = chatState.targetId.split('-');
        if (parts.length >= 2) {
          sourceType = parts[0]; // 'log', 'daily_note', etc.
          sourceId = parts.slice(1).join('-');
        }
      }
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: activeProject.id, 
          text: content, 
          type: editorType === 'block' ? 'block' : 'markdown',
          metadata: sourceType ? JSON.stringify({ sourceType, sourceId }) : null
        })
      });
      if (response.ok) {
        // Refetch all comments to ensure proper sorting
        const commentRes = await fetch(`/api/comments?projectId=${activeProject.id}`);
        const commentData = await commentRes.json();
        setComments(commentData);
        
        setChatState(prev => ({ ...prev, open: false, targetId: null }));
      }
    } catch (e) {
      console.error('Failed to save memo:', e);
    }
  };

  // Heatmap State


  // Progress Translation State (with localStorage persistence)
  const [progressLang, setProgressLang] = useState<'en' | 'ja'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('progressLang') as 'en' | 'ja') || 'en';
    }
    return 'en';
  });
  const [progressTranslated, setProgressTranslated] = useState<string | null>(null);
  const [isTranslatingProgress, setIsTranslatingProgress] = useState(false);

  // Tasks Translation State (Japanese Plugin Feature, with localStorage persistence)
  const [tasksLang, setTasksLang] = useState<'en' | 'ja'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('tasksLang') as 'en' | 'ja') || 'en';
    }
    return 'en';
  });
  const [tasksTranslated, setTasksTranslated] = useState<{ [key: number]: string }>({});
  const [isTranslatingTasks, setIsTranslatingTasks] = useState(false);

  // Daily Report Translation State (Japanese Plugin Feature, with localStorage persistence)
  const [dailyReportLang, setDailyReportLang] = useState<'en' | 'ja'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('dailyReportLang') as 'en' | 'ja') || 'en';
    }
    return 'en';
  });
  const [dailyReportTranslated, setDailyReportTranslated] = useState<string | null>(null);
  const [isTranslatingDailyReport, setIsTranslatingDailyReport] = useState(false);


  const handleToggleProgressLang = async () => {
    if (progressLang === 'ja') {
        setProgressLang('en');
        localStorage.setItem('progressLang', 'en');
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
                    localStorage.setItem('progressLang', 'ja');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsTranslatingProgress(false);
            }
        } else if (progressTranslated) {
            setProgressLang('ja');
            localStorage.setItem('progressLang', 'ja');
        }
    }
  };

  // Tasks Language Toggle Handler (Japanese Plugin Feature)
  const handleToggleTasksLang = async () => {
    if (tasksLang === 'ja') {
        setTasksLang('en');
        localStorage.setItem('tasksLang', 'en');
    } else {
        // Translate all active tasks that haven't been translated yet
        const tasksToTranslate = suggestedTasks.filter(t => !tasksTranslated[t.id]);
        if (tasksToTranslate.length > 0) {
            setIsTranslatingTasks(true);
            try {
                const translations: { [key: number]: string } = { ...tasksTranslated };
                for (const task of tasksToTranslate) {
                    const res = await fetch('/api/translate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: task.task, targetLang: 'ja' })
                    });
                    const data = await res.json();
                    if (data.translated) {
                        translations[task.id] = data.translated;
                    }
                }
                setTasksTranslated(translations);
                setTasksLang('ja');
                localStorage.setItem('tasksLang', 'ja');
            } catch (e) {
                console.error('Failed to translate tasks:', e);
            } finally {
                setIsTranslatingTasks(false);
            }
        } else {
            setTasksLang('ja');
            localStorage.setItem('tasksLang', 'ja');
        }
    }
  };

  // Daily Report Language Toggle Handler (Japanese Plugin Feature)
  const handleToggleDailyReportLang = async () => {
    if (dailyReportLang === 'ja') {
        setDailyReportLang('en');
        localStorage.setItem('dailyReportLang', 'en');
    } else {
        if (!dailyReportTranslated && selectedDailyNote?.content) {
            setIsTranslatingDailyReport(true);
            try {
                const res = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: selectedDailyNote.content, targetLang: 'ja' })
                });
                const data = await res.json();
                if (data.translated) {
                    setDailyReportTranslated(data.translated);
                    setDailyReportLang('ja');
                    localStorage.setItem('dailyReportLang', 'ja');
                }
            } catch (e) {
                console.error('Failed to translate daily report:', e);
            } finally {
                setIsTranslatingDailyReport(false);
            }
        } else if (dailyReportTranslated) {
            setDailyReportLang('ja');
            localStorage.setItem('dailyReportLang', 'ja');
        }
    }
  };

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
      if (data.APP_LANG) setAppLang(data.APP_LANG);
      if (data.APP_LANG) setAppLang(data.APP_LANG);
      if (data.APP_ICON_SET) setAppIconSet(data.APP_ICON_SET);
      if (data.APP_SKIN) setAppSkin(data.APP_SKIN);
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

  const fetchConversationLogs = useCallback(async (projectId: number) => {
    try {
      const res = await fetch(`/api/conversations?projectId=${projectId}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      setConversationLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Conversation Logs Fetch Error:", e);
      setConversationLogs([]); // Ensure it's always an array on error
    }
  }, []);


  const fetchData = useCallback(async (projectId: number) => {
    try {
      const syncRes = await fetch('/api/sync', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      
      if (!syncRes.ok) {
        console.warn('Sync POST failed:', await syncRes.text());
      }
      
      const dbLogsRes = await fetch(`/api/sync?projectId=${projectId}`);
      if (dbLogsRes.ok) {
        const logsData = await dbLogsRes.json();
        setDbLogs(logsData);
      } else {
        console.warn('Sync GET failed:', await dbLogsRes.text());
        setDbLogs([]);
      }

      const progRes = await fetch(`/api/progress?projectId=${projectId}`); 
      const progData = await progRes.json();
      setProgress(progData);

      const commentRes = await fetch(`/api/comments?projectId=${projectId}`);
      const commentData = await commentRes.json();
      setComments(commentData);

      fetchAbsorbData(projectId);
      fetchConversationLogs(projectId);
    } catch (e) {
      console.error("Fetch Error:", e);
    }
  }, [fetchAbsorbData, fetchConversationLogs]);

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
      })),
      ...(Array.isArray(conversationLogs) ? conversationLogs.map(conv => ({
        id: conv.id,
        entryType: 'conversation' as const,
        timestamp: new Date(conv.timestamp).toISOString(),
        content: conv.summary,
        agent: conv.agent,
        metadata: conv.full_text || undefined
      })) : [])
    ];

    return raw
      .filter(item => {
        if (timelineFilter !== 'all' && item.entryType !== timelineFilter) return false;
        if (selectedDate) {
          const itemDate = new Date(item.timestamp);
          const isSameDay = itemDate.getFullYear() === selectedDate.getFullYear() &&
                           itemDate.getMonth() === selectedDate.getMonth() &&
                           itemDate.getDate() === selectedDate.getDate();
          if (!isSameDay) return false;
        }
        if (timelineSearch) {
          const searchLower = timelineSearch.toLowerCase();
          const content = item.content || "";
          const meta = item.metadata || "";
          const combinedText = (content + " " + meta).toLowerCase();
          
          // Fuzzy search: check if all characters in search term appear in order
          let searchIndex = 0;
          for (let i = 0; i < combinedText.length && searchIndex < searchLower.length; i++) {
            if (combinedText[i] === searchLower[searchIndex]) {
              searchIndex++;
            }
          }
          // Match if all characters were found in order
          return searchIndex === searchLower.length;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [dbLogs, comments, dailyNotes, suggestedTasks, conversationLogs, timelineFilter, timelineSearch, selectedDate]);

  // Get daily note for selected date or today
  const selectedDailyNote = useMemo(() => {
    const targetDate = selectedDate || new Date();
    
    // Format as YYYY-MM-DD in local timezone
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return dailyNotes.find(note => {
      const noteDate = new Date(note.date);
      const noteYear = noteDate.getFullYear();
      const noteMonth = String(noteDate.getMonth() + 1).padStart(2, '0');
      const noteDay = String(noteDate.getDate()).padStart(2, '0');
      const noteDateString = `${noteYear}-${noteMonth}-${noteDay}`;
      return noteDateString === dateString;
    });
  }, [dailyNotes, selectedDate]);

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

  /* Removed handleAddComment as it is no longer used */

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

  const handleTaskStatusUpdate = async (task: SuggestedTask, status: string) => {
    // Optimistic update
    const oldTasks = [...suggestedTasks];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSuggestedTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: status as any } : t));

    try {
        await fetch('/api/absorb/tasks', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: task.id, status })
        });
    } catch (e) {
        console.error(e);
        setSuggestedTasks(oldTasks); // Rollback
    }
  };

  const handleManualTaskAdd = async (text: string) => {
    if (!activeProject) return;
    try {
        const res = await fetch('/api/absorb/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: activeProject.id, task: text })
        });
        const data = await res.json();
        if (data.success && data.task) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
           setSuggestedTasks(prev => [data.task as any, ...prev]);
        }
    } catch (e) {
        console.error(e);
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
        // Also refresh progress data to update Current Status section
        const progRes = await fetch(`/api/progress?projectId=${activeProject.id}`); 
        const progData = await progRes.json();
        setProgress(progData);
        
        // Automatically generate/update walkthrough after successful Absorb
        try {
          const walkthroughRes = await fetch('/api/generate-walkthrough', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: activeProject.id })
          });
          if (walkthroughRes.ok) {
            console.log('Walkthrough automatically updated');
          }
        } catch (walkthroughError) {
          // Don't fail Absorb if walkthrough generation fails
          console.warn('Walkthrough generation failed:', walkthroughError);
        }
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Absorbに失敗しました");
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



  const handleToggleAppLang = () => {
    const newLang = appLang === 'en' ? 'ja' : 'en';
    setAppLang(newLang);
    handleUpdateSettings({ APP_LANG: newLang });
  };

  const handleUpdateSettings = async (newSettings: Partial<Record<string, string>>) => {
    // Optimistic state updates
    if (newSettings.APP_LANG) setAppLang(newSettings.APP_LANG);
    if (newSettings.APP_LANG) setAppLang(newSettings.APP_LANG);
    if (newSettings.APP_ICON_SET) setAppIconSet(newSettings.APP_ICON_SET);
    if (newSettings.APP_SKIN) setAppSkin(newSettings.APP_SKIN);
    
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
      if (oldSettings?.APP_LANG) setAppLang(oldSettings.APP_LANG);
      if (oldSettings?.APP_ICON_SET) setAppIconSet(oldSettings.APP_ICON_SET);
      if (oldSettings?.APP_SKIN) setAppSkin(oldSettings.APP_SKIN);
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
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-0.5 hover:bg-(--hover-bg) rounded text-gray-400" aria-label="Previous month">‹</button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-0.5 hover:bg-(--hover-bg) rounded text-gray-400" aria-label="Next month">›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px text-[10px] text-center">
          {t.days_short[0] === 'Sun' 
            ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={`${d}-${i}`} className="py-1 text-gray-400 font-medium">{d}</div>)
            : t.days_short.map((d, i) => <div key={`${d}-${i}`} className="py-1 text-gray-400 font-medium">{d}</div>)
          }
          {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: days }, (_, i) => i + 1).map(day => {
            const dayDate = new Date(year, month, day);
            const isSelected = selectedDate && 
              selectedDate.getFullYear() === year &&
              selectedDate.getMonth() === month &&
              selectedDate.getDate() === day;
            
            return (
              <div 
                key={day} 
                onClick={() => {
                  if (isSelected) {
                    setSelectedDate(null); // Toggle off if already selected
                  } else {
                    setSelectedDate(dayDate);
                  }
                }}
                className={`mini-calendar-day py-1 rounded-sm transition-colors cursor-pointer ${
                  isSelected 
                    ? 'bg-(--theme-primary) text-(--background) font-bold ring-2 ring-(--theme-primary) ring-opacity-50' 
                    : activityDays.has(day) 
                      ? 'bg-(--theme-primary-bg) text-(--theme-primary) font-bold hover:bg-(--theme-primary) hover:text-(--background)' 
                      : 'text-gray-500 hover:bg-(--hover-bg)'
                }`}
              >
                {day}
              </div>
            );
          })}
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
    <div className={`flex h-screen overflow-hidden text-[14px] ${((previewCss || themes.some(t => t.active))) ? 'theme-active' : ''}`} data-skin={appSkin}>
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
      <aside className="w-80 notion-sidebar flex flex-col pt-8 pb-4 px-3 sticky top-0 h-screen bg-(--sidebar-bg) border-r border-(--border-color)">
        <div className="mb-2 shrink-0 relative z-50">
          <div className="px-2 mt-4">
            <div className="flex items-center justify-between mb-2">
               {settings?.ENABLED_PLUGINS?.includes('plugin-jp') && (
                   <button
                     onClick={handleToggleAppLang}
                     className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-(--foreground) opacity-40 hover:opacity-100 hover:bg-(--hover-bg) rounded transition-all"
                     title={appLang === 'en' ? 'Switch to Japanese' : '英語に切り替え'}
                   >
                     <Languages size={14} />
                     <span>{appLang === 'en' ? 'EN' : 'JA'}</span>
                   </button>
               )}
            </div>
          </div>
          
          {/* Vault & Project Management Zone */}
          <div className="space-y-4 mt-2 mb-2">
            {/* 1. Vault (Storage Root) */}
            <div className="px-2 relative z-[100]">
               <div className="text-[10px] font-bold notion-text-subtle uppercase tracking-widest mb-1.5 opacity-60 flex items-center gap-1">
                  <Folder size={10} />
                  Vault
               </div>
               <VaultSwitcher />
            </div>

            {/* 2. Project (Active Context) */}
            <div className="px-2 relative z-[50]">
               <div className="text-[10px] font-bold notion-text-subtle uppercase tracking-widest mb-1.5 opacity-60 flex items-center gap-1">
                  <FolderGit2 size={10} />
                  Project
               </div>
               <ProjectSwitcher 
                   activeProjectId={activeProject?.id || -1} 
                   onSwitch={(id) => {
                       const proj = projects.find(p => p.id === id);
                       if (proj) setActiveProject(proj);
                   }} 
               />
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1" role="tablist">
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
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-12 lg:px-20 xl:px-40 custom-scrollbar" style={{ backgroundColor: 'var(--background)' }}>
        <header className="mb-12 animate-fade-in relative z-50 bg-transparent">
          <h1 className="group relative flex items-center text-4xl font-bold tracking-tight mb-2">
            <div className="relative mr-4">
              <button 
                onClick={() => setIconPickerTarget('header')}
                aria-label="Change project icon"
                className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-(--hover-bg) cursor-pointer transition-colors border border-transparent hover:border-(--border-color)"
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
            <span className="text-(--foreground)">
              {activeTab === "timeline" && "Project Timeline"}
              {activeTab === "themes" && t.theme_lab}
            </span>
            {activeProject && <span className="text-lg ml-4 opacity-30 font-normal text-(--foreground)">/ {activeProject.name}</span>}
            
            {activeProject && (
              <>
                <button 
                  onClick={handleAbsorb}
                  disabled={isAbsorbing}
                  aria-busy={isAbsorbing}
                  className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isAbsorbing 
                      ? 'bg-(--hover-bg) text-(--foreground) opacity-50 cursor-not-allowed border border-(--border-color)' 
                      : 'bg-(--background) text-(--foreground) border border-(--border-color) hover:bg-(--hover-bg) shadow-xs'
                  }`}
                  title={settings?.ABSORB_MODE === 'auto' 
                    ? 'Auto mode (uses cache). Click to manually override and regenerate.' 
                    : 'Manual mode - always regenerates analysis'}
                >
                  <Sparkles size={14} className={isAbsorbing ? 'animate-spin' : 'text-(--theme-accent) transition-colors'} />
                  {isAbsorbing ? t.absorbing : (
                    <>
                      {t.absorb_context}
                      {settings?.ABSORB_MODE === 'auto' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-(--theme-primary-bg) text-(--theme-primary) font-bold">
                          Auto
                        </span>
                      )}
                      {settings?.ABSORB_MODE === 'manual' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-bold">
                          Manual
                        </span>
                      )}
                    </>
                  )}
                </button>

              </>
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
                <div className="group relative">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-(--foreground) opacity-60 uppercase tracking-widest">{progressLang === 'ja' ? '現在の状況' : 'Current Status'}</span>
                    </div>
                    {settings?.ENABLED_PLUGINS?.includes('plugin-jp') && (
                        <button
                          onClick={handleToggleProgressLang}
                          disabled={isTranslatingProgress}
                          className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-(--foreground) opacity-40 hover:text-(--theme-primary) hover:bg-(--theme-primary-bg) rounded transition-colors"
                          title={progressLang === 'en' ? 'Switch to Japanese (日本語)' : 'Switch to English (英語)'}
                        >
                          {isTranslatingProgress ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
                          {progressLang === 'en' ? 'JA' : 'EN'}
                        </button>
                    )}
                  </div>
                  
                  <div className="notion-card p-6 rounded-xl border border-(--border-color) shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--card-bg)' }}>
                    <div className="markdown-content">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {progressLang === 'ja' ? (progressTranslated || "翻訳中...") : (progress?.task || t.loading_progress)}
                      </ReactMarkdown>
                    </div>
                  </div>
                  
                  {/* Inline Annotation for Current Status */}
                  {chatState.open && chatState.targetId === 'current-status' && (
                    <>
                      {chatState.mode === 'menu' && (
                        <AnnotationMenu 
                          onSelectAI={() => setChatState(prev => ({ ...prev, mode: 'ai' }))}
                          onSelectMemo={() => setChatState(prev => ({ 
                            ...prev, 
                            mode: 'memo',
                            title: prev.title.replace('Chat about', 'Note about')
                          }))}
                        />
                      )}
                      {chatState.mode === 'ai' && (
                        <InlineChatBox 
                          onClose={() => setChatState(prev => ({ ...prev, open: false, targetId: null, mode: 'menu' }))}
                          initialContext={chatState.context}
                          title={chatState.title}
                          onSaveMemo={async (content) => await handleSaveMemo(content, 'markdown')}
                        />
                      )}
                      {chatState.mode === 'memo' && (
                        <InlineMemoEditor 
                          onClose={() => setChatState(prev => ({ ...prev, open: false, targetId: null, mode: 'menu' }))}
                          onSave={handleSaveMemo}
                          title={chatState.title}
                        />
                      )}
                    </>
                  )}
                </div>

                {/* 1.3. Daily Report */}
                {selectedDailyNote && (
                  <div className="group relative">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-(--foreground) opacity-60 uppercase tracking-widest">{dailyReportLang === 'ja' ? '日報' : 'Daily Report'}</span>
                        <span className="text-xs text-(--foreground) opacity-40">
                          {new Date(selectedDailyNote.timestamp || new Date()).toLocaleDateString(appLang, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {settings?.ENABLED_PLUGINS?.includes('plugin-jp') && (
                          <button
                            onClick={handleToggleDailyReportLang}
                            disabled={isTranslatingDailyReport}
                            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-(--foreground) opacity-40 hover:text-(--theme-primary) hover:bg-(--theme-primary-bg) rounded transition-colors"
                            title={dailyReportLang === 'en' ? 'Switch to Japanese (日本語)' : 'Switch to English (英語)'}
                          >
                            {isTranslatingDailyReport ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
                            {dailyReportLang === 'en' ? 'JA' : 'EN'}
                          </button>
                      )}
                    </div>
                    
                    <div className="notion-card p-6 rounded-xl border border-(--border-color) shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--card-bg)' }}>
                      <div className="markdown-content">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                        >
                          {dailyReportLang === 'ja' && dailyReportTranslated 
                            ? dailyReportTranslated 
                            : (selectedDailyNote.content || "No daily report available yet.")}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1.5. Suggestions & Tasks */}
                <div className="group relative">
                   <div className="mb-2 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <span className="text-sm font-semibold text-(--foreground) opacity-60 uppercase tracking-widest">{tasksLang === 'ja' ? '提案とタスク' : 'Suggestions & Tasks'}</span>
                     </div>
                     {settings?.ENABLED_PLUGINS?.includes('plugin-jp') && (
                         <button
                           onClick={handleToggleTasksLang}
                           disabled={isTranslatingTasks}
                           className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-(--foreground) opacity-40 hover:text-(--theme-primary) hover:bg-(--theme-primary-bg) rounded transition-colors"
                            title={tasksLang === 'en' ? 'Switch to Japanese (日本語)' : 'Switch to English (英語)'}
                         >
                           {isTranslatingTasks ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
                            {tasksLang === 'en' ? 'JA' : 'EN'}
                         </button>
                     )}
                   </div>
                   
                   <div className="notion-card rounded-xl border border-(--border-color) shadow-sm p-6 relative group" style={{ backgroundColor: 'var(--card-bg)' }}>
                      <div className="absolute top-4 right-4 text-(--foreground) opacity-30 group-hover:text-(--foreground) group-hover:opacity-50 transition-colors">
                         <IconRenderer icon="Lightbulb" size={16} baseSet={appIconSet} />
                      </div>
                      <SuggestedTasks 
                         tasks={suggestedTasks}
                         onAdd={(t) => handleTaskStatusUpdate(t, 'added')}
                         onDismiss={(t) => handleTaskStatusUpdate(t, 'dismissed')}
                         onUpdateStatus={(t, s) => handleTaskStatusUpdate(t, s)}
                         onManualAdd={handleManualTaskAdd}
                         displayLang={tasksLang}
                         translatedTasks={tasksTranslated}
                      />
                   </div>
                </div>

                {/* 2. Search & Filter Bar */}
                <div 
                  className="flex flex-col gap-3 sticky top-0 py-4 z-20 border-b border-(--border-color)"
                  style={{ backgroundColor: 'var(--background)' }}
                >
                   {/* Row 1: Search */}
                   <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-(--foreground) opacity-40" size={14} />
                      <input 
                        id="timeline-search"
                        name="timelineSearch"
                        type="text" 
                        placeholder="Search timeline..." 
                        value={timelineSearch}
                        onChange={(e) => setTimelineSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-(--card-bg) border border-(--border-color) rounded-lg text-sm text-(--foreground) focus:outline-none focus:border-(--theme-primary) focus:ring-1 focus:ring-(--theme-primary) placeholder:text-(--foreground) placeholder:opacity-40 transition-all"
                      />
                   </div>
                   
                   {/* Row 2: Filters */}
                   <div className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar pb-1">
                      {[
                        { id: 'all', label: 'All', icon: null },
                        { id: 'log', label: 'Git', icon: 'Code' },
                        { id: 'comment', label: 'Notes', icon: 'FileText' },
                        { id: 'daily_note', label: 'Daily', icon: 'Sparkles' },
                        { id: 'task', label: 'Tasks', icon: 'CheckCircle' },
                        { id: 'conversation', label: 'Conversations', icon: 'MessageSquare' }
                      ].map(filter => (
                        <button
                          key={filter.id}
                          onClick={() => setTimelineFilter(filter.id as TimelineFilter)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                            timelineFilter === filter.id 
                              ? 'bg-(--theme-primary) text-white shadow-md' 
                              : 'bg-(--card-bg) border border-(--border-color) text-(--foreground) opacity-60 hover:bg-(--hover-bg)'
                          }`}
                        >
                          {filter.icon && <IconRenderer icon={filter.icon} size={12} baseSet={appIconSet} className={timelineFilter === filter.id ? 'text-white' : 'text-(--foreground) opacity-60'} />}
                          {filter.label}
                        </button>
                      ))}
                      {selectedDate && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-(--theme-accent) text-(--background) rounded-lg text-xs font-bold">
                          <span>{selectedDate.toLocaleDateString(appLang, { month: 'short', day: 'numeric' })}</span>
                          <button 
                            onClick={() => setSelectedDate(null)}
                            className="hover:opacity-70 transition-opacity"
                            aria-label="Clear date filter"
                          >
                            ×
                          </button>
                        </div>
                      )}
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
                      let metadata: Metadata | null = null;

                      if (entryType === 'log') {
                         icon = entry.type === 'git' ? 
                             <IconRenderer icon="Code" size={ICON_SIZE} baseSet={appIconSet} /> : 
                             <IconRenderer icon="FileText" size={ICON_SIZE} baseSet={appIconSet} />;
                         typeLabel = entry.type || 'log';
                         if (entry.metadata) {
                             try {
                                metadata = JSON.parse(entry.metadata);
                              } catch { /* ignore */ }
                         }
                      } else if (entryType === 'comment') {
                         typeLabel = entry.type || 'note';
                         if (entry.type === 'code') icon = <IconRenderer icon="Code" size={ICON_SIZE} baseSet={appIconSet} />;
                         if (entry.metadata) {
                             try {
                                metadata = JSON.parse(entry.metadata);
                                console.log('Comment metadata parsed:', metadata, 'for entry:', entry.id);
                             } catch { 
                                console.log('Failed to parse metadata:', entry.metadata);
                             }
                         } else {
                            console.log('No metadata for comment:', entry.id);
                         }
                      } else if (entryType === 'task') {
                         icon = entry.status === 'completed' ? 
                             <IconRenderer icon="CheckCircle" size={ICON_SIZE} className="text-(--theme-primary)" baseSet={appIconSet} /> : 
                             <IconRenderer icon="ListTodo" size={ICON_SIZE} className="text-(--theme-primary)/70" baseSet={appIconSet} />;
                         typeLabel = entry.status === 'completed' ? 'Task Completed' : 'Task Added';
                      } else if (entryType === 'daily_note') {
                         icon = <IconRenderer icon="Sparkles" size={ICON_SIZE} className="text-(--theme-accent)" baseSet={appIconSet} />;
                         typeLabel = "Daily Summary";
                       } else if (entryType === 'conversation') {
                         icon = <IconRenderer icon="MessageSquare" size={ICON_SIZE} className="text-(--theme-primary)" baseSet={appIconSet} />;
                         typeLabel = `Conversation (${entry.agent || 'Unknown'})`;
                       }

                      return (
                        <div key={`${entryType}-${entry.id}`} className="group relative">
                          <div className="timeline-row flex gap-4 items-start py-6 -mx-4 px-4 hover:bg-(--hover-bg)/50 rounded-2xl transition-all">
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
                                className="timeline-icon shrink-0 w-6 h-6 rounded-full bg-(--card-bg) border-2 border-(--theme-primary-bg) flex items-center justify-center text-(--theme-primary) shadow-sm group-hover:scale-110 group-hover:border-(--theme-primary) transition-all z-10 cursor-pointer hover:bg-(--theme-primary-bg)"
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
                                    <ReactMarkdown>{cleanMarkdownContent(content)}</ReactMarkdown>
                                 </div>
                               </details>
                             ) : (
                               <>
                                 {/* Edit Mode for Comment */}
                                  {entryType === 'comment' && editingCommentId === entry.id && editingType === 'block' ? (
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
                                        <div className="bg-(--background) border-t border-(--border-color) p-2 flex justify-end">
                                            <button  
                                                onClick={() => setEditingType('markdown')}
                                                className="text-[10px] text-gray-500 hover:text-gray-800 underline"
                                            >
                                                Switch to Markdown
                                            </button>
                                        </div>
                                    </div>
                                  ) : entryType === 'comment' && editingCommentId === entry.id && editingType === 'markdown' ? (
                                    <div className="mt-2 border border-(--theme-primary) rounded-xl overflow-hidden shadow-sm bg-(--card-bg) p-3">
                                        <textarea
                                            value={editingContent}
                                            onChange={(e) => setEditingContent(e.target.value)}
                                            className="w-full text-sm min-h-[100px] outline-none resize-y"
                                            placeholder="Edit note..."
                                        />
                                        <div className="flex justify-between items-center mt-2 border-t pt-2 border-(--border-color)">
                                            <button 
                                                onClick={() => setEditingType('block')}
                                                className="text-[10px] text-(--foreground) opacity-50 hover:text-(--foreground) underline"
                                            >
                                                Switch to Block Editor
                                            </button>
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingCommentId(null)} className="text-xs text-(--foreground) opacity-50 hover:text-(--foreground)">Cancel</button>
                                                <button onClick={handleUpdateComment} className="text-xs bg-(--foreground) text-(--background) px-3 py-1 rounded-md">Save</button>
                                            </div>
                                        </div>
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
                                                      onClick={() => startEditingComment(entry.id, content, entry.type)}
                                                      className="p-1.5 text-(--foreground) opacity-40 hover:text-(--theme-primary) hover:bg-(--hover-bg) rounded transition-colors"
                                                      title="Edit"
                                                  >
                                                      <Edit2 size={14} />
                                                  </button>
                                                  {deletingCommentId === entry.id ? (
                                                    <div className="flex gap-1 items-center animate-in slide-in-from-right-2">
                                                      <span className="text-[10px] text-red-600 font-semibold px-2">削除?</span>
                                                      <button 
                                                          onClick={() => handleDeleteComment(entry.id)}
                                                          className="px-2 py-1 text-[10px] bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold"
                                                      >
                                                          確認
                                                      </button>
                                                      <button 
                                                          onClick={() => setDeletingCommentId(null)}
                                                          className="px-2 py-1 text-[10px] bg-(--sidebar-bg) text-(--foreground) rounded hover:bg-(--hover-bg) transition-colors"
                                                      >
                                                          ✕
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <button 
                                                        onClick={() => setDeletingCommentId(entry.id)}
                                                        className="p-1.5 text-(--foreground) opacity-40 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                  )}
                                              </div>
                                          )}
                                      </div>

                                      {/* Content Area */}
                                      <div className={`mt-3 ${entryType === 'log' && 'py-1'}`}>
                                      {entryType === 'log' && metadata?.hash ? (
                                          <div>
                                          <p className="text-[15px] font-medium leading-relaxed">{content}</p>
                                          <div className="mt-2 flex items-center gap-2 text-[10px] notion-text-subtle font-mono">
                                              <span className="bg-(--hover-bg) px-1.5 py-0.5 rounded border border-(--border-color) opacity-80">
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
                                       ) : entryType === 'comment' ? (
                                           (() => {
                                             // Check if this memo was created from Git or Daily Summary
                                             const shouldToggle = metadata?.sourceType === 'log' || metadata?.sourceType === 'daily_note';
                                             
                                             if (shouldToggle) {
                                               // Toggle display for Git/Daily Summary memos
                                               return (
                                                 <details className="group/memo">
                                                   <summary className="list-none cursor-pointer flex items-center gap-2 mb-2 focus:outline-none select-none">
                                                     <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                                       Memo
                                                     </span>
                                                     {metadata?.sourceType === 'log' && (
                                                       <span className="text-[9px] text-gray-400">from Git Log</span>
                                                     )}
                                                     {metadata?.sourceType === 'daily_note' && (
                                                       <span className="text-[9px] text-gray-400">from Daily Summary</span>
                                                     )}
                                                     <ChevronRight size={10} className="group-open/memo:rotate-90 transition-transform text-gray-400" />
                                                   </summary>
                                                   <div className="mt-2 markdown-content pl-3 border-l-2 border-green-500/30 animate-in slide-in-from-top-2 duration-300">
                                                     <ReactMarkdown>{cleanMarkdownContent(content)}</ReactMarkdown>
                                                   </div>
                                                 </details>
                                               );
                                             } else {
                                               // Expanded display for standalone memos
                                               return (
                                                 <div className="markdown-content">
                                                   <ReactMarkdown>{cleanMarkdownContent(content)}</ReactMarkdown>
                                                 </div>
                                               );
                                             }
                                           })()
                                       ) : (
                                           <div className="markdown-content">
                                           <ReactMarkdown>{cleanMarkdownContent(content)}</ReactMarkdown>
                                           </div>
                                       )}
                                      </div>
                                     </>
                                  )}
                                </>
                              )}
                              
                              {/* Inline Annotation */}
                              {chatState.open && chatState.targetId === `${entryType}-${entry.id}` && (
                                <>
                                  {chatState.mode === 'menu' && (
                                    <AnnotationMenu 
                                      onSelectAI={() => setChatState(prev => ({ ...prev, mode: 'ai' }))}
                                      onSelectMemo={() => setChatState(prev => ({ 
                                        ...prev, 
                                        mode: 'memo',
                                        title: prev.title.replace('Chat about', 'Note about')
                                      }))}
                                    />
                                  )}
                                  {chatState.mode === 'ai' && (
                                    <InlineChatBox 
                                      onClose={() => setChatState(prev => ({ ...prev, open: false, targetId: null, mode: 'menu' }))}
                                      initialContext={chatState.context}
                                      title={chatState.title}
                                      onSaveMemo={async (content) => await handleSaveMemo(content, 'markdown')}
                                    />
                                  )}
                                  {chatState.mode === 'memo' && (
                                    <InlineMemoEditor 
                                      onClose={() => setChatState(prev => ({ ...prev, open: false, targetId: null, mode: 'menu' }))}
                                      onSave={handleSaveMemo}
                                      title={chatState.title}
                                    />
                                  )}
                                </>
                              )}
                            </div>
                           </div>
                         </div>
                       );
                     })}
                    
                    {filteredTimelineData.length === 0 && (
                       <div className="py-20 text-center text-(--foreground) opacity-40 italic">No activity matching your filters.</div>
                    )}
                  </div>
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
              appSkin={appSkin}
              onUpdateSkin={(skin) => handleUpdateSettings({ APP_SKIN: skin })}
            />
          )}
        </section>

        <footer className="mt-24 pt-8 border-t border-(--border-color) text-xs notion-text-subtle flex justify-between items-center">
          <span>{activeProject?.name || t.ready}</span>
          <span>{t.status_online}</span>
        </footer>
        </div>

      {/* Custom Dialog */}
      {dialogState.open && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-(--card-bg) rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-(--border-color)">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${dialogState.type === 'success' ? 'bg-green-100 text-green-600' : dialogState.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-(--hover-bg) text-(--foreground)'}`}>
              <Check size={24} className={dialogState.type === 'success' ? 'block' : 'hidden'} />
              <AlertTriangle size={24} className={dialogState.type === 'error' ? 'block' : 'hidden'} />
              <HelpCircle size={24} className={dialogState.type === 'confirm' ? 'block' : 'hidden'} />
            </div>
            <h3 className="text-lg font-bold text-(--foreground) mb-2">{dialogState.title}</h3>
            <p className="text-sm text-(--foreground) opacity-80 mb-6 leading-relaxed whitespace-pre-wrap">
              {dialogState.message}
            </p>
            <div className="flex gap-3">
                {dialogState.type === 'confirm' ? (
                    <>
                        <button
                          onClick={() => {
                              if (dialogState.onConfirm) dialogState.onConfirm();
                              setDialogState(prev => ({ ...prev, open: false }));
                          }}
                          className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDialogState(prev => ({ ...prev, open: false }))}
                          className="flex-1 py-2.5 bg-(--hover-bg) text-(--foreground) rounded-xl font-bold text-sm hover:opacity-80 transition-colors"
                        >
                          Cancel
                        </button>
                    </>
                ) : (
                    <button
                      onClick={() => setDialogState(prev => ({ ...prev, open: false }))}
                      className="w-full py-2.5 bg-(--foreground) text-(--background) rounded-xl font-bold text-sm hover:opacity-90 transition-colors"
                    >
                      OK
                    </button>
                )}
            </div>
          </div>
        </div>
      )}
      

      
      {/* Floating Action Buttons - Always visible */}
      {activeProject && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {/* Add Memo Button */}
          <button
            onClick={() => setChatState({ 
              open: true, 
              targetId: 'global-memo', 
              context: activeProject.name, 
              title: 'Quick Memo', 
              mode: 'memo' 
            })}
            className="w-14 h-14 rounded-full bg-(--theme-primary) text-(--background) shadow-2xl hover:scale-110 transition-transform duration-200 flex items-center justify-center group"
            title="Add Memo"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/>
              <path d="M15 3v4a2 2 0 0 0 2 2h4"/>
            </svg>
          </button>

          {/* AI Chat Button */}
          <button
            onClick={() => setChatState({ 
              open: true, 
              targetId: 'global-chat', 
              context: activeProject.name, 
              title: 'AI Chat', 
              mode: 'ai' 
            })}
            className="w-14 h-14 rounded-full bg-(--theme-accent) text-(--background) shadow-2xl hover:scale-110 transition-transform duration-200 flex items-center justify-center group"
            title="AI Chat"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
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
