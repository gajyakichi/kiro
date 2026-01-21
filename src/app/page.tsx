"use client";

import { Progress, Comment, DbLog, Project } from "@/lib/types";
import { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { IconRenderer } from '@/components/IconRenderer';
import { IconPicker } from '@/components/IconPicker';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [dbLogs, setDbLogs] = useState<DbLog[]>([]);
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("git");
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", git_path: "", artifact_path: "", icon: "" });
  const [showIconPicker, setShowIconPicker] = useState<string | null>(null); // 'add' | 'header'

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
    } catch (e) {
      console.error("Fetch Error:", e);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchProjects();
  }, [fetchProjects]);

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
        body: JSON.stringify({ text: newComment, projectId: activeProject.id })
      });
      if (res.ok) {
        setNewComment("");
        fetchData(activeProject.id);
        setActiveTab("comments");
      }
    } catch (e) {
      console.error("Comment Error:", e);
    }
  };

  const handleAddProject = async () => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      });
      if (res.ok) {
        setIsAddingProject(false);
        setProjectForm({ name: "", git_path: "", artifact_path: "", icon: "" });
        fetchProjects();
      }
    } catch (e) {
      console.error("Add Project Error:", e);
    }
  };

  const handleUpdateProjectIcon = async (icon: string) => {
    if (!activeProject) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...activeProject, icon })
      });
      if (res.ok) {
        setActiveProject({ ...activeProject, icon });
        fetchProjects();
      }
    } catch (e) {
      console.error("Update Project Error:", e);
    }
  };

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  // Combine data for calendar display
  const aggregatedData = [
    ...dbLogs.filter(l => l.type === 'git').map(l => ({ ...l, type: 'git', dateObj: new Date(l.timestamp), message: l.content })),
    ...comments.map(c => ({ ...c, type: 'note', dateObj: new Date(c.timestamp) }))
  ];

  const renderMiniCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    const calendarHeader = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);

    return (
      <div className="mt-6 mb-8 px-2">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="font-semibold text-xs notion-text-subtle uppercase tracking-wider">{calendarHeader}</span>
          <div className="flex gap-1 text-[10px]">
             <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>◀</button>
             <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>▶</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center text-[10px]">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="opacity-40">{d}</div>)}
          {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: days }, (_, i) => i + 1).map(day => {
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const hasData = aggregatedData.some(d => d.dateObj.getDate() === day && d.dateObj.getMonth() === month && d.dateObj.getFullYear() === year);
            return (
              <div key={day} className={`relative flex items-center justify-center h-5 w-5 mx-auto rounded-full ${isToday ? 'bg-black text-white' : ''}`}>
                {day}
                {hasData && <div className="absolute bottom-0 w-1 h-1 bg-blue-400 rounded-full"></div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFullCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

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
                    <div key={`${item.type}-${'id' in item ? item.id : idx}`} className={`text-[10px] px-1 py-0.5 rounded truncate ${item.type === 'git' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                      {item.type === 'git' ? 'Commit: ' : ''}{'message' in item ? item.message : 'text' in item ? item.text : ''}
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
    <div className="flex min-h-screen text-[14px]">
      {/* Notion Sidebar */}
      <aside className="w-64 notion-sidebar flex flex-col pt-8 pb-4 px-3 sticky top-0 h-screen overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="w-6 h-6 bg-foreground text-white rounded flex items-center justify-center font-bold text-xs">K</div>
            <span className="font-semibold truncate">Kaihatsunote</span>
          </div>
          
          <div className="px-2 mt-4">
            <div className="text-[11px] font-semibold notion-text-subtle uppercase mb-2">Workspace</div>
            <div className="relative">
                <select 
                value={activeProject?.id || ""}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === "new") {
                        setIsAddingProject(true);
                    } else {
                        const p = projects.find(proj => proj.id === parseInt(val));
                        if (p) setActiveProject(p);
                    }
                }}
                className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 pl-8 text-sm focus:outline-none appearance-none"
                >
                <option value="" disabled>Select Workspace</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                <option value="new">+ Add Project</option>
                </select>
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {activeProject ? (
                        <IconRenderer icon={activeProject.icon} size={14} className="opacity-70" />
                    ) : (
                        <span className="text-xs opacity-40">◦</span>
                    )}
                </div>
            </div>
            {activeProject === null && projects.length === 0 && (
                <button onClick={() => setIsAddingProject(true)} className="mt-2 text-[12px] text-blue-600 hover:underline">Register first project</button>
            )}
            {/* Direct selector for Add Project if select value becomes 'new' handled in a better way below or by state */}
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
        </nav>

        {renderMiniCalendar()}

        {isAddingProject && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white notion-card w-full max-w-md p-6 animate-fade-in">
              <h2 className="text-xl font-bold mb-4">Add New Project</h2>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="relative">
                    <label className="block text-xs font-semibold notion-text-subtle mb-1">Icon</label>
                    <button 
                      onClick={() => setShowIconPicker('add')}
                      className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 bg-white"
                    >
                      {projectForm.icon ? (
                        <IconRenderer icon={projectForm.icon} size={24} />
                      ) : (
                        <span className="text-gray-300 text-xl">+</span>
                      )}
                    </button>
                    {showIconPicker === 'add' && (
                       <IconPicker 
                        selectedIcon={projectForm.icon}
                        onSelect={(icon) => {
                          setProjectForm({ ...projectForm, icon });
                          setShowIconPicker(null);
                        }}
                        onClose={() => setShowIconPicker(null)}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold notion-text-subtle mb-1">Project Name</label>
                    <input 
                      className="w-full border border-gray-200 rounded p-2 text-sm"
                      placeholder="e.g. My Website"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold notion-text-subtle mb-1">Git Repository Path</label>
                  <input 
                    className="w-full border border-gray-200 rounded p-2 text-sm"
                    placeholder="/Users/name/repo"
                    value={projectForm.git_path}
                    onChange={(e) => setProjectForm({ ...projectForm, git_path: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold notion-text-subtle mb-1">Antigravity Artifact Directory</label>
                  <input 
                    className="w-full border border-gray-200 rounded p-2 text-sm"
                    placeholder="/Users/name/.gemini/antigravity/brain/session-id"
                    value={projectForm.artifact_path}
                    onChange={(e) => setProjectForm({ ...projectForm, artifact_path: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={handleAddProject}
                    className="flex-1 bg-foreground text-white font-medium py-2 rounded text-sm transition-opacity hover:opacity-90"
                  >
                    Save Project
                  </button>
                  <button 
                    onClick={() => setIsAddingProject(false)}
                    className="flex-1 bg-gray-100 text-gray-700 font-medium py-2 rounded text-sm hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto px-2 pt-4 border-t border-gray-200">
          <div className="mb-3 font-semibold text-xs notion-text-subtle uppercase tracking-wider">Quick Note</div>
          <textarea 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:border-gray-400 h-24 mb-2 resize-none"
            placeholder="Write something..."
          />
          <button 
            onClick={handleAddComment}
            className="w-full bg-foreground hover:opacity-90 text-white font-medium py-1.5 rounded-md transition-colors text-xs"
          >
            Add to Notes
          </button>
        </div>
      </aside>

      {/* Notion Content Area */}
      <main className="flex-1 overflow-y-auto p-12 lg:px-20 xl:px-40">
        <header className="mb-12 animate-fade-in">
          <h1 className="group relative flex items-center text-4xl font-bold tracking-tight mb-2">
            <div className="relative mr-4">
              <div 
                onClick={() => setShowIconPicker('header')}
                className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-100 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
              >
                {activeProject?.icon ? (
                    <IconRenderer icon={activeProject.icon} size={32} />
                ) : (
                    <span className="text-2xl opacity-20">◦</span>
                )}
              </div>
              {showIconPicker === 'header' && (
                <div className="left-0 top-full">
                  <IconPicker 
                    selectedIcon={activeProject?.icon}
                    onSelect={(icon) => {
                      handleUpdateProjectIcon(icon);
                      setShowIconPicker(null);
                    }}
                    onClose={() => setShowIconPicker(null)}
                  />
                </div>
              )}
            </div>
            <span>
              {activeTab === "git" && "Git History"}
              {activeTab === "progress" && "Development Progress"}
              {activeTab === "comments" && "Developer Notes"}
              {activeTab === "calendar" && "System Calendar"}
            </span>
            {activeProject && <span className="text-lg ml-4 opacity-30 font-normal">/ {activeProject.name}</span>}
          </h1>
          <p className="text-lg notion-text-subtle">
            {activeTab === "git" && "Track recent system changes and commits."}
            {activeTab === "progress" && "Live status of the Antigravity task checklist."}
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

          {activeTab === "comments" && (
            <div key="comments-content" className="space-y-8">
              {comments.length === 0 ? (
                <p className="notion-text-subtle italic">No notes created yet. Use the sidebar to add your first note.</p>
              ) : (
                comments.slice().reverse().map((comment) => (
                  <div key={comment.id} className="group">
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">SY</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-[13px]">User</span>
                          <span className="text-[11px] notion-text-subtle font-normal">{new Date(comment.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{comment.text}</div>
                      </div>
                    </div>
                      <div className="h-px bg-gray-100 mt-8 group-last:hidden"></div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        <footer className="mt-24 pt-8 border-t border-gray-100 text-xs notion-text-subtle flex justify-between items-center">
          <span>Kaihatsunote v1.6.0</span>
          <span>Synced with Antigravity</span>
        </footer>
      </main>

      <style jsx global>{`
        .markdown-content ul { list-style-type: none; padding-left: 0; }
        .markdown-content li { margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px; }
        .markdown-content li input[type="checkbox"] { margin-top: 4px; pointer-events: none; }
        .markdown-content p { margin: 0; }
        .markdown-content h1, .markdown-content h2, .markdown-content h3 { font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; }
        .markdown-content h1 { font-size: 1.5em; }
        .markdown-content h2 { font-size: 1.25em; border-bottom: 1px solid #efefef; padding-bottom: 2px; }
      `}</style>
    </div>
  );
}
