require("dotenv").config();

// Import required modules
const express = require("express");
const { google } = require("googleapis");
const cors = require("cors");

const app = express();
const axios = require("axios");

const CLIENT_URL = process.env.CLIENT_URL;

app.use(cors());

app.use(
  cors({
    origin: `${CLIENT_URL}`,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

app.get("/api/login", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: "https://www.googleapis.com/auth/calendar.readonly", // Scope for read-only access to the calendar
  });

  res.redirect(url);
});

app.get("/api/check-login", (req, res) => {
  if (oauth2Client.credentials && oauth2Client.credentials.access_token) {
    res.json({ loggedIn: true });
  } else {
    res.json({ loggedIn: false });
  }
});

// Route to logout
app.get("/api/logout", (req, res) => {
  oauth2Client.revokeCredentials((err) => {
    if (err) {
      console.error("Error revoking credentials:", err);
      res.status(500).send("Error revoking credentials");
      return;
    }
    res.send("Logged out successfully");
  });
});

app.get("/api/redirect", (req, res) => {
  const code = req.query.code;

  oauth2Client.getToken(code, (err, tokens) => {
    if (err) {
      console.error("Couldn't get token", err);
      res.send("Error");
      return;
    }

    oauth2Client.setCredentials(tokens);

    const redirectUrl =
      process.env.LOGIN_SUCCESS_REDIRECT_URL || "http://localhost:3000/";
    res.redirect(redirectUrl);
  });
});

app.get("/api/calendars", (req, res) => {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  calendar.calendarList.list({}, (err, response) => {
    if (err) {
      console.error("Error fetching calendars", err);
      res.end("Error!");
      return;
    }
    const calendars = response.data.items;
    res.json(calendars);
  });
});

app.get("/api/events", (req, res) => {
  const calendarId = req.query.calendar ?? "primary";
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  calendar.events.list(
    {
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 250,
    },
    (err, response) => {
      if (err) {
        console.error("Can't fetch events", err);
        res.send("Error");
        return;
      }
      const events = response.data.items;

      res.json(events);
    }
  );
});

app.get("/api/revents", async (req, res) => {
  const calendarId = req.query.calendar || "primary";
  const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

  try {
    // Make a GET request using Axios
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
      },
      params: {
        timeMin: new Date().toISOString(),
        maxResults: 250,
      },
    });

    const events = response.data.items;
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error.message);
    res.status(500).send("Error fetching events");
  }
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
