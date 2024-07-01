import React, { useState, useEffect } from "react";
import ReactTimeAgo from "react-time-ago";
import {
  getPlainEnglishFrequency,
  getNextInstanceDate,
  getLastInstanceDate,
  getTimeBetweenInstances,
  calculateEventsInNext12Months,
  calculateStats,
} from "./utils";

// initialize dotenv

const serverurl = "http://localhost:5000";
const App: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(
    null
  );
  const [filter, setFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("nextDate");
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  useEffect(() => {
    fetchCalendars();
    checkLoginStatus();
  }, []);

  const fetchEvents = async () => {
    if (!selectedCalendarId) return;

    try {
      const response = await fetch(
        `${serverurl}/api/events?calendar=${encodeURIComponent(
          selectedCalendarId
        )}`
      );
      if (!response.ok) throw new Error("Error fetching events");

      const data = await response.json();
      setEvents(data);
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await fetch(`${serverurl}/api/calendars`);
      if (!response.ok) throw new Error("Error fetching calendars");

      const data = await response.json();
      setCalendars(data);
      if (data.length > 0) setSelectedCalendarId(data[0].id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogin = () => {
    window.open(`${serverurl}/api/login`, "_self");
  };

  const handleLogout = () => {
    window.open(`${serverurl}/api/logout`, "_self");
  };

  const checkLoginStatus = async () => {
    try {
      const response = await fetch(`${serverurl}/api/check-login`);
      if (response.ok) {
        const data = await response.json();
        setLoggedIn(data.loggedIn);
      } else {
        throw new Error("Error checking login status");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filterEvents = (events: any[]) => {
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
  const sortEvents = (events: any[]) => {
    switch (sortOption) {
      case "nextDate":
        return events.sort((a, b) => {
          const aNextDate = getNextInstanceDate(a);
          const bNextDate = getNextInstanceDate(b);
          return (
            (aNextDate ? aNextDate.getTime() : new Date().getTime()) -
            (bNextDate ? bNextDate.getTime() : new Date().getTime())
          );
        });
      case "alphabetical":
        return events.sort((a, b) => {
          const aSummary = a.summary || "";
          const bSummary = b.summary || "";
          return aSummary.localeCompare(bSummary);
        });
      case "frequency":
        return events.sort(
          (a, b) =>
            calculateEventsInNext12Months(a) - calculateEventsInNext12Months(b)
        );
      default:
        return events;
    }
  };

  const filteredEvents = sortEvents(filterEvents(events));
  const stats = calculateStats(filteredEvents);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-blue-500 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-semibold">My Calendar App</h1>
        {loggedIn ? (
          <button
            onClick={handleLogout}
            className="m-4 px-7 py-3 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="m-4 px-7 py-3 bg-green-500 text-white rounded"
          >
            Login
          </button>
        )}
      </header>

      <main className="p-4">
        <div className="my-10 space-y-10">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold mb-4">Calendars</h2>
            <div className="flex flex-wrap">
              {calendars.map((calendar: any) => (
                <label
                  key={calendar.id}
                  className="flex items-center mb-2 mr-2"
                >
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
        <div className="flex justify-between items-center mb-4">
          <label className="mr-2">
            Filter by:
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="ml-2 bg-white border border-gray-300 rounded px-3 py-1"
            >
              <option value="all">All</option>
              <option value="recurring">Recurring</option>
              <option value="non-recurring">Non-Recurring</option>
            </select>
          </label>
          <label className="mr-2">
            Sort by:
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="ml-2 bg-white border border-gray-300 rounded px-3 py-1"
            >
              <option value="nextDate">Next Instance Date</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="frequency">Frequency</option>
            </select>
          </label>
        </div>
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Name of Meeting</th>
              <th className="py-2 px-4 border-b">Frequency</th>
              <th className="py-2 px-4 border-b">Last Date</th>
              <th className="py-2 px-4 border-b">Next Date</th>
              <th className="py-2 px-4 border-b">Time Between Instances</th>
              <th className="py-2 px-4 border-b">Events in Next 12 Months</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => (
              <tr key={event.id} className="hover:bg-gray-100">
                <td className="py-2 px-4 border-b">{event.summary}</td>
                <td className="py-2 px-4 border-b">
                  {getPlainEnglishFrequency(event)}
                </td>
                <td className="py-2 px-4 border-b">
                  {getLastInstanceDate(event) ? (
                    <ReactTimeAgo
                      date={getLastInstanceDate(event) as Date}
                      locale="en-US"
                    />
                  ) : (
                    "No data"
                  )}
                </td>
                <td className="py-2 px-4 border-b">
                  {getNextInstanceDate(event) ? (
                    <ReactTimeAgo
                      date={getNextInstanceDate(event) as Date}
                      locale="en-US"
                    />
                  ) : (
                    "No data"
                  )}
                </td>
                <td className="py-2 px-4 border-b">
                  {getTimeBetweenInstances(
                    event.start.dateTime || event.start.date,
                    event.end.dateTime || event.end.date
                  )}
                </td>
                <td className="py-2 px-4 border-b">
                  {calculateEventsInNext12Months(event)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4">
          <p className="text-gray-600">
            Total Recurring Events: {stats.totalRecurringEvents}
          </p>
          <p className="text-gray-600">
            Total Instances Per Year: {stats.totalInstancesPerYear}
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;
