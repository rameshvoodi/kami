import { formatDistance } from "date-fns";

// Define interfaces to match event data structure
interface Event {
  kind: string;
  etag: string;
  id: string;
  status: string;
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  creator: {
    email: string;
    self: boolean;
  };
  organizer: {
    email: string;
    self: boolean;
  };
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: { date: string };
  iCalUID: string;
  sequence: number;
  reminders: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
  eventType: string;
  transparency?: string; // Add this line
}

// Function to get relative time from now to a given date
const getRelativeTime = (date?: string) => {
  if (!date) return "No date available";
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};

// Function to calculate days between two dates
const getTimeBetweenInstances = (start?: string, end?: string) => {
  if (!start || !end) return "N/A";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays} days`;
};

// Function to get formatted distance from a given date to now
const getLastDate = (start?: string) => {
  if (!start) return "No date available";

  const startDate = new Date(start);
  const now = new Date();

  return startDate < now
    ? formatDistance(startDate, now) + " ago"
    : "No past instances";
};

// Test data based on provided eventData
const eventData: Event = {
  "kind": "calendar#event",
  "etag": "\"3437272762204000\"",
  "id": "78nb67tb7q7bjljpi44ov615v0_20240701",
  "status": "confirmed",
  "htmlLink": "https://www.google.com/calendar/event?eid=NzhuYjY3dGI3cTdiamxqcGk0NG92NjE1djBfMjAyNDA3MDEgcmFtZXNoa3VtYXJ2b29kaTIwMDJAbQ",
  "created": "2024-06-17T14:59:41.000Z",
  "updated": "2024-06-17T14:59:41.102Z",
  "summary": "random event papa",
  "creator": {
    "email": "rameshkumarvoodi2002@gmail.com",
    "self": true
  },
  "organizer": {
    "email": "rameshkumarvoodi2002@gmail.com",
    "self": true
  },
  "start": {
    "date": "2024-07-01"
  },
  "end": {
    "date": "2024-07-04"
  },
  "recurringEventId": "78nb67tb7q7bjljpi44ov615v0",
  "originalStartTime": {
    "date": "2024-07-01"
  },
  "transparency": "transparent",
  "iCalUID": "78nb67tb7q7bjljpi44ov615v0@google.com",
  "sequence": 0,
  "reminders": {
    "useDefault": false
  },
  "eventType": "default"
};

// Test function usage with the eventData
console.log("Event Summary:", eventData.summary);
console.log("Relative Time:", getRelativeTime(eventData.start.date));
console.log("Time Between Instances:", getTimeBetweenInstances(eventData.start.date, eventData.end.date));
console.log("Last Date:", getLastDate(eventData.start.date));
