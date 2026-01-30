import { useEffect, useState } from 'react';
import { FolderGit2, ChevronDown, Plus, Check } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  icon?: string | null;
  git_path?: string | null;
  artifact_path?: string | null;
}

interface ProjectSwitcherProps {
  activeProjectId: number;
  onSwitch: (projectId: number) => void;
  className?: string;
}

export const ProjectSwitcher = ({ activeProjectId, onSwitch, className = "" }: ProjectSwitcherProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (e) {
      console.error("Failed to fetch projects", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async () => {
    let path = "";
    let name = "";
    
    try {
        // Electron Directory Selection
        if (typeof window !== 'undefined' && window.electron && typeof window.electron.selectDirectory === 'function') {
          const selected = await window.electron.selectDirectory();
          if (selected) {
            path = String(selected); // Ensure string type
            name = path.split(/[/\\]/).pop() || "New Project";
          }
        } else {
          // Fallback
          const input = prompt("Enter absolute path to project repository:");
          if (input) {
            path = input;
            name = prompt("Enter project name:", "My Project") || "New Project";
          }
        }
    
        if (path && name) {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name, 
                    git_path: path,
                    artifact_path: path, 
                    icon: 'lucide:Folder' 
                })
            });
            
            if (res.ok) {
                alert(`Project "${name}" added successfully!`);
                fetchProjects();
                setIsOpen(false);
            } else {
                let errorMsg = "Failed to add project";
                try {
                    const err = await res.json();
                    if (err && err.error) {
                        errorMsg = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
                    } else if (err) {
                        errorMsg = JSON.stringify(err);
                    }
                } catch (parseError) {
                    console.warn("Failed to parse error response", parseError);
                    errorMsg = await res.text();
                }
                // Avoid throwing error to prevent Next.js error overlay crashes with complex objects
                console.error("Project addition failed:", errorMsg);
                alert(`Failed to add project: ${errorMsg}`);
            }
        }
    } catch (e) {
        console.error("Add Project Error:", e);
        const msg = e instanceof Error ? e.message : String(e);
        alert(`Failed to add project: ${msg}`);
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  if (loading) return <div className="text-[10px] notion-text-subtle animate-pulse">Loading projects...</div>;

  return (
    <div className={`relative ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 notion-item group border border-(--border-color) bg-(--card-bg)/50 backdrop-blur-sm"
      >
        <div className="w-5 h-5 rounded-md bg-(--theme-primary-bg) flex items-center justify-center text-(--theme-primary)">
          <FolderGit2 size={12} />
        </div>
        <div className="flex-1 text-left">
          <div className="text-[11px] font-bold truncate leading-tight text-(--foreground)">
            {activeProject?.name || 'Select Project'}
          </div>
          <div className="text-[9px] notion-text-subtle truncate">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </div>
        </div>
        <ChevronDown size={14} className={`notion-text-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-(--background) border border-(--border-color) rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-(--border-color) bg-(--hover-bg)">
            <span className="text-[10px] font-bold notion-text-subtle uppercase tracking-widest px-2">Projects</span>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  onSwitch(project.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                  project.id === activeProjectId ? 'bg-(--hover-bg)' : 'hover:bg-(--hover-bg)'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${project.id === activeProjectId ? 'bg-(--theme-primary) text-(--background)' : 'bg-(--hover-bg) text-(--foreground) opacity-50'}`}>
                     <FolderGit2 size={16} />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${project.id === activeProjectId ? 'text-(--theme-primary)' : 'text-(--foreground)'}`}>
                      {project.name}
                    </div>
                    <div className="text-[10px] notion-text-subtle truncate max-w-[150px]">
                      {project.git_path && project.git_path.length > 20 ? '...'+project.git_path.slice(-20) : project.git_path || 'No path'}
                    </div>
                  </div>
                </div>
                {project.id === activeProjectId && <Check size={16} className="text-(--theme-primary)" />}
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-(--border-color) bg-(--hover-bg)">
            <button 
              onClick={handleAddProject}
              className="flex items-center justify-center gap-2 w-full py-2 text-[10px] font-bold notion-text-subtle hover:text-(--theme-primary) transition-colors bg-(--theme-primary)/5 hover:bg-(--theme-primary)/10 rounded-lg"
            >
              <Plus size={12} />
              Add Repository (Project)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
