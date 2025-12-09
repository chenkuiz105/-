import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Download, Upload } from 'lucide-react';
import { CalendarEvent, EventType } from '../types';
import { exportToICS } from '../utils/helpers';

interface CalendarViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  onAddEventClick: () => void;
  onImportClick: () => void;
  onEventUpdate: (id: string, newStart: Date, newEnd: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  events, 
  currentDate, 
  setCurrentDate, 
  onAddEventClick, 
  onImportClick, 
  onEventUpdate,
  onEventClick
}) => {
  const weekStart = useMemo(() => {
    const date = new Date(currentDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(date.setDate(diff));
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });
  }, [weekStart]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventStyle = (event: CalendarEvent, day: Date) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    // Simple vertical positioning
    const startHour = start.getHours() + start.getMinutes() / 60;
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    return {
      top: `${startHour * 64}px`, // 64px per hour
      height: `${Math.max(duration * 64, 20)}px`, // Minimum height
    };
  };

  const dayEvents = (day: Date) => {
    return events.filter(e => {
        const eStart = new Date(e.start);
        return eStart.getDate() === day.getDate() && 
               eStart.getMonth() === day.getMonth() && 
               eStart.getFullYear() === day.getFullYear();
    });
  };

  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  // Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData("eventId", eventId);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, dayDate: Date) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("eventId");
    const event = events.find(ev => ev.id === eventId);
    
    if (!event) return;

    // Calculate time based on click Y position
    const rect = e.currentTarget.getBoundingClientRect();
    const pixelsFromTop = e.clientY - rect.top;
    
    // Calculate precise time (minutes)
    // 64px = 60 mins
    const minutesFromTop = (pixelsFromTop / 64) * 60;
    
    // Snap to 5 minutes (high precision)
    const snappedMinutes = Math.round(minutesFromTop / 5) * 5;
    
    const hours = Math.floor(snappedMinutes / 60);
    const minutes = snappedMinutes % 60;

    // Construct new dates
    const newStart = new Date(dayDate);
    newStart.setHours(hours, minutes, 0, 0);

    const oldStart = new Date(event.start);
    const oldEnd = new Date(event.end);
    const duration = oldEnd.getTime() - oldStart.getTime();

    const newEnd = new Date(newStart.getTime() + duration);

    onEventUpdate(eventId, newStart, newEnd);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-6">
           <h2 className="text-2xl font-bold text-slate-800">
             {weekStart.toLocaleDateString('zh-TW', { month: 'long', year: 'numeric' })}
           </h2>
           <div className="flex bg-slate-100 rounded-lg p-1">
             <button onClick={prevWeek} className="p-1 hover:bg-white rounded-md shadow-sm transition-all"><ChevronLeft size={20} className="text-slate-600" /></button>
             <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-medium text-slate-600 hover:bg-white rounded-md transition-all">今天</button>
             <button onClick={nextWeek} className="p-1 hover:bg-white rounded-md shadow-sm transition-all"><ChevronRight size={20} className="text-slate-600" /></button>
           </div>
        </div>

        <div className="flex gap-3">
             <button 
                onClick={onImportClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
             >
                <Upload size={16} /> 匯入文件
             </button>
             <button 
                onClick={() => exportToICS(events)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
             >
                <Download size={16} /> 同步到 Google 日曆
             </button>
             <button 
                onClick={onAddEventClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
             >
                <CalIcon size={16} /> 新增事件
             </button>
        </div>
      </div>

      {/* Calendar Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
        
        {/* Days Header - Sticky */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 flex">
            {/* Time Column Placeholder */}
            <div className="w-16 flex-none border-r border-slate-100 bg-slate-50"></div>
            
            {/* Days Grid */}
            <div className="flex-1 grid grid-cols-7">
                {weekDays.map((day, i) => (
                    <div key={i} className={`text-center py-3 border-r border-slate-100 ${day.toDateString() === new Date().toDateString() ? 'bg-blue-50/50' : ''}`}>
                        <p className="text-xs font-semibold text-slate-500 uppercase">{day.toLocaleDateString('zh-TW', { weekday: 'short' })}</p>
                        <div className={`w-8 h-8 mx-auto mt-1 flex items-center justify-center rounded-full text-lg font-medium ${day.toDateString() === new Date().toDateString() ? 'bg-sprite-600 text-white shadow-md' : 'text-slate-800'}`}>
                            {day.getDate()}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Scrollable Grid */}
        <div className="flex relative min-h-[1536px]"> {/* 24h * 64px */}
            {/* Time Labels */}
            <div className="w-16 flex-none border-r border-slate-100 bg-slate-50">
                {hours.map(hour => (
                    <div key={hour} className="h-16 text-xs text-slate-400 text-right pr-2 pt-1 relative -top-2">
                        {hour === 0 ? '' : `${hour}:00`}
                    </div>
                ))}
            </div>
            
            {/* Day Columns */}
            <div className="flex-1 grid grid-cols-7 relative">
                {/* Horizontal Hour Lines */}
                {hours.map(h => (
                    <div key={h} className="absolute w-full border-b border-slate-50 h-16 pointer-events-none" style={{ top: `${h * 64}px` }} />
                ))}

                {/* Vertical Day Lines & Events */}
                {weekDays.map((day, colIndex) => (
                    <div 
                        key={colIndex} 
                        className="relative border-r border-slate-100 h-full group"
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, day)}
                    >
                         {dayEvents(day).map(event => (
                             <div
                                key={event.id}
                                draggable="true"
                                onDragStart={(e) => onDragStart(e, event.id)}
                                onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                style={getEventStyle(event, day)}
                                className={`
                                    absolute left-1 right-1 rounded-md p-2 text-xs border cursor-move overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg hover:z-20
                                    ${event.type === EventType.PLANNED 
                                        ? 'bg-gradient-to-br from-magic-100 to-magic-50 border-magic-200 text-magic-800' 
                                        : 'bg-gradient-to-br from-sprite-100 to-sprite-50 border-sprite-200 text-sprite-800'
                                    }
                                `}
                                title={`${event.title}\n${event.description || ''}`}
                             >
                                <div className="font-semibold truncate">{event.title}</div>
                                <div className="opacity-80 text-[10px] mt-0.5 flex items-center gap-1">
                                    {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})} 
                                </div>
                             </div>
                         ))}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;