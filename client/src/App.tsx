import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

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
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchCalendars();
  }, []);

  const fetchEvents = async () => {
    if (!selectedCalendarId) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/events?calendar=${encodeURIComponent(
          selectedCalendarId
        )}`
      );
      if (!response.ok) throw new Error("Error fetching events");

      const data: Event[] = await response.json();
      console.log(data);
      setEvents(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/calendars");
      if (!response.ok) throw new Error("Error fetching calendars");

      const data: Calendar[] = await response.json();
      setCalendars(data);
      if (data.length > 0) setSelectedCalendarId(data[0].id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogin = () => {
    window.open("http://localhost:5000/api/login", "_blank");
  };

  const getEventFrequency = (event: Event): string => {
    if (event.recurrence && event.recurrence.length > 0) {
      const rule = event.recurrence[0];
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
    } else if (event.recurringEventId) {
      return "Recurring instance";
    }
    return "One-time event";
  };

  const getRelativeTime = (date?: string) => {
    if (!date) return "No date available";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
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
      ? formatDistanceToNow(startDate, { addSuffix: true }) + " ago"
      : "No past instances";
  };

  const calculateStats = (events: Event[]) => {
    const recurringEvents = events.filter(
      (event) => event.recurrence || event.recurringEventId
    );
    const instancesPerYear = recurringEvents.reduce((sum, event) => {
      const instances = event.recurrence ? event.recurrence.length : 1;
      return sum + instances;
    }, 0);

    return {
      totalRecurringEvents: recurringEvents.length,
      totalInstancesPerYear: instancesPerYear,
    };
  };

  const stats = calculateStats(events);

  const filterEvents = (events: Event[]) => {
    if (filter === "all") return events;
    if (filter === "recurring")
      return events.filter(
        (event) => event.recurrence || event.recurringEventId
      );
    if (filter === "non-recurring")
      return events.filter(
        (event) => !event.recurrence && !event.recurringEventId
      );
    return events;
  };

  const filteredEvents = filterEvents(events);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-blue-500 text-white p-4 shadow-md">
        <h1 className="text-xl font-semibold">My Calendar App</h1>
      </header>
      <button
        onClick={handleLogin}
        className="m-4 p-2 bg-blue-500 text-white rounded"
      >
        Login
      </button>
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
        <div className="mb-4">
          <p>Total Recurring Events: {stats.totalRecurringEvents}</p>
          <p>Total Instances per Year: {stats.totalInstancesPerYear}</p>
        </div>
        <div className="mb-4">
          <label className="mr-4">Filter Events:</label>
          <select
            className="p-2 border rounded"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Events</option>
            <option value="recurring">Recurring Events</option>
            <option value="non-recurring">Non-Recurring Events</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded my-6">
            <thead>
              <tr>
                <th className="py-2 px-4 bg-gray-200">Name of Meeting</th>
                <th className="py-2 px-4 bg-gray-200">Frequency</th>
                <th className="py-2 px-4 bg-gray-200">Last Date</th>
                <th className="py-2 px-4 bg-gray-200">Next Date</th>
                <th className="py-2 px-4 bg-gray-200">
                  Time Between Instances
                </th>
                <th className="py-2 px-4 bg-gray-200">
                  Events in Next 12 Months
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td className="border-t py-2 px-4">{event.summary}</td>
                  <td className="border-t py-2 px-4">
                    {getEventFrequency(event)}
                  </td>
                  <td className="border-t py-2 px-4">
                    {getLastDate(event.start.dateTime || event.start.date)}
                  </td>
                  <td className="border-t py-2 px-4">
                    {getRelativeTime(event.start.dateTime || event.start.date)}
                  </td>
                  <td className="border-t py-2 px-4">
                    {getTimeBetweenInstances(
                      event.start.dateTime || event.start.date,
                      event.end.dateTime || event.end.date
                    )}
                  </td>
                  <td className="border-t py-2 px-4">
                    {event.recurrence?.length || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default App;
