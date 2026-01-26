import React, { useState } from 'react';
import { SuggestedTask } from '@/lib/types';
import { Lightbulb, Plus, X, Copy, CheckCircle } from 'lucide-react';

interface SuggestedTasksProps {
  tasks: SuggestedTask[];
  onAdd: (task: SuggestedTask) => void;
  onDismiss: (task: SuggestedTask) => void;
  onUpdateStatus?: (task: SuggestedTask, status: string) => void;
}

const SuggestedTasks: React.FC<SuggestedTasksProps> = ({ tasks, onAdd, onDismiss, onUpdateStatus }) => {
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [activeTab, setActiveTab] = useState<'todo' | 'suggestions' | 'completed'>('todo');

  const handleCopyPrompt = (taskText: string) => {
    const prompt = `Please implement the following task:\n\n${taskText}\n\nContext: Use the existing project structure and conventions.`;
    navigator.clipboard.writeText(prompt);
    setToast({ show: true, message: 'AI Prompt copied to clipboard!' });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const activeTasks = tasks.filter(t => t.status === 'added');
  const proposedTasks = tasks.filter(t => t.status === 'proposed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const handleToggleComplete = (task: SuggestedTask) => {
      if (onUpdateStatus) {
          const newStatus = task.status === 'completed' ? 'added' : 'completed';
          onUpdateStatus(task, newStatus);
      }
  };

  /* Redesigned Task Row (Todoist-style) */
  const renderTaskRow = (task: SuggestedTask, isTodo: boolean = false, isCompleted: boolean = false) => (
    <div key={task.id} className="group flex items-start gap-3 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors px-2 -mx-2 rounded-lg">
        {/* Checkbox / Icon Area */}
        <div 
            className={`mt-0.5 shrink-0 cursor-pointer text-gray-400 hover:text-opacity-80 transition-colors ${(isTodo || isCompleted) ? '' : 'cursor-default'}`} 
            onClick={() => (isTodo || isCompleted) && handleToggleComplete(task)}
        >
            {(isTodo || isCompleted) ? (
                isCompleted ? (
                    <CheckCircle size={20} className="text-emerald-500 fill-emerald-50" />
                ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-emerald-500 transition-colors" />
                )
            ) : (
                <Lightbulb size={20} className="text-amber-400" />
            )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
            <p className={`text-sm text-gray-700 leading-snug ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                {task.task}
            </p>
            {/* Optional Timestamp or metadata could go here */}
        </div>

        {/* Actions - Visible on Hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={() => handleCopyPrompt(task.task)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded text-xs transition-colors"
                title="Copy Prompt"
            >
               <Copy size={16} />
            </button>
            
            <button 
                onClick={() => onDismiss(task)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded text-xs transition-colors"
                title="Dismiss"
            >
               <X size={16} />
            </button>

            {!isTodo && !isCompleted && (
                <button 
                    onClick={() => onAdd(task)}
                    className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-600 rounded text-xs font-medium transition-colors shadow-sm"
                >
                    <Plus size={14} />
                    Add
                </button>
            )}
        </div>
    </div>
  );

  return (
    <div className="relative space-y-6">
      <div className="flex gap-4 border-b border-gray-200 pb-2">
          <button 
            onClick={() => setActiveTab('todo')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'todo' ? 'text-gray-900 border-b-2 border-gray-900 rounded-none pb-3 -mb-2.5' : 'text-gray-400 hover:text-gray-600'}`}
          >
              Active Todo
              {activeTasks.length > 0 && <span className="bg-gray-200 text-gray-600 px-1.5 rounded-full text-[10px]">{activeTasks.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('suggestions')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'suggestions' ? 'text-amber-600 border-b-2 border-amber-500 rounded-none pb-3 -mb-2.5' : 'text-gray-400 hover:text-gray-600'}`}
          >
              Suggestions
              {proposedTasks.length > 0 && <span className="bg-amber-100 text-amber-600 px-1.5 rounded-full text-[10px]">{proposedTasks.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'completed' ? 'text-emerald-600 border-b-2 border-emerald-500 rounded-none pb-3 -mb-2.5' : 'text-gray-400 hover:text-gray-600'}`}
          >
              Completed
          </button>
      </div>

      <div className="space-y-1 animate-in fade-in duration-300 min-h-[300px]">
        {activeTab === 'todo' && (
            navCheck(activeTasks.length) ? activeTasks.map(t => renderTaskRow(t, true)) : emptyState("No active tasks. Add suggestions to get started!")
        )}
        {activeTab === 'suggestions' && (
            navCheck(proposedTasks.length) ? proposedTasks.map(t => renderTaskRow(t)) : emptyState("No new suggestions. Click 'Absorb' to analyze.")
        )}
        {activeTab === 'completed' && (
            navCheck(completedTasks.length) ? completedTasks.map(t => renderTaskRow(t, false, true)) : emptyState("No completed tasks yet.")
        )}
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

const navCheck = (len: number) => len > 0;
const emptyState = (msg: string) => (
    <div className="text-center py-20 text-gray-400 text-sm italic">
        {msg}
    </div>
);

export default SuggestedTasks;
