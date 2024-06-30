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

const eventData: Event = {
    "kind": "calendar#event",
    "etag": "\"3437272843210000\"",
    "id": "3654flt23h4go055isrk4goah0_20240724",
    "status": "confirmed",
    "htmlLink": "https://www.google.com/calendar/event?eid=MzY1NGZsdDIzaDRnbzA1NWlzcms0Z29haDBfMjAyNDA3MjQgcmFtZXNoa3VtYXJ2b29kaTIwMDJAbQ",
    "created": "2024-06-17T15:00:21.000Z",
    "updated": "2024-06-17T15:00:21.605Z",
    "summary": "allu arjun",
    "creator": {
      "email": "rameshkumarvoodi2002@gmail.com",
      "self": true
    },
    "organizer": {
      "email": "rameshkumarvoodi2002@gmail.com",
      "self": true
    },
    "start": {
      "date": "2024-07-24"
    },
    "end": {
      "date": "2024-07-25"
    },
    "recurringEventId": "3654flt23h4go055isrk4goah0",
    "originalStartTime": {
      "date": "2024-07-24"
    },
    "transparency": "transparent",
    "iCalUID": "3654flt23h4go055isrk4goah0@google.com",
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
  
  