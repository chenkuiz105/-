import { CalendarEvent, EventType } from '../types';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Simple collision detection
export const hasOverlap = (start: Date, end: Date, events: CalendarEvent[]): boolean => {
  return events.some(event => {
    const eStart = new Date(event.start);
    const eEnd = new Date(event.end);
    return (start < eEnd && end > eStart);
  });
};

export const exportToICS = (events: CalendarEvent[]): void => {
  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Planning Sprite//EN\n";
  
  const formatDateICS = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  events.forEach(event => {
    icsContent += "BEGIN:VEVENT\n";
    icsContent += `UID:${event.id}@planningsprite.com\n`;
    icsContent += `DTSTAMP:${formatDateICS(new Date().toISOString())}\n`;
    icsContent += `DTSTART:${formatDateICS(event.start)}\n`;
    icsContent += `DTEND:${formatDateICS(event.end)}\n`;
    icsContent += `SUMMARY:${event.title}\n`;
    if (event.description) icsContent += `DESCRIPTION:${event.description}\n`;
    icsContent += "END:VEVENT\n";
  });

  icsContent += "END:VCALENDAR";

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'planning_sprite_schedule.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
