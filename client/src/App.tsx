import React, { useState } from "react";

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
  start: {
    date: string;
  };
  end: {
    date: string;
  };
  recurringEventId: string;
  originalStartTime: {
    date: string;
  };
  transparency: string;
  iCalUID: string;
  sequence: number;
  reminders: {
    useDefault: boolean;
  };
  eventType: string;
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
  defaultReminders: Array<{
    method: string;
    minutes: number;
  }>;
  notificationSettings: {
    notifications: Array<{
      type: string;
      method: string;
    }>;
  };
  primary?: boolean;
  conferenceProperties: {
    allowedConferenceSolutionTypes: Array<string>;
  };
}
// `http://localhost:5000/api/events?calendar=${encodeURIComponent(
//         selectedCalendarId
//       )}`
function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(
    null
  );
  if (selectedCalendarId !== null) {
    console.log(selectedCalendarId);
  }

  const fetchEvents = async () => {
    const response = await fetch(`http://localhost:5000/api/events`);
    const data = await response.json();
    setEvents(data);
  };

  const fetchCalendars = async () => {
    const response = await fetch("http://localhost:5000/api/calendars");
    const data = await response.json();
    setCalendars(data);
    if (data.length > 0) {
      setSelectedCalendarId(data[0].id); // Automatically select the first calendar
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-blue-500 text-white p-4 shadow-md">
        <h1 className="text-xl font-semibold">My Calendar App</h1>
      </header>
      <main className="p-4">
        <div className="my-10 space-y-5">
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
                  Starts: {event.start.date}
                </p>
                <p className="text-sm text-gray-600">Ends: {event.end.date}</p>
                <a
                  href={event.htmlLink}
                  className="text-blue-500 hover:text-blue-700 transition duration-150 ease-in-out"
                >
                  View Event
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
