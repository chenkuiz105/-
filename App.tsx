import React, { useState, useEffect } from 'react';
import CalendarView from './components/CalendarView';
import TaskPanel from './components/TaskPanel';
import ImportModal from './components/ImportModal';
import EventModal from './components/EventModal';
import StrategySelectionModal from './components/StrategySelectionModal';
import { CalendarEvent, Task, SchedulingConstraints, EventType, GeneratedPlan } from './types';
import { generateStudyPlan } from './services/geminiService';

const App: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [generatedPlans, setGeneratedPlans] = useState<GeneratedPlan[]>([]);
  
  const [isScheduling, setIsScheduling] = useState(false);

  // Initial Demo Data
  useEffect(() => {
    // Just a sample initial event
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    const end = new Date(today);
    end.setHours(11, 30, 0, 0);

    setEvents([{
        id: 'init-1',
        title: '專案啟動會議',
        description: '初始會議',
        start: today.toISOString(),
        end: end.toISOString(),
        type: EventType.FIXED
    }]);
  }, []);

  const handleImportComplete = (importedEvents: CalendarEvent[]) => {
    // Merge new events
    setEvents(prev => [...prev, ...importedEvents]);
  };

  const handleManualEventSave = (event: CalendarEvent) => {
    if (editingEvent) {
      // Update existing
      setEvents(prev => prev.map(e => e.id === event.id ? event : e));
      setEditingEvent(null);
    } else {
      // Create new
      if (event.recurrence === 'daily') {
         // Mock recurrence expansion for demo (next 7 days)
         const expanded: CalendarEvent[] = [];
         for(let i=0; i<7; i++) {
            const start = new Date(event.start);
            start.setDate(start.getDate() + i);
            const end = new Date(event.end);
            end.setDate(end.getDate() + i);
            expanded.push({
               ...event,
               id: event.id + `-${i}`,
               start: start.toISOString(),
               end: end.toISOString()
            });
         }
         setEvents(prev => [...prev, ...expanded]);
      } else {
         setEvents(prev => [...prev, event]);
      }
    }
  };

  const handleEventDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setEditingEvent(null);
  };

  const handleEventUpdate = (id: string, newStart: Date, newEnd: Date) => {
    setEvents(prev => prev.map(ev => 
      ev.id === id 
        ? { ...ev, start: newStart.toISOString(), end: newEnd.toISOString() }
        : ev
    ));
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  };

  const handleAddEventClick = () => {
    setEditingEvent(null);
    setIsEventModalOpen(true);
  };

  const handleScheduleRequest = async (constraints: SchedulingConstraints) => {
    setIsScheduling(true);
    try {
      // 1. Generate Plans
      const plans = await generateStudyPlan({
        currentEvents: events,
        tasks: tasks,
        constraints: constraints
      });
      
      // 2. Open Selection Modal
      setGeneratedPlans(plans);
      setIsStrategyModalOpen(true);

    } catch (err) {
      console.error(err);
      alert("生成計畫失敗，請確認網路連線或稍後重試。");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleApplyPlan = (plan: GeneratedPlan) => {
    // 3. Apply Selected Plan
    setEvents(prev => [...prev, ...plan.events]);
    
    // Update task status to scheduled
    // For simplicity, we assume all pending tasks were considered for scheduling
    // In a real app, we might check which specific tasks were in the plan
    setTasks(prev => prev.map(t => ({
        ...t,
        status: t.status === 'pending' ? 'scheduled' : t.status
    })));

    setIsStrategyModalOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans">
      
      {/* Sidebar Task Manager */}
      <TaskPanel 
        tasks={tasks} 
        setTasks={setTasks} 
        onSchedule={handleScheduleRequest}
        isScheduling={isScheduling}
      />

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col relative">
        <CalendarView 
          events={events}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          onAddEventClick={handleAddEventClick}
          onImportClick={() => setIsImportModalOpen(true)}
          onEventUpdate={handleEventUpdate}
          onEventClick={handleEventClick}
        />
      </div>

      {/* Modals */}
      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImportComplete={handleImportComplete}
      />
      
      <EventModal 
        isOpen={isEventModalOpen} 
        onClose={() => { setIsEventModalOpen(false); setEditingEvent(null); }}
        onSave={handleManualEventSave}
        onDelete={handleEventDelete}
        existingEvent={editingEvent}
      />

      <StrategySelectionModal
        isOpen={isStrategyModalOpen}
        onClose={() => setIsStrategyModalOpen(false)}
        plans={generatedPlans}
        onSelectPlan={handleApplyPlan}
      />

    </div>
  );
};

export default App;