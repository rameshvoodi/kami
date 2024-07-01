import React, { useState, useEffect } from "react";
import ReactTimeAgo from "react-time-ago";

const App = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(
    null
  );
  const [filter, setFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("nextInstanceDate");

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
      const filteredEvents = filterEvents(data);
      const recurringEvents = filteredEvents.filter(
        (event) => event.recurrence || event.recurringEventId
      );
      console.log(recurringEvents);

      setEvents(filteredEvents);
    } catch (error) {
      console.error(error);
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

  const getTimeBetweenInstances = (start?: string, end?: string) => {
    if (!start || !end) return "N/A";

    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return `${diffMonths} months`;
  };

  const getLastDate = (event: any): Date | undefined => {
    if (event.end && event.end.date) {
      return new Date(event.end.date);
    }
    return undefined;
  };

  const getNextInstanceDate = (event: any): Date | null => {
    if (event.recurrence && event.start && event.start.date) {
      const now = new Date();
      const startDate = new Date(event.start.date);

      // Ensure to handle initial startDate comparison correctly
      if (startDate > now) {
        return startDate;
      }

      // Iterate through recurrence rules to find next instance
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

          // Found the next instance date that is in the future
          if (instanceDate > now) {
            return instanceDate;
          }
        }
      }
    }

    return null; // Return null if no future instances found
  };

  const calculateEventsInNext12Months = (event: any): number => {
    const now = new Date();
    const nextYear = new Date(now);
    nextYear.setFullYear(now.getFullYear() + 1);

    let count = 0;
    if (event.recurrence) {
      event.recurrence.forEach((rule: string) => {
        // Assuming only one rule for simplicity
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

  const filterEvents = (events: any[]): any[] => {
    const now = new Date();
    const nextYear = new Date(now);
    nextYear.setFullYear(now.getFullYear() + 1);

    return events.filter((event) => {
      if (!event.recurrence) return false; // Filter out non-recurring events
      // Check if any instance in the next 12 months is not declined
      const freqMatch = event.recurrence[0].match(/FREQ=(\w+);/);
      if (freqMatch) {
        const freq = freqMatch[1];
        const startDate = new Date(event.start.date);
        let instanceDate = new Date(startDate);
        while (instanceDate <= nextYear) {
          if (instanceDate > now) {
            return true;
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
      return false;
    });
  };

  const sortEvents = (events: any[]): any[] => {
    switch (sortOption) {
      case "nextInstanceDate":
        return events.sort((a, b) => {
          const nextDateA = getNextInstanceDate(a);
          const nextDateB = getNextInstanceDate(b);
          if (nextDateA && nextDateB) {
            return nextDateA.getTime() - nextDateB.getTime();
          }
          return 0;
        });
      case "alphabetical":
        return events.sort((a, b) => a.summary.localeCompare(b.summary));
      case "frequencyAsc":
        return events.sort((a, b) => {
          const eventsInNext12MonthsA = calculateEventsInNext12Months(a);
          const eventsInNext12MonthsB = calculateEventsInNext12Months(b);
          return eventsInNext12MonthsA - eventsInNext12MonthsB;
        });
      case "frequencyDesc":
        return events.sort((a, b) => {
          const eventsInNext12MonthsA = calculateEventsInNext12Months(a);
          const eventsInNext12MonthsB = calculateEventsInNext12Months(b);
          return eventsInNext12MonthsB - eventsInNext12MonthsA;
        });
      default:
        return events;
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  const sortedEvents = sortEvents(events);

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
            {calendars.map((calendar: any) => (
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
            <option value="non-recurring">Non-recurring Events</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="mr-4">Sort Events:</label>
          <select
            className="p-2 border rounded"
            value={sortOption}
            onChange={handleSortChange}
          >
            <option value="nextInstanceDate">Next Instance Date (Asc)</option>
            <option value="alphabetical">Alphabetical (Asc)</option>
            <option value="frequencyAsc">Frequency (Asc)</option>
            <option value="frequencyDesc">Frequency (Desc)</option>
          </select>
        </div>
        <table className="min-w-full bg-white border rounded-md shadow-md">
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
            {sortedEvents.map((event: any) => {
              const lastDate = getLastDate(event);
              const nextDate = getNextInstanceDate(event);
              const timeBetweenInstances = getTimeBetweenInstances(
                event.start?.date,
                event.end?.date
              );
              const eventsInNext12Months = calculateEventsInNext12Months(event);

              return (
                <tr key={event.id}>
                  <td className="py-2 px-4 border-b">{event.summary}</td>
                  <td className="py-2 px-4 border-b">
                    {getEventFrequency(event)}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {lastDate ? <ReactTimeAgo date={lastDate} /> : "N/A"}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {nextDate ? <ReactTimeAgo date={nextDate} /> : "N/A"}
                  </td>
                  <td className="py-2 px-4 border-b">{timeBetweenInstances}</td>
                  <td className="py-2 px-4 border-b">{eventsInNext12Months}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default App;
