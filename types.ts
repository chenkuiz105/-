export enum EventType {
  FIXED = 'FIXED',       // Imported or manually created rigid events
  PLANNED = 'PLANNED',   // AI scheduled tasks
  HOLIDAY = 'HOLIDAY'
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO Date String
  end: string;   // ISO Date String
  type: EventType;
  color?: string;
  recurrence?: string; // Simple description like 'weekly'
  isAllDay?: boolean;
}

export interface Task {
  id: string;
  title: string;
  estimatedMinutes: number;
  deadline?: string; // ISO Date String
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'scheduled' | 'completed';
}

export interface SchedulingConstraints {
  // 7 days x 24 hours boolean grid. availableSlots[dayIndex][hourIndex]
  availableSlots: boolean[][]; 
  weeklyMaxHours: number[]; // Array of 7 numbers, index 0 = Sunday, 1 = Monday...
}

export interface PlanRequest {
  currentEvents: CalendarEvent[];
  tasks: Task[];
  constraints: SchedulingConstraints;
}

export interface GeneratedPlan {
  id: string;
  strategyName: string;
  description: string;
  events: CalendarEvent[];
  tags: string[]; // e.g., ["High Focus", "Interleaved"]
}

export interface ImportResult {
  events: CalendarEvent[];
  summary: string;
}