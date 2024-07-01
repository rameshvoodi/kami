import React, { useState, useEffect } from "react";
import ReactTimeAgo from "react-time-ago";

const App: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]);
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

      const data = await response.json();
      console.log(data);
      setEvents(data);
    } catch (error) {
      console.error(error);
      // Handle error (e.g., show error message to the user)
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/calendars");
      if (!response.ok) throw new Error("Error fetching calendars");

      const data = await response.json();
      setCalendars(data);
      if (data.length > 0) setSelectedCalendarId(data[0].id);
    } catch (error) {
      console.error(error);
      // Handle error (e.g., show error message to the user)
    }
  };

  const handleLogin = () => {
    window.open("http://localhost:5000/api/login", "_blank");
  };

  const getEventFrequency = (event: any): string => {
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

  const getLastDate = (event: any): Date | undefined => {
    if (event.end) {
      if (event.end.dateTime) {
        return new Date(event.end.dateTime);
      } else if (event.end.date) {
        return new Date(event.end.date);
      }
    }
    return undefined;
  };

  const getTimeBetweenInstances = (start?: string, end?: string) => {
    if (!start || !end) return "N/A";

    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return `${diffMonths} months`;
  };

  const getNextInstanceDate = (event: any): Date | null => {
    if (event.recurrence && event.start && event.start.date) {
      const now = new Date();
      const startDate = new Date(event.start.date);

      for (let rule of event.recurrence) {
        const freqMatch = rule.match(/FREQ=(\w+);/);
        if (freqMatch) {
          const freq = freqMatch[1];
          let instanceDate = new Date(startDate);

          while (instanceDate <= now) {
            switch (freq) {
              case "DAILY":
                instanceDate.setDate(instanceDate.getDate() + 1);
                break;
              case "WEEKLY":
                instanceDate.setDate(instanceDate.getDate() + 7);
                break;
              case "MONTHLY":
                instanceDate.setMonth(instanceDate.getMonth() + 1);
                break;
              case "YEARLY":
                instanceDate.setFullYear(instanceDate.getFullYear() + 1);
                break;
              default:
                break;
            }
          }

          if (instanceDate > now) {
            return instanceDate;
          }
        }
      }
    }

    return null;
  };

  const calculateEventsInNext12Months = (event: any): number => {
    const now = new Date();
    const nextYear = new Date(now);
    nextYear.setFullYear(now.getFullYear() + 1);

    let count = 0;
    if (event.recurrence) {
      event.recurrence.forEach((rule: string) => {
        const freqMatch = rule.match(/FREQ=(\w+);/);
        if (freqMatch) {
          const freq = freqMatch[1];
          const startDate = new Date(event.start.date);
          let instanceDate = new Date(startDate);

          while (instanceDate <= nextYear) {
            if (instanceDate > now) {
              count++;
            }
            switch (freq) {
              case "DAILY":
                instanceDate.setDate(instanceDate.getDate() + 1);
                break;
              case "WEEKLY":
                instanceDate.setDate(instanceDate.getDate() + 7);
                break;
              case "MONTHLY":
                instanceDate.setMonth(instanceDate.getMonth() + 1);
                break;
              case "YEARLY":
                instanceDate.setFullYear(instanceDate.getFullYear() + 1);
                break;
              default:
                break;
            }
          }
        }
      });
    }
    return count;
  };

  const calculateStats = (filteredEvents: any[]) => {
    const recurringEvents = filteredEvents.filter(
      (event) => event.recurrence || event.recurringEventId
    );
    const instancesPerYear = recurringEvents.reduce((sum, event) => {
      const instances = calculateEventsInNext12Months(event);
      return sum + instances;
    }, 0);

    return {
      totalRecurringEvents: recurringEvents.length,
      totalInstancesPerYear: instancesPerYear,
    };
  };

  const stats = calculateStats(events);

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

  const filteredEvents = filterEvents(events);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-blue-500 text-white p-4 shadow-md flex flex-row justify-between items-center">
        <h1 className="text-xl font-semibold">My Calendar App</h1>
        <button
          onClick={handleLogin}
          className="m-4 p-2 bg-blue-500 text-white rounded"
        >
          Login
        </button>
      </header>

      <main className="p-4">
        <div className="my-10 space-y-10">
          <div className="flex flex-row justify-between justify-center">
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
        <div className="flex justify-end mb-4">
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
        </div>
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2">
                Name of Meeting
              </th>
              <th className="border border-gray-300 px-4 py-2">Frequency</th>
              <th className="border border-gray-300 px-4 py-2">Last Date</th>
              <th className="border border-gray-300 px-4 py-2">Next Date</th>
              <th className="border border-gray-300 px-4 py-2">
                Time Between Instances
              </th>
              <th className="border border-gray-300 px-4 py-2">
                Events in Next 12 Months
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event: any) => (
              <tr key={event.id}>
                <td className="border border-gray-300 px-4 py-2">
                  {event.summary}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {getEventFrequency(event)}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {getLastDate(event) ? (
                    <ReactTimeAgo date={getLastDate(event) as Date} />
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {getNextInstanceDate(event) ? (
                    <ReactTimeAgo date={getNextInstanceDate(event) as Date} />
                  ) : (
                    "N/A"
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {getTimeBetweenInstances(
                    event.start?.dateTime,
                    event.end?.dateTime
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {calculateEventsInNext12Months(event)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4">
          <p>Total Recurring Events: {stats.totalRecurringEvents}</p>
          <p>Total Instances per Year: {stats.totalInstancesPerYear}</p>
        </div>
      </main>
    </div>
  );
};

export default App;
