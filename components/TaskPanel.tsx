import React, { useState } from 'react';
import { Plus, Sparkles, Trash2, Clock, CheckCircle2, Circle } from 'lucide-react';
import { Task, SchedulingConstraints } from '../types';
import { generateId } from '../utils/helpers';

interface TaskPanelProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onSchedule: (constraints: SchedulingConstraints) => void;
  isScheduling: boolean;
}

const TaskPanel: React.FC<TaskPanelProps> = ({ tasks, setTasks, onSchedule, isScheduling }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  // Changed default duration from 60 to 120 minutes
  const [newTaskDuration, setNewTaskDuration] = useState(120);
  const [activeTab, setActiveTab] = useState<'tasks' | 'constraints'>('tasks');
  
  // 0 = Sunday, 1 = Monday ... 6 = Saturday
  const [weeklyMaxHours, setWeeklyMaxHours] = useState<number[]>([2, 6, 6, 6, 6, 6, 2]);

  // Availability Grid State: 7 days x 24 hours. true = available.
  const [availableSlots, setAvailableSlots] = useState<boolean[][]>(() => {
    // Default: 9am to 6pm on weekdays (Mon-Fri)
    const slots = Array(7).fill(null).map(() => Array(24).fill(false));
    for (let d = 1; d <= 5; d++) {
      for (let h = 9; h < 18; h++) {
        slots[d][h] = true;
      }
    }
    return slots;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState(true); // Are we adding or removing?

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: generateId(),
      title: newTaskTitle,
      estimatedMinutes: newTaskDuration,
      priority: 'medium',
      status: 'pending'
    };
    setTasks([...tasks, task]);
    setNewTaskTitle('');
    // Reset to default 120 minutes
    setNewTaskDuration(120);
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleAutoSchedule = () => {
    onSchedule({
      availableSlots,
      weeklyMaxHours
    });
  };

  const updateDailyLimit = (dayIndex: number, hours: number) => {
    const newLimits = [...weeklyMaxHours];
    newLimits[dayIndex] = hours;
    setWeeklyMaxHours(newLimits);
  };

  const toggleSlot = (dayIndex: number, hourIndex: number, forceState?: boolean) => {
    const newSlots = availableSlots.map(row => [...row]);
    newSlots[dayIndex][hourIndex] = forceState !== undefined ? forceState : !newSlots[dayIndex][hourIndex];
    setAvailableSlots(newSlots);
  };

  const handleMouseDown = (dayIndex: number, hourIndex: number) => {
    setIsDragging(true);
    const newState = !availableSlots[dayIndex][hourIndex];
    setDragState(newState);
    toggleSlot(dayIndex, hourIndex, newState);
  };

  const handleMouseEnter = (dayIndex: number, hourIndex: number) => {
    if (isDragging) {
      toggleSlot(dayIndex, hourIndex, dragState);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const scheduledTasks = tasks.filter(t => t.status === 'scheduled');
  const days = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="w-96 bg-white border-r border-slate-200 h-full flex flex-col shadow-xl z-20" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="text-sprite-500 fill-sprite-100" />
          計畫精靈
        </h2>
        <p className="text-xs text-slate-500 mt-1">AI 驅動的任務調度器</p>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'tasks' ? 'text-sprite-600 border-b-2 border-sprite-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          任務列表 ({pendingTasks.length})
        </button>
        <button 
          onClick={() => setActiveTab('constraints')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'constraints' ? 'text-sprite-600 border-b-2 border-sprite-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          規劃規則
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
        {activeTab === 'tasks' ? (
          <div className="p-4 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">新增任務</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="例如：複習心臟病學章節..."
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sprite-500 outline-none text-slate-800 placeholder-slate-400"
                />
                <button 
                  onClick={addTask}
                  className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-sprite-100 hover:text-sprite-600 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                 <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <select 
                      value={newTaskDuration}
                      onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                      className="bg-transparent border-none focus:ring-0 text-slate-700 font-medium cursor-pointer"
                    >
                      <option value={30}>30分鐘</option>
                      <option value={45}>45分鐘</option>
                      <option value={60}>1小時</option>
                      <option value={90}>1.5小時</option>
                      <option value={120}>2小時</option>
                      <option value={180}>3小時</option>
                    </select>
                 </div>
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">待辦 ({pendingTasks.length})</label>
               {pendingTasks.length === 0 && (
                 <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-lg">
                   暫無任務。
                 </div>
               )}
               {pendingTasks.map(task => (
                 <div key={task.id} className="group flex items-start justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-sprite-300 transition-all">
                    <div className="flex items-start gap-3">
                       <Circle size={18} className="text-slate-300 mt-0.5" />
                       <div>
                         <p className="text-sm font-medium text-slate-800">{task.title}</p>
                         <p className="text-xs text-slate-500">{task.estimatedMinutes} 分鐘</p>
                       </div>
                    </div>
                    <button onClick={() => removeTask(task.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={16} />
                    </button>
                 </div>
               ))}
            </div>
            
            {scheduledTasks.length > 0 && (
                <div className="space-y-2 opacity-60">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">已計畫</label>
                {scheduledTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <CheckCircle2 size={18} className="text-green-500" />
                        <span className="text-sm text-slate-600 line-through decoration-slate-400">{task.title}</span>
                    </div>
                ))}
                </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-8">
            <div className="p-4 bg-magic-50 rounded-xl border border-magic-100">
               <h3 className="font-medium text-magic-600 mb-2 text-sm">每週時段配置</h3>
               <p className="text-xs text-slate-600">在下方週曆中，拖曳或點擊選擇 <span className="font-bold text-sprite-600">允許 AI 排程的時段</span>。未選取的時段將不會安排任何任務。</p>
            </div>

            {/* Availability Grid */}
            <div className="select-none">
              <label className="block text-sm font-medium text-slate-700 mb-2">排程可用時段</label>
              <div className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm h-72 flex flex-col">
                 
                 {/* Combined Scrollable Area for Header + Body to ensure alignment */}
                 <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    
                    {/* Sticky Header with fixed column widths */}
                    <div className="grid grid-cols-[3rem_repeat(7,1fr)] sticky top-0 z-10 bg-slate-100 border-b border-slate-200 shadow-sm">
                        <div className="h-8 flex items-center justify-center text-[10px] text-slate-400 font-medium bg-slate-100 border-r border-slate-200">時</div>
                        {days.map((d, i) => (
                          <div key={i} className="h-8 flex items-center justify-center text-xs text-slate-700 font-bold border-r border-slate-200 bg-slate-100 last:border-r-0">
                            {d}
                          </div>
                        ))}
                    </div>

                    {/* Grid Body with same fixed column widths */}
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div key={hour} className="grid grid-cols-[3rem_repeat(7,1fr)] h-8 hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                        {/* Time Label */}
                        <div className="text-[10px] text-slate-400 flex items-center justify-center border-r border-slate-100 bg-slate-50/50">
                          {hour}:00
                        </div>
                        {/* Cells */}
                        {Array.from({ length: 7 }).map((_, day) => (
                          <div 
                            key={`${day}-${hour}`}
                            onMouseDown={() => handleMouseDown(day, hour)}
                            onMouseEnter={() => handleMouseEnter(day, hour)}
                            className={`
                              border-r border-slate-50 cursor-pointer transition-colors duration-75 flex items-center justify-center last:border-r-0
                              ${availableSlots[day][hour] ? 'bg-sprite-500' : 'bg-transparent'}
                            `}
                            title={`${days[day]} ${hour}:00 - ${hour+1}:00`}
                          >
                          </div>
                        ))}
                      </div>
                    ))}
                 </div>

                 <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center gap-3 text-xs text-slate-500 justify-end shrink-0">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-sprite-500 rounded-sm"></div> <span>可用</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-white border border-slate-200 rounded-sm"></div> <span>不可用</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Daily Limits */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">每日最大工作量 (小時)</label>
              <div className="space-y-3">
                {weeklyMaxHours.map((hours, index) => (
                  <div key={index} className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${hours > 0 ? 'bg-sprite-100 text-sprite-700' : 'bg-slate-100 text-slate-400'}`}>
                        {days[index]}
                     </div>
                     <input 
                       type="range"
                       min={0} max={12}
                       value={hours}
                       onChange={(e) => updateDailyLimit(index, Number(e.target.value))}
                       className="flex-1 accent-sprite-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                     />
                     <span className="w-12 text-right text-sm font-medium text-slate-600">{hours} h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <button
          onClick={handleAutoSchedule}
          disabled={pendingTasks.length === 0 || isScheduling}
          className={`
            w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all
            flex items-center justify-center gap-2
            ${pendingTasks.length === 0 || isScheduling
              ? 'bg-slate-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-sprite-600 to-magic-600 hover:scale-[1.02] hover:shadow-sprite-200/50'
            }
          `}
        >
          {isScheduling ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
             <Sparkles size={18} />
          )}
          {isScheduling ? '正在優化日程...' : '自動調度任務'}
        </button>
      </div>
    </div>
  );
};

export default TaskPanel;