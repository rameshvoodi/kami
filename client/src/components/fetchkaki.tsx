import React, { useEffect, useState } from "react";
import axios from "axios";

// URL of your Express server hosting the API
const serverUrl = "http://localhost:5000"; // Replace with your server URL

// URL of the endpoint to fetch events
const apiUrl = `${serverUrl}/api/revents`;

const FetchEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(apiUrl);
        setEvents(response.data);
        console.log(response.data);
        setLoading(false);
      } catch (error: any) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h2>Events:</h2>
      <ul>
        {events.map((event, index) => (
          <li key={index}>{event.summary}</li> // Adjust based on your event data structure
        ))}
      </ul>
    </div>
  );
};

export default FetchEvents;
