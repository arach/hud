import React from 'react';
import { Task } from '../types';
import { Square, CheckSquare, Hash } from 'lucide-react';

interface TaskManagerProps {
  tasks: Task[];
  onComplete: (id: string) => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ tasks, onComplete }) => {
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="flex flex-col h-full bg-black border border-neutral-700 shadow-2xl pointer-events-auto">
      {/* Window Header */}
      <div className="h-8 bg-neutral-900 border-b border-neutral-700 flex items-center justify-between px-3 select-none">
         <span className="text-xs font-bold tracking-widest text-neutral-400">SESSIONS</span>
         <div className="flex gap-1.5">
           <div className="w-2 h-2 bg-neutral-700"></div>
           <div className="w-2 h-2 bg-neutral-700"></div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedTasks.length === 0 && (
           <div className="p-8 text-center text-neutral-600 text-xs">
             // NULL_SET
           </div>
        )}
        
        {sortedTasks.map((task) => (
          <div 
            key={task.id}
            className={`flex items-start gap-3 p-3 border-b border-neutral-800 hover:bg-neutral-900 transition-colors cursor-default ${
              task.status === 'completed' ? 'opacity-30' : ''
            }`}
          >
            <button
              onClick={() => onComplete(task.id)}
              disabled={task.status === 'completed'}
              className={`mt-0.5 flex-shrink-0 ${
                task.status === 'completed' 
                  ? 'text-neutral-600' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {task.status === 'completed' ? <CheckSquare size={14} /> : <Square size={14} />}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className={`text-xs ${task.status === 'completed' ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
                {task.title}
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                 <span className={`text-[9px] px-1 border ${
                    task.priority === 'high' ? 'border-red-900 text-red-500' : 
                    task.priority === 'medium' ? 'border-yellow-900 text-yellow-500' : 'border-neutral-700 text-neutral-500'
                 }`}>
                    {task.priority.toUpperCase()}
                 </span>
                 <span className="text-[9px] text-neutral-600 tabular-nums ml-auto">
                    ID_::{task.id.substring(0,4)}
                 </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Status Footer */}
      <div className="h-6 border-t border-neutral-800 bg-black flex items-center px-3 gap-2">
         <Hash size={10} className="text-neutral-600" />
         <span className="text-[10px] text-neutral-500">{tasks.length} OBJECTS</span>
      </div>
    </div>
  );
};

export default TaskManager;