import React, { useState } from 'react';
import { SuggestedTask } from '@/lib/types';
import { Plus, X, Copy, CheckCircle, Sparkles } from 'lucide-react';

interface SuggestedTasksProps {
  tasks: SuggestedTask[];
  onAdd: (task: SuggestedTask) => void;
  onDismiss: (task: SuggestedTask) => void;
  onUpdateStatus?: (task: SuggestedTask, status: string) => void;
  onManualAdd?: (task: string) => void;
  onOpenChat?: (id: string, context: string, title: string) => void;
}

const SuggestedTasks: React.FC<SuggestedTasksProps> = ({ tasks, onAdd, onDismiss, onUpdateStatus, onManualAdd, onOpenChat }) => {
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [activeTab, setActiveTab] = useState<'todo' | 'suggestions'>('todo');
  const [newTaskInput, setNewTaskInput] = useState('');

  const handleCopyPrompt = (taskText: string) => {
    const prompt = `Please implement the following task:\n\n${taskText}\n\nContext: Use the existing project structure and conventions.`;
    navigator.clipboard.writeText(prompt);
    setToast({ show: true, message: 'AI Prompt copied to clipboard!' });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const activeTasks = tasks.filter(t => t.status === 'added');
  const proposedTasks = tasks.filter(t => t.status === 'proposed');

  const handleToggleComplete = (task: SuggestedTask) => {
      if (onUpdateStatus) {
          const newStatus = task.status === 'completed' ? 'added' : 'completed';
          onUpdateStatus(task, newStatus);
      }
  };

  const handleManualSubmit = () => {
    if (newTaskInput.trim() && onManualAdd) {
        onManualAdd(newTaskInput.trim());
        setNewTaskInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleManualSubmit();
    }
  }

  /* Task Row - Exact Current Status Style */
  const renderTaskRow = (task: SuggestedTask, isTodo: boolean = false, isCompleted: boolean = false) => (
    <div key={task.id} className="group relative pl-6 border-l-2 border-(--border-color) hover:border-(--theme-primary) transition-colors mb-4">
        {/* Circular Node */}
        <button 
            onClick={() => onOpenChat && onOpenChat(`task-${task.id}`, `Task: ${task.task}`, isTodo ? 'Todo AI Assistant' : 'Task AI Assistant')}
            className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-(--card-bg) border-2 border-(--border-color) group-hover:border-(--theme-primary) transition-colors flex items-center justify-center cursor-pointer hover:scale-110 z-10"
            title="Ask AI about this task"
        >
            <div className="w-1.5 h-1.5 rounded-full bg-(--theme-primary) opacity-30 group-hover:opacity-100 transition-opacity" />
        </button>
        
        {/* Task Content */}
        <div className="flex items-start justify-between gap-3 pb-3">
            {/* Checkbox for Todo items */}
            {(isTodo || isCompleted) && (
                <div 
                    className="mt-0.5 shrink-0 cursor-pointer"
                    onClick={() => handleToggleComplete(task)}
                >
                    {isCompleted ? (
                        <CheckCircle size={20} className="text-(--theme-primary) fill-(--card-bg)" />
                    ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-(--border-color) hover:border-(--theme-primary) transition-colors" />
                    )}
                </div>
            )}
            
            {/* Task Text */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm text-(--foreground) leading-snug ${isCompleted ? 'line-through opacity-50' : ''}`}>
                    {task.task}
                </p>
            </div>

            {/* Actions - Visible on Hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isTodo && !isCompleted && (
                    <button 
                        onClick={() => onAdd(task)}
                        className="p-1.5 text-(--foreground) opacity-40 hover:opacity-100 hover:text-(--theme-primary) hover:bg-(--hover-bg) rounded text-xs transition-colors"
                        title="Add to Todo"
                    >
                        <Plus size={18} />
                    </button>
                )}
                
                {/* AI Chat Button */}
                {onOpenChat && (
                    <button 
                        onClick={() => onOpenChat(`task-${task.id}`, `Task: ${task.task}`, isTodo ? 'Todo AI Assistant' : 'Task AI Assistant')}
                        className="p-1.5 text-(--foreground) opacity-40 hover:opacity-100 hover:text-(--theme-primary) hover:bg-(--hover-bg) rounded text-xs transition-colors"
                        title="Chat with AI about this task"
                    >
                        <Sparkles size={16} className="text-(--theme-primary)" />
                    </button>
                )}
                
                <button 
                    onClick={() => handleCopyPrompt(task.task)}
                    className="p-1.5 text-(--foreground) opacity-40 hover:opacity-100 hover:bg-(--hover-bg) rounded text-xs transition-colors"
                    title="Copy Prompt"
                >
                   <Copy size={16} />
                </button>
                
                <button 
                    onClick={() => onDismiss(task)}
                    className="p-1.5 text-(--foreground) opacity-40 hover:opacity-100 hover:text-red-500 hover:bg-red-50 rounded text-xs transition-colors"
                    title="Dismiss"
                >
                   <X size={16} />
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="relative space-y-6">
      <div className="flex gap-6 border-b border-(--border-color) pb-0">
          <button 
            onClick={() => setActiveTab('todo')}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'todo' ? 'text-(--theme-primary) border-(--theme-primary)' : 'text-(--foreground) opacity-60 border-transparent hover:opacity-100'}`}
          >
              Active Todo
              {activeTasks.length > 0 && <span className={`text-[10px] px-1.5 rounded-full ${activeTab === 'todo' ? 'bg-(--theme-primary)/10 text-(--theme-primary)' : 'bg-(--hover-bg) text-(--foreground)'}`}>{activeTasks.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('suggestions')}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'suggestions' ? 'text-(--theme-primary) border-(--theme-primary)' : 'text-(--foreground) opacity-60 border-transparent hover:opacity-100'}`}
          >
              Suggestions
              {proposedTasks.length > 0 && <span className={`text-[10px] px-1.5 rounded-full ${activeTab === 'suggestions' ? 'bg-(--theme-primary)/10 text-(--theme-primary)' : 'bg-(--hover-bg) text-(--foreground)'}`}>{proposedTasks.length}</span>}
          </button>
      </div>

      <div className="space-y-1 animate-in fade-in duration-300 min-h-[300px]">
        {activeTab === 'todo' && (
            <>
              {onManualAdd && (
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newTaskInput}
                        onChange={(e) => setNewTaskInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add a new task..."
                        className="flex-1 px-3 py-2 bg-(--card-bg) border border-(--border-color) rounded-lg text-sm text-(--foreground) focus:outline-none focus:border-(--theme-primary) focus:ring-1 focus:ring-(--theme-primary) transition-all"
                    />
                    <button 
                        onClick={handleManualSubmit}
                        disabled={!newTaskInput.trim()}
                        className="px-4 py-2 bg-(--theme-primary) text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        Add
                    </button>
                </div>
              )}
              {navCheck(activeTasks.length) ? (
                <>
                    {activeTasks.map(t => renderTaskRow(t, true))}
                </>
              ) : emptyState("No active tasks. Add suggestions or create one to get started!")}
            </>
        )}
        {activeTab === 'suggestions' && (
            navCheck(proposedTasks.length) ? proposedTasks.map(t => renderTaskRow(t)) : emptyState("No new suggestions. Click 'Absorb' to analyze.")
        )}
      </div>
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-(--foreground) text-(--background) px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2">
            <Copy size={12} className="text-(--theme-primary)" />
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

const navCheck = (len: number) => len > 0;
const emptyState = (msg: string) => (
    <div className="text-center py-20 text-(--foreground) opacity-40 text-sm italic">
        {msg}
    </div>
);

export default SuggestedTasks;
