import React from 'react';
import { SuggestedTask } from '@/lib/types';
import { Lightbulb, Plus, X, Copy } from 'lucide-react';

interface SuggestedTasksProps {
  tasks: SuggestedTask[];
  onAdd: (task: SuggestedTask) => void;
  onDismiss: (task: SuggestedTask) => void;
}

const SuggestedTasks: React.FC<SuggestedTasksProps> = ({ tasks, onAdd, onDismiss }) => {
  const [toast, setToast] = React.useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const handleCopyPrompt = (taskText: string) => {
    const prompt = `Please implement the following task:\n\n${taskText}\n\nContext: Use the existing project structure and conventions.`;
    navigator.clipboard.writeText(prompt);
    setToast({ show: true, message: 'AI Prompt copied to clipboard!' });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  if (tasks.filter(t => t.status === 'proposed').length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-400 text-sm">No suggestions right now. Click &quot;Absorb&quot; to find new tasks.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.filter(t => t.status === 'proposed').map((task) => (
          <div key={task.id} className="bg-white notion-card p-4 rounded-xl border border-gray-200 shadow-sm hover:border-(--theme-accent) transition-all flex flex-col justify-between group">
            <div className="flex gap-3 mb-4">
              <div className="mt-1 shrink-0">
                <Lightbulb size={18} className="text-(--theme-accent)" />
              </div>
              <p className="text-sm text-gray-700 font-medium leading-snug">
                {task.task}
              </p>
            </div>
            
            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleCopyPrompt(task.task)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-xs font-semibold transition-all mr-auto active:scale-95"
                title="Copy Prompt for AI Agent"
              >
                <Copy size={14} />
                AI Prompt
              </button>
              <button 
                onClick={() => onDismiss(task)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-neutral-100 rounded-md transition-colors"
                title="Dismiss"
              >
                <X size={16} />
              </button>
              <button 
                onClick={() => onAdd(task)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background hover:bg-neutral-800 rounded-md text-xs font-semibold transition-all"
              >
                <Plus size={14} />
                Add to Notes
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-neutral-900/90 backdrop-blur text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2">
            <Copy size={12} className="text-emerald-400" />
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestedTasks;
