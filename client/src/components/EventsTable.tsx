// src/components/EventsTable.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { format as timeagoFormat } from "timeago.js";

interface Event {
  id: string;
  summary: string;
  status: string;
  start: {
    date?: string;
    dateTime?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
  };
  recurringEventId?: string;
}

const EventsTable: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [sortedEvents, setSortedEvents] = useState<Event[]>([]);
  const [sortOption, setSortOption] = useState("nextInstance");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get<Event[]>(
          "http://localhost:5000/api/events"
        );
        const fetchedEvents = response.data;

        // Filter out declined events and past events
        const filteredEvents = fetchedEvents.filter((event) => {
          return (
            event.status !== "declined" &&
            new Date(event.start.date || event.start.dateTime!) > new Date()
          );
        });

        setEvents(filteredEvents);
        setSortedEvents(filteredEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    sortEvents();
  }, [events, sortOption]);

  const sortEvents = () => {
    const sorted = [...events];
    if (sortOption === "nextInstance") {
      sorted.sort(
        (a, b) =>
          new Date(a.start.date || a.start.dateTime!).getTime() -
          new Date(b.start.date || b.start.dateTime!).getTime()
      );
    } else if (sortOption === "alphabetical") {
      sorted.sort((a, b) => a.summary.localeCompare(b.summary));
    }
    // Add sorting for frequency if needed
    setSortedEvents(sorted);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  const calculateFrequency = (event: Event): string => {
    // Example frequency calculation for weekly events
    const startDate = new Date(event.start.date || event.start.dateTime!);
    const endDate = new Date(event.end.date || event.end.dateTime!);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays % 7 === 0) {
      return `Every ${diffDays / 7} week(s)`;
    }
    return "Unknown frequency";
  };

  const calculateTimeBetweenInstances = (event: Event): string => {
    // Calculate the time between last and next instance
    const startDate = new Date(event.start.date || event.start.dateTime!);
    const endDate = new Date(event.end.date || event.end.dateTime!);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day(s) between instances`;
  };

  const calculateEventsInNext12Months = (event: Event): number => {
    // Calculate the number of events in the next 12 months
    const startDate = new Date(event.start.date || event.start.dateTime!);
    const today = new Date();
    const oneYearFromNow = new Date(today.setFullYear(today.getFullYear() + 1));
    const eventDuration =
      new Date(event.end.date || event.end.dateTime!).getTime() -
      startDate.getTime();
    const daysBetweenEvents = eventDuration / (1000 * 60 * 60 * 24);

    let eventsCount = 0;
    let currentEventDate = startDate;

    while (currentEventDate < oneYearFromNow) {
      eventsCount++;
      currentEventDate.setDate(currentEventDate.getDate() + daysBetweenEvents);
    }

    return eventsCount;
  };

  const calculateStats = (events: Event[]) => {
    const recurringEvents = events.length;
    const eventInstancesPerYear = events.reduce(
      (sum, event) => sum + calculateEventsInNext12Months(event),
      0
    );

    return { recurringEvents, eventInstancesPerYear };
  };

  const stats = calculateStats(sortedEvents);

  return (
    <div>
      <div className="stats">
        <p># of recurring events: {stats.recurringEvents}</p>
        <p>
          # of recurring event instances per year: {stats.eventInstancesPerYear}
        </p>
      </div>
      <div>
        <label>Sort by: </label>
        <select value={sortOption} onChange={handleSortChange}>
          <option value="nextInstance">Next Instance Date</option>
          <option value="alphabetical">Alphabetical</option>
          {/* Add more sort options if needed */}
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name of meeting</th>
            <th>Frequency</th>
            <th>Last Date</th>
            <th>Next Date</th>
            <th>Time between instances</th>
            <th>Events in next 12 months</th>
          </tr>
        </thead>
        <tbody>
          {sortedEvents.map((event) => (
            <tr key={event.id}>
              <td>{event.summary}</td>
              <td>{calculateFrequency(event)}</td>
              <td>
                {timeagoFormat(event.start.date || event.start.dateTime!)}
              </td>
              <td>{timeagoFormat(event.end.date || event.end.dateTime!)}</td>
              <td>{calculateTimeBetweenInstances(event)}</td>
              <td>{calculateEventsInNext12Months(event)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EventsTable;
