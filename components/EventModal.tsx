import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar as CalendarIcon, Repeat, Trash2, Save, AlertTriangle } from 'lucide-react';
import { CalendarEvent, EventType } from '../types';
import { generateId } from '../utils/helpers';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  selectedDate?: Date;
  existingEvent?: CalendarEvent | null;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, selectedDate, existingEvent }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('weekly');
  
  // Local state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset or Populate state when modal opens/changes
  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false); // Reset confirmation state
      if (existingEvent) {
        setTitle(existingEvent.title);
        setDescription(existingEvent.description || '');
        const start = new Date(existingEvent.start);
        const end = new Date(existingEvent.end);
        setStartDate(start.toISOString().split('T')[0]);
        setStartTime(start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        setEndDate(end.toISOString().split('T')[0]);
        setEndTime(end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        setIsRecurring(!!existingEvent.recurrence);
        setRecurrencePattern(existingEvent.recurrence || 'weekly');
      } else {
        const defaultDate = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        setTitle('');
        setDescription('');
        setStartDate(defaultDate);
        setStartTime('09:00');
        setEndDate(defaultDate);
        setEndTime('10:00');
        setIsRecurring(false);
        setRecurrencePattern('weekly');
      }
    }
  }, [isOpen, existingEvent, selectedDate]);

  if (!isOpen) return null;

  const handleSave = () => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    const eventToSave: CalendarEvent = {
      id: existingEvent ? existingEvent.id : generateId(),
      title,
      description,
      start: start.toISOString(),
      end: end.toISOString(),
      type: existingEvent ? existingEvent.type : EventType.FIXED,
      recurrence: isRecurring ? recurrencePattern : undefined
    };

    onSave(eventToSave);
    onClose();
  };

  const handleConfirmDelete = () => {
    if (existingEvent && onDelete) {
      onDelete(existingEvent.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800">
            {existingEvent ? '編輯事件' : '新增事件'}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">事件標題</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：團隊會議"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sprite-500 focus:border-transparent outline-none transition-all text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <CalendarIcon size={14} /> 開始時間
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Clock size={14} /> 結束時間
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
          </div>

          <div>
             <div className="flex items-center gap-2 mb-2">
                <input 
                  type="checkbox" 
                  id="recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded text-sprite-600 focus:ring-sprite-500"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-slate-700 select-none cursor-pointer flex items-center gap-1">
                  <Repeat size={14} /> 重複事件
                </label>
             </div>
             
             {isRecurring && (
               <div className="pl-6 pt-1 animate-in slide-in-from-top-2">
                 <select 
                    value={recurrencePattern}
                    onChange={(e) => setRecurrencePattern(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
                 >
                   <option value="daily">每天</option>
                   <option value="weekly">每週</option>
                   <option value="monthly">每月</option>
                 </select>
               </div>
             )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="新增備註..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sprite-500 focus:border-transparent outline-none resize-none text-sm text-slate-900"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 flex justify-between gap-3 border-t border-slate-100 h-16">
          <div className="flex items-center">
            {existingEvent && onDelete && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                  <span className="text-sm text-slate-600 font-medium">確定刪除？</span>
                  <button 
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded shadow-sm transition-colors"
                  >
                    是
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded shadow-sm transition-colors"
                  >
                    否
                  </button>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 border border-transparent hover:border-red-100"
                >
                  <Trash2 size={16} /> 刪除
                </button>
              )
            )}
          </div>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button 
              type="button"
              onClick={handleSave}
              disabled={!title}
              className="px-4 py-2 text-sm font-medium text-white bg-sprite-600 hover:bg-sprite-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              <Save size={16} /> 儲存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModal;