"use client";

import { Progress, Comment, DbLog, Project, Theme, DailyNote, SuggestedTask } from "@/lib/types";
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { IconRenderer } from '@/components/IconRenderer';
import { IconPicker } from '@/components/IconPicker';
import { ThemeLab } from '@/components/ThemeLab';
import { Sparkles, PenTool, AlignLeft, FileText, Code } from 'lucide-react';
import DailyNotes from '@/components/DailyNotes';
import SuggestedTasks from '@/components/SuggestedTasks';
import MarkdownEditor from '@/components/MarkdownEditor';

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
      // Sync and Fetch Logs from SQLite
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
    fetchProjects();
    fetchThemes();
  }, [fetchProjects, fetchThemes]);

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
    
    // Quick and dirty check for activity
    const activityDays = new Set([
      ...dbLogs.map(l => new Date(l.timestamp).getDate()),
      ...comments.map(c => new Date(c.timestamp).getDate())
    ]);

    return (
      <div className="mt-8 px-2">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[11px] font-bold notion-text-subtle uppercase tracking-wider">
            {new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(currentDate)}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-0.5 hover:bg-gray-100 rounded text-gray-400">‹</button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-0.5 hover:bg-gray-100 rounded text-gray-400">›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px text-[10px] text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={`${d}-${i}`} className="py-1 text-gray-400 font-medium">{d}</div>)}
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

  const renderFullCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();

    // Group logs and comments by day
    const aggregatedData = [
      ...dbLogs.map(l => ({ ...l, dateObj: new Date(l.timestamp) })),
      ...comments.map(c => ({ ...c, dateObj: new Date(c.timestamp), type: 'note' }))
    ];

    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-3xl font-bold accent-text">
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate)}
           </h2>
           <div className="flex gap-2">
              <button className="notion-item px-3 py-1 bg-white notion-card text-xs font-medium" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>Previous</button>
              <button className="notion-item px-3 py-1 bg-white notion-card text-xs font-medium" onClick={() => setCurrentDate(new Date())}>Today</button>
              <button className="notion-item px-3 py-1 bg-white notion-card text-xs font-medium" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>Next</button>
           </div>
        </div>
        <div className="grid grid-cols-7 border-t border-l border-gray-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="p-2 text-center text-xs notion-text-subtle font-semibold border-r border-b border-gray-100 bg-gray-50/50">{d}</div>
          ))}
          {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} className="border-r border-b border-gray-100 h-32 bg-gray-50/20" />)}
          {Array.from({ length: days }, (_, i) => i + 1).map(day => {
            const dayData = aggregatedData.filter(d => d.dateObj.getDate() === day && d.dateObj.getMonth() === month && d.dateObj.getFullYear() === year);
            return (
              <div key={day} className="border-r border-b border-gray-100 h-32 p-2 relative group hover:bg-gray-50/50 transition-colors">
                <span className="text-xs font-semibold notion-text-subtle">{day}</span>
                <div className="mt-2 space-y-1 overflow-hidden max-h-[85px]">
                  {dayData.map((item, idx) => (
                    <div key={`${'type' in item ? item.type : 'unknown'}-${'id' in item ? item.id : idx}`} className={`text-[10px] px-1 py-0.5 rounded truncate ${'type' in item && item.type === 'git' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                      {'type' in item && item.type === 'git' ? 'Commit: ' : ''}{'content' in item ? item.content : 'text' in item ? item.text : ''}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!mounted) return <div className="min-h-screen bg-background" />;

  return (
    <div className={`flex min-h-screen text-[14px] ${((previewCss || themes.some(t => t.active))) ? 'theme-active' : ''}`}>
      {/* Notion Sidebar */}
      <aside className="w-64 notion-sidebar flex flex-col pt-8 pb-4 px-3 sticky top-0 h-screen overflow-y-auto">
        <div className="mb-6">
          <div className="px-2 mt-4">
            <div className="text-[11px] font-semibold notion-text-subtle uppercase mb-2">Workspace</div>
            <div className="relative">
                <select 
                value={activeProject?.id || ""}
                onChange={(e) => {
                    const p = projects.find(proj => proj.id === parseInt(e.target.value));
                    if (p) setActiveProject(p);
                }}
                className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 pl-8 text-sm focus:outline-none appearance-none"
                >
                <option value="" disabled>Select Workspace</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {activeProject ? (
                        <IconRenderer icon={activeProject.icon} size={14} className="opacity-70" />
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
            <span>Git Logs</span>
          </div>
          
          <div 
            onClick={() => setActiveTab("progress")}
            className={`notion-item flex items-center gap-3 ${activeTab === "progress" ? "active" : ""}`}
          >
            <span>✅</span>
            <span>Progress (task.md)</span>
          </div>

          <div 
            onClick={() => setActiveTab("daily_notes")}
            className={`notion-item flex items-center gap-3 ${activeTab === "daily_notes" ? "active" : ""}`}
          >
            <span>✨</span>
            <div className="flex-1 flex justify-between items-center">
              <span>Daily Notes</span>
              {dailyNotes.length > 0 && <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 rounded-full font-bold">{dailyNotes.length}</span>}
            </div>
          </div>

          <div 
            onClick={() => setActiveTab("suggested_tasks")}
            className={`notion-item flex items-center gap-3 ${activeTab === "suggested_tasks" ? "active" : ""}`}
          >
            <span>💡</span>
            <div className="flex-1 flex justify-between items-center">
              <span>Suggestions</span>
              {suggestedTasks.length > 0 && <span className="text-[10px] bg-amber-50 text-amber-500 px-1.5 rounded-full font-bold">{suggestedTasks.length}</span>}
            </div>
          </div>

          <div 
            onClick={() => setActiveTab("calendar")}
            className={`notion-item flex items-center gap-3 ${activeTab === "calendar" ? "active" : ""}`}
          >
            <span>📅</span>
            <span>Calendar</span>
          </div>

          <div 
            onClick={() => setActiveTab("comments")}
            className={`notion-item flex items-center gap-3 ${activeTab === "comments" ? "active" : ""}`}
          >
            <span>📝</span>
            <div className="flex-1 flex justify-between items-center">
              <span>Notes</span>
              <span className="text-xs notion-text-subtle">{comments.length}</span>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab("themes")}
            className={`notion-item flex items-center gap-3 ${activeTab === "themes" ? "active" : ""}`}
          >
            <span className="animate-pulse">✨</span>
            <span>Theme Lab</span>
          </div>

          <Link 
            href="/settings"
            className="notion-item flex items-center gap-3 no-underline text-inherit"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
        </nav>

        {renderMiniCalendar()}

        <div className="mt-auto px-2 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-[10px] text-gray-500 uppercase tracking-widest bg-gray-100/50 w-fit px-2 py-0.5 rounded">Quick Note</div>
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
            className="w-full bg-white border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:border-gray-400 h-20 mb-2 resize-none text-neutral-800 placeholder:text-neutral-400 font-medium"
            placeholder={activeBlockType === 'code' ? '// write some code...' : activeBlockType === 'markdown' ? '# Heading...' : 'Write something...'}
          />
          <button 
            onClick={handleAddComment}
            className="w-full bg-foreground hover:opacity-90 text-white font-medium py-1.5 rounded-md transition-colors text-xs flex items-center justify-center gap-2"
          >
            {activeBlockType === 'code' && <Code size={12} />}
            {activeBlockType === 'markdown' && <FileText size={12} />}
            {activeBlockType === 'text' && <AlignLeft size={12} />}
            Add {activeBlockType.charAt(0).toUpperCase() + activeBlockType.slice(1)} Block
          </button>
        </div>
      </aside>

      {/* Notion Content Area */}
      <main className="flex-1 overflow-y-auto p-12 lg:px-20 xl:px-40">
        <header className="mb-12 animate-fade-in">
          <h1 className="group relative flex items-center text-4xl font-bold tracking-tight mb-2">
            <div className="relative mr-4">
              <div 
                onClick={() => setIconPickerTarget('header')}
                className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-100 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
              >
                {activeProject?.icon ? (
                    <IconRenderer icon={activeProject.icon} size={32} />
                ) : (
                    <span className="text-2xl opacity-20">◦</span>
                )}
              </div>
              {iconPickerTarget === 'header' && (
                <div className="left-0 top-full">
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
              {activeTab === "git" && "Git History"}
              {activeTab === "progress" && "Development Progress"}
              {activeTab === "daily_notes" && "Daily Notes"}
              {activeTab === "suggested_tasks" && "AI Task Suggestions"}
              {activeTab === "comments" && "Developer Notes"}
              {activeTab === "calendar" && "System Calendar"}
            </span>
            {activeProject && <span className="text-lg ml-4 opacity-30 font-normal">/ {activeProject.name}</span>}
            
            {activeProject && (
              <button 
                onClick={handleAbsorb}
                disabled={isAbsorbing}
                className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isAbsorbing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white shadow-sm'
                }`}
              >
                <Sparkles size={14} className={isAbsorbing ? 'animate-spin' : 'animate-pulse text-amber-400'} />
                {isAbsorbing ? 'Absorbing...' : 'Absorb Context'}
              </button>
            )}
          </h1>
          <p className="text-lg notion-text-subtle">
            {activeTab === "git" && "Track recent system changes and commits."}
            {activeTab === "progress" && "Live status of the Antigravity task checklist."}
            {activeTab === "daily_notes" && "AI-summarized report of recent development activities."}
            {activeTab === "suggested_tasks" && "AI-powered recommendations for upcoming work."}
            {activeTab === "comments" && "Your manual notes and thoughts recorded here."}
            {activeTab === "calendar" && "Visual timeline of commits and notes."}
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
                         <span>{JSON.parse(log.metadata || '{}').author || 'Unknown'}</span>
                         <span>•</span>
                         <span>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
              {dbLogs.filter(log => log.type === "git").length === 0 && (
                <p className="notion-text-subtle italic">No git history discovered for this project yet.</p>
              )}
            </div>
          )}

          {activeTab === "progress" && (
            <div key="progress-content" className="prose prose-slate max-w-none">
              <div className="markdown-content">
                <ReactMarkdown>
                  {progress?.task || "Loading progress..."}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {activeTab === "calendar" && renderFullCalendar()}

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
                  <h2 className="text-2xl font-bold tracking-tight">Notes Timeline</h2>
                  <p className="text-sm text-gray-500">Chronological history of your manual entries.</p>
                </div>
                {!isFullEditorOpen && (
                  <button 
                    onClick={() => setIsFullEditorOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm group"
                  >
                    <PenTool size={14} className="text-blue-500 group-hover:rotate-12 transition-transform" />
                    Open Markdown Editor
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
                <div key="comments-content" className="space-y-8">
                  {comments.length === 0 ? (
                    <p className="notion-text-subtle italic">No notes created yet. Use the sidebar or the editor to add your first note.</p>
                  ) : (
                    comments.slice().reverse().map((comment) => (
                      <div key={comment.id} className="group">
                        <div className="flex gap-4 items-start">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold shadow-sm">
                            {comment.type === 'code' && <Code size={14} />}
                            {comment.type === 'markdown' && <FileText size={14} />}
                            {comment.type === 'text' && <AlignLeft size={14} />}
                            {(!comment.type || comment.type === 'unknown') && "SY"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-[13px] text-gray-800">
                                {comment.type === 'code' ? 'Code Block' : comment.type === 'markdown' ? 'Markdown' : 'Note'}
                              </span>
                              <span className="text-[11px] notion-text-subtle font-normal bg-gray-50 px-2 py-0.5 rounded-full">{new Date(comment.timestamp).toLocaleString()}</span>
                            </div>
                            <div className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${comment.type === 'code' ? 'bg-neutral-900 border-neutral-800' : ''}`}>
                                {comment.type === 'code' ? (
                                    <pre className="text-sm font-mono text-emerald-400 overflow-x-auto p-0 m-0 bg-transparent border-none">
                                        <code>{comment.text}</code>
                                    </pre>
                                ) : comment.type === 'text' ? (
                                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {comment.text}
                                    </div>
                                ) : (
                                    <div className="markdown-content">
                                        <ReactMarkdown>
                                            {comment.text}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="h-12 border-l border-gray-100 ml-4 group-last:hidden"></div>
                      </div>
                    ))
                  )}
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
            />
          )}
        </section>

        <footer className="mt-24 pt-8 border-t border-gray-100 text-xs notion-text-subtle flex justify-between items-center">
          <span>{activeProject?.name || "Ready"}</span>
          <span>System Status: Online</span>
        </footer>
      </main>

      {/* Dynamic Theme Styles */}
      <style key={themes.find(t => t.active)?.id || 'original'} dangerouslySetInnerHTML={{ __html: `
        ${previewCss || themes.find(t => t.active)?.css || ''}
        
        /* Global Readability Improvements for Themes */
        .theme-active body { line-height: 1.6; letter-spacing: 0.015em; -webkit-font-smoothing: subpixel-antialiased; }
        .theme-active .notion-card { box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important; transition: transform 0.2s ease; }
        
        .markdown-content ul { list-style-type: none; padding-left: 0; }
        .markdown-content li { margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px; }
        .markdown-content li input[type="checkbox"] { margin-top: 4px; pointer-events: none; }
        .markdown-content p { margin: 0; }
        .markdown-content h1, .markdown-content h2, .markdown-content h3 { font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; }
        .markdown-content h1 { font-size: 1.5em; }
        .markdown-content h2 { font-size: 1.25em; border-bottom: 1px solid #efefef; padding-bottom: 2px; }
      `}} />
    </div>
  );
}
