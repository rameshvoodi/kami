import React, { useState, useEffect } from "react";
import { formatDistance } from "date-fns";

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
}

interface Calendar {
  kind: string;
  etag: string;
  id: string;
  summary: string;
  timeZone: string;
  colorId: string;
  backgroundColor: string;
  foregroundColor: string;
  selected: boolean;
  accessRole: string;
  defaultReminders: { method: string; minutes: number }[];
  notificationSettings: {
    notifications: { type: string; method: string }[];
  };
  primary: boolean;
  conferenceProperties: {
    allowedConferenceSolutionTypes: string[];
  };
}

const App = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(
    null
  );

  const fetchEvents = async () => {
    if (!selectedCalendarId) {
      console.log("No calendar selected");
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/events?calendar=${encodeURIComponent(
          selectedCalendarId
        )}`
      );
      if (!response.ok) {
        throw new Error("Error fetching events");
      }
      const data: Event[] = await response.json();
      setEvents(data);
      console.log("events", data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/calendars");
      if (!response.ok) {
        throw new Error("Error fetching calendars");
      }
      const data: Calendar[] = await response.json();
      setCalendars(data);
      if (data.length > 0) {
        setSelectedCalendarId(data[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogin = async () => {
    window.open("http://localhost:5000/api/login", "_blank");
  };

  const getEventFrequency = (recurrence?: string[]): string => {
    if (!recurrence || recurrence.length === 0) return "One-time event";
    const rule = recurrence[0];
    const freqMatch = rule.match(/FREQ=(\w+);/);
    if (!freqMatch) return "Custom frequency";
    const freq = freqMatch[1];
    switch (freq) {
      case "DAILY":
        return "Daily";
      case "WEEKLY":
        return "Weekly";
      case "MONTHLY":
        return "Monthly";
      case "YEARLY":
        return "Yearly";
      default:
        return "Custom frequency";
    }
  };

  const getRelativeTime = (date?: string) => {
    if (!date) return "No date available";
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  };
  const getTimeBetweenInstances = (start?: string, end?: string) => {
    if (!start || !end) return "N/A";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const getLastDate = (start?: string) => {
    if (!start) return "No date available";

    const startDate = new Date(start);
    const now = new Date();

    return startDate < now
      ? formatDistance(startDate, now) + " ago"
      : "No past instances";
  };

  useEffect(() => {
    fetchCalendars();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-blue-500 text-white p-4 shadow-md">
        <h1 className="text-xl font-semibold">My Calendar App</h1>
      </header>
      <button onClick={handleLogin}>Login</button>
      <main className="p-4">
        <div className="my-10 space-y-10">
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
            onClick={fetchCalendars}
          >
            Fetch Calendars
          </button>
          <h2 className="text-lg font-semibold mb-4">Calendars</h2>
          <div className="flex flex-wrap">
            {calendars.map((calendar) => (
              <label key={calendar.id} className="flex items-center mb-2 mr-2">
                <input
                  type="radio"
                  name="calendar"
                  value={calendar.id}
                  checked={selectedCalendarId === calendar.id}
                  onChange={() => setSelectedCalendarId(calendar.id)}
                  className="form-radio h-5 w-5 text-green-600"
                />
                <span className="ml-2 text-gray-700">{calendar.summary}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Events</h2>
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
            onClick={fetchEvents}
          >
            Fetch Events
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold">{event.summary}</h3>
                <p className="text-sm text-gray-600">
                  Frequency: {getEventFrequency(event.recurrence)}
                </p>
                <p className="text-sm text-gray-600">
                  Last Date:{" "}
                  {getLastDate(event.start.dateTime || event.start.date)}
                </p>
                <p className="text-sm text-gray-600">
                  Next Date:{" "}
                  {getRelativeTime(event.start.dateTime || event.start.date)}
                </p>
                <p className="text-sm text-gray-600">
                  Time between instances:{" "}
                  {getTimeBetweenInstances(
                    event.start.dateTime || event.start.date,
                    event.end.dateTime || event.end.date
                  )}
                </p>
                {event.htmlLink && (
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-blue-500 hover:text-blue-700 transition duration-150 ease-in-out"
                  >
                    View Event
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
