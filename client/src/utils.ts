import { RRule,  rrulestr } from 'rrule';

export const parseRRule = (event: any): RRule | null => {
  try {
    if (event.recurrence && event.recurrence.length > 0) {
      const rruleString = event.recurrence[0].replace(/^RRULE:/, '');
      const options = RRule.parseString(rruleString);
      options.dtstart = new Date(event.start.dateTime || event.start.date);
      return new RRule(options);
    }
  } catch (error) {
    console.error('Error parsing RRULE:', error);
  }
  return null;
};
export const getNextInstanceDate = (event: any): Date | null => {
  const now = new Date();
  const eventStart = new Date(event.start.dateTime || event.start.date);
  const rule = parseRRule(event);

  if (rule) {
    try {
      if (eventStart > now) {
        return eventStart;
      }
      const nextInstance = rule.after(now, true);
      return nextInstance || null;
    } catch (error) {
      console.error('Error getting next instance date:', error);
    }
  }

  return eventStart >= now ? eventStart : null;
};

export const getLastInstanceDate = (event: any): Date | null => {
  const now = new Date();
  const eventStart = new Date(event.start.dateTime || event.start.date);
  const rule = parseRRule(event);

  if (rule) {
    try {
      if (eventStart > now) {
        return null; 
      }
      const instances = rule.between(eventStart, now, true);
      return instances.length > 0 ? instances[instances.length - 1] : null;
    } catch (error) {
      console.error('Error getting last instance date:', error);
    }
  }

  return eventStart <= now ? eventStart : null;
};



export const getPlainEnglishFrequency = (event: any): string => {
  if (event.recurrence && event.recurrence.length > 0) {
    const rruleString = event.recurrence[0].replace(/^RRULE:/, '');
    const rule = rrulestr(rruleString);
    const options = rule.options;

    const freq = options.freq;
    const interval = options.interval || 1;
    const byday = options.byweekday || [];
    const bysetpos = options.bysetpos;

    let frequency = '';
    let dayOfWeek = '';
    let weekOfMonth = '';

    switch (freq) {
      case RRule.DAILY:
        frequency = interval === 1 ? "Every day" : `Every ${interval} days`;
        break;
      case RRule.WEEKLY:
        frequency = interval === 1 ? "Every week" : `Every ${interval} weeks`;
        break;
      case RRule.MONTHLY:
        frequency = interval === 1 ? "Every month" : `Every ${interval} months`;
        break;
      case RRule.YEARLY:
        frequency = interval === 1 ? "Every year" : `Every ${interval} years`;
        break;
      default:
        return "Custom frequency";
    }


    if (byday.length > 0) {
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      dayOfWeek = ' on ' + byday.map((day: number) => dayNames[day]).join(', ');
    }


    if (freq === RRule.MONTHLY && bysetpos) {
      const positions = ['first', 'second', 'third', 'fourth', 'last'];
      const pos = Array.isArray(bysetpos) ? bysetpos[0] : bysetpos;
      weekOfMonth = ' on the ' + positions[Math.abs(pos) - 1];
    }

    let result = frequency;
    if (freq === RRule.MONTHLY && weekOfMonth) {
      result += weekOfMonth;
    }
    if (dayOfWeek) {
      result += dayOfWeek;
    }

    return result;
  }
  return "No recurrence";
};

export const getTimeBetweenInstances = (event: any): string => {
  const rule = parseRRule(event);
  if (rule) {
    const freq = rule.options.freq;
    const interval = rule.options.interval || 1;
    switch (freq) {
      case RRule.DAILY:
        return interval === 1 ? "1 day" : `${interval} days`;
      case RRule.WEEKLY:
        return interval === 1 ? "7 days" : `${interval * 7} days`;
      case RRule.MONTHLY:
        return interval === 1 ? "1 month" : `${interval} months`;
      case RRule.YEARLY:
        return interval === 1 ? "1 year" : `${interval} years`;
      default:
        return "Custom";
    }
  }
  return "N/A";
};

export const calculateEventsInNext12Months = (event: any): number => {
  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  const rule = parseRRule(event);
  if (rule) {
    try {
      const instances = rule.between(now, nextYear);
      return instances.length;
    } catch (error) {
      console.error('Error calculating events in next 12 months:', error);
    }
  }
  
  const eventStart = new Date(event.start.dateTime || event.start.date);
  return (eventStart >= now && eventStart < nextYear) ? 1 : 0;
};

export const calculateStats = (events: any[]): { totalRecurringEvents: number, totalInstancesPerYear: number } => {
  const totalRecurringEvents = events.filter(event => event.recurrence || event.recurringEventId).length;
  const totalInstancesPerYear = events.reduce((sum, event) => sum + calculateEventsInNext12Months(event), 0);
  return { totalRecurringEvents, totalInstancesPerYear };
};