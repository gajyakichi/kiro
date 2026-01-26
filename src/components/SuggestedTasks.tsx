import React from 'react';
import { SuggestedTask } from '@/lib/types';
import { Lightbulb, Plus, X, Copy } from 'lucide-react';

interface SuggestedTasksProps {
  tasks: SuggestedTask[];
  onAdd: (task: SuggestedTask) => void;
  onDismiss: (task: SuggestedTask) => void;
}

const SuggestedTasks: React.FC<SuggestedTasksProps> = ({ tasks, onAdd, onDismiss }) => {
  const handleCopyPrompt = (taskText: string) => {
    const prompt = `Please implement the following task:\n\n${taskText}\n\nContext: Use the existing project structure and conventions.`;
    navigator.clipboard.writeText(prompt);
  };

  if (tasks.filter(t => t.status === 'proposed').length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-400 text-sm">No suggestions right now. Click &quot;Absorb&quot; to find new tasks.</p>
      </div>
    );
  }

  return (
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-xs font-semibold transition-all mr-auto"
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
  );
};

export default SuggestedTasks;
