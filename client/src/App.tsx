import React, { useState, useEffect, useCallback } from "react";
import ReactTimeAgo from "react-time-ago";
import {
  getPlainEnglishFrequency,
  getNextInstanceDate,
  getLastInstanceDate,
  getTimeBetweenInstances,
  calculateEventsInNext12Months,
  calculateStats,
} from "./lib/vitals";
import { Button } from "../src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../src/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../src/components/ui/card";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCalendars();
    checkLoginStatus();
  }, []);

  const fetchEvents = useCallback(
    async (pageToken?: string) => {
      if (!selectedCalendarId) return;
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          calendar: selectedCalendarId,
          timeMin: new Date().toISOString(),
          maxResults: "2500",
          orderBy: sortOption === "startTime" ? "startTime" : "updated",
          showDeleted: "false",
          singleEvents: "false",
        });

        if (pageToken) {
          params.append("pageToken", pageToken);
        }

        const response = await fetch(`${serverurl}/api/events?${params}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error fetching events");
        }

        const data = await response.json();
        console.log(data);

        setEvents((prevEvents) => {
          const newEvents = [...prevEvents, ...data.events];
          return Array.from(
            new Map(newEvents.map((event) => [event.id, event])).values()
          );
        });

        if (data.nextPageToken) {
          await fetchEvents(data.nextPageToken);
        }
      } catch (error: any) {
        console.error(error);
        setError(error.message || "Failed to fetch events. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [selectedCalendarId, sortOption]
  );
  useEffect(() => {
    setEvents([]);
    fetchEvents();
  }, [selectedCalendarId, sortOption, filter, fetchEvents]);

  const fetchCalendars = async () => {
    try {
      const response = await fetch(`${serverurl}/api/calendars`);
      if (!response.ok) throw new Error("Error fetching calendars");

      const data = await response.json();

      const sortedCalendars = data.sort((a: any, b: any) =>
        a.summary.localeCompare(b.summary)
      );

      const primaryCalendar = sortedCalendars.find(
        (calendar: any) => calendar.primary
      );

      setCalendars(sortedCalendars);

      if (primaryCalendar) {
        setSelectedCalendarId(primaryCalendar.id);
      } else if (sortedCalendars.length > 0) {
        setSelectedCalendarId(sortedCalendars[0].id);
      }
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
        (event) =>
          event.recurrence ||
          (event.recurringEventId && !event.recurringEventExceptions) ||
          (Array.isArray(event.recurringEventExceptions) &&
            event.recurringEventExceptions.length > 0)
      );
    if (filter === "non-recurring")
      return events.filter(
        (event) =>
          !event.recurrence &&
          !event.recurringEventId &&
          (!event.recurringEventExceptions ||
            event.recurringEventExceptions.length === 0)
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
      <header className="bg-blue-500 text-white py-3 px-7  shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-semibold">My Calendar App</h1>
        {loggedIn ? (
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        ) : (
          <Button variant="default" onClick={handleLogin}>
            Login
          </Button>
        )}
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Recurring Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalRecurringEvents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Instances Per Year</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.totalInstancesPerYear}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] shadow-md">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="recurring">Recurring</SelectItem>
              <SelectItem value="non-recurring">Non-Recurring</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedCalendarId || ""}
            onValueChange={setSelectedCalendarId}
          >
            <SelectTrigger className="w-[350px] shadow-md">
              <SelectValue placeholder="Select a calendar" />
            </SelectTrigger>
            <SelectContent>
              {calendars.map((calendar: any) => (
                <SelectItem key={calendar.id} value={calendar.id}>
                  {calendar.summary} {calendar.primary ? "(Primary)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[180px] shadow-md">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nextDate">Next Instance Date</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
              <SelectItem value="frequency">Frequency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name of Meeting</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Last Date</TableHead>
                <TableHead>Next Date</TableHead>
                <TableHead>Time Between Instances</TableHead>
                <TableHead>Events in Next 12 Months</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={`${event.id}-${event.recurringEventId || ""}`}>
                  <TableCell>{event.summary}</TableCell>
                  <TableCell>{getPlainEnglishFrequency(event)}</TableCell>
                  <TableCell>
                    {getLastInstanceDate(event) ? (
                      <ReactTimeAgo
                        date={getLastInstanceDate(event) as Date}
                        locale="en-US"
                      />
                    ) : (
                      "Not yet started"
                    )}
                  </TableCell>
                  <TableCell>
                    {getNextInstanceDate(event) ? (
                      <ReactTimeAgo
                        date={getNextInstanceDate(event) as Date}
                        locale="en-US"
                      />
                    ) : (
                      "No data"
                    )}
                  </TableCell>
                  <TableCell>{getTimeBetweenInstances(event)}</TableCell>
                  <TableCell>{calculateEventsInNext12Months(event)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
};

export default App;
