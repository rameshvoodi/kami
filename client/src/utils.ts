import { rrulestr } from 'rrule';

export const toLocalDate = (isoString: string): Date => {
  const [date] = isoString.split('T');
  return new Date(date);
};

export const getPlainEnglishFrequency = (event: any): string => {
  if (event.recurrence && event.recurrence.length > 0) {
    const rule = event.recurrence[0];
    const freqMatch = rule.match(/FREQ=(\w+);/);
    if (!freqMatch) return "Custom frequency";
    const freq = freqMatch[1];
    switch (freq) {
      case "DAILY":
        return "Every day";
      case "WEEKLY":
        return "Every week";
      case "MONTHLY":
        return "Every month";
      case "YEARLY":
        return "Every year";
      default:
        return "Custom frequency";
    }
  }
  return "No recurrence"; // Update to "Once" or another default value for non-recurring events
};

export const getNextInstanceDate = (event: any): Date | null => {
  if (event.recurrence && event.recurrence.length > 0) {
    const rule = rrulestr(event.recurrence[0]);
    const now = new Date();
    const nextInstance = rule.after(now, true); // Adjust true/false depending on whether inclusive or exclusive matching is needed
    return nextInstance || null;
  }
  return new Date(event.start.dateTime || event.start.date); // Adjust to handle non-recurring events
};



export const getLastInstanceDate = (event: any): Date | null => {
  if (event.recurrence && event.recurrence.length > 0) {
    const rule = rrulestr(event.recurrence[0]);
    const now = new Date();
    const lastInstance = rule.before(now, true); // Adjust true/false depending on whether inclusive or exclusive matching is needed
    return lastInstance || null;
  } else {
    return event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date);
  }
};



export const getTimeBetweenInstances = (lastDate: string, nextDate: string): string => {
  const last = new Date(lastDate);
  const next = new Date(nextDate);
  const diff = Math.abs(next.getTime() - last.getTime());
  const days = Math.ceil(diff / (1000 * 3600 * 24));
  return `${days} days`;
};

export const calculateEventsInNext12Months = (event: any): number => {
  if (event.recurrence && event.recurrence.length > 0) {
    const rule = rrulestr(event.recurrence[0]);
    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    const instances = rule.between(now, nextYear);
    return instances.length;
  }
  return 1; // Non-recurring events have one instance
};

export const calculateStats = (events: any[]): { totalRecurringEvents: number, totalInstancesPerYear: number } => {
  const totalRecurringEvents = events.filter(event => event.recurrence || event.recurringEventId).length;
  const totalInstancesPerYear = events.reduce((sum, event) => sum + calculateEventsInNext12Months(event), 0);
  return { totalRecurringEvents, totalInstancesPerYear };
};
