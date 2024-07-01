import React, { useEffect } from "react";

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
  transparency?: string;
  recurrenceInstances?: string[];
}

const events: Event[] = [
  {
    kind: "calendar#event",
    etag: '"3181159875584000"',
    id: "abc123",
    status: "confirmed",
    htmlLink: "https://www.google.com/calendar/event?eid=abc123",
    created: "2021-06-01T12:00:00Z",
    updated: "2021-06-01T12:00:00Z",
    summary: "Sample Recurring Event",
    creator: {
      email: "creator@example.com",
      self: true,
    },
    organizer: {
      email: "organizer@example.com",
      self: true,
    },
    start: { dateTime: "2024-07-01T10:00:00Z" },
    end: { dateTime: "2024-07-01T11:00:00Z" },
    recurrence: ["RRULE:FREQ=DAILY;COUNT=10"],
    recurringEventId: "abc123",
    originalStartTime: { date: "2024-07-01" },
    iCalUID: "abc123@google.com",
    sequence: 1,
    reminders: {
      useDefault: true,
    },
    eventType: "default",
    recurrenceInstances: [
      "2024-07-01T10:00:00Z",
      "2024-07-02T10:00:00Z",
      "2024-07-03T10:00:00Z",
      "2024-07-04T10:00:00Z",
      "2024-07-05T10:00:00Z",
      "2024-07-06T10:00:00Z",
      "2024-07-07T10:00:00Z",
      "2024-07-08T10:00:00Z",
      "2024-07-09T10:00:00Z",
      "2024-07-10T10:00:00Z",
    ],
  },
];

const calculateEventsInNext12Months = (event: Event): number => {
  const now = new Date();
  const nextYear = new Date(now);
  nextYear.setFullYear(now.getFullYear() + 1);

  let count = 0;
  if (event.recurrenceInstances) {
    event.recurrenceInstances.forEach((instance) => {
      const instanceDate = new Date(instance);
      if (instanceDate > now && instanceDate <= nextYear) {
        count++;
      }
    });
  }
  return count;
};

const EventDebug = () => {
  useEffect(() => {
    events.forEach((event) => {
      const eventsInNext12Months = calculateEventsInNext12Months(event);
      console.log(
        `Event: ${event.summary}, Events in Next 12 Months: ${eventsInNext12Months}`
      );
    });
  }, []);

  return (
    <div>
      <h1>Event Debug</h1>
      <p>Check the console for event calculations.</p>
    </div>
  );
};

export default EventDebug;
