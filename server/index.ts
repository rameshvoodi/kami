import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { google, calendar_v3 } from 'googleapis';
import cors from 'cors';

dotenv.config();

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

app.get('/api/login', (_req: Request, res: Response) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
  });
  res.redirect(url);
});

app.get('/api/check-login', (_req: Request, res: Response) => {
  if (oauth2Client.credentials && oauth2Client.credentials.access_token) {
    res.json({ loggedIn: true });
  } else {
    res.json({ loggedIn: false });
  }
});

app.get('/api/logout', (_req: Request, res: Response) => {
  oauth2Client.revokeCredentials((err) => {
    if (err) {
      console.error('Error revoking credentials:', err);
      res.status(500).send('Error revoking credentials');
      return;
    }
    res.redirect(CLIENT_URL);
  });
});

app.get('/api/redirect', (req: Request, res: Response) => {
  const code = req.query.code as string;
  oauth2Client.getToken(code, (err, tokens) => {
    if (err) {
      console.error("Couldn't get token", err);
      res.send('Error');
      return;
    }
    if (tokens) {
      oauth2Client.setCredentials(tokens);
    }
    res.redirect(CLIENT_URL);
  });
});

app.get('/api/calendars', (_req: Request, res: Response) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  calendar.calendarList.list({}, (err, response) => {
    if (err) {
      console.error('Error fetching calendars', err);
      res.status(500).send('Error!');
      return;
    }
    const calendars = response?.data.items || [];
    res.json(calendars);
  });
});

interface EventsQueryParams {
  calendar?: string;
  pageToken?: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: string;
  orderBy?: 'startTime' | 'updated';
  showDeleted?: string;
  singleEvents?: string;
  q?: string;
  updatedMin?: string;
}
declare module 'googleapis' {
  namespace calendar_v3 {
    interface Schema$Event {
      recurringEventExceptions?: Schema$Event[];
    }
  }
}

app.get('/api/events', async (req: Request<{}, {}, {}, EventsQueryParams>, res: Response) => {
  const calendarId = req.query.calendar || 'primary';
  const pageToken = req.query.pageToken;
  const timeMin = req.query.timeMin || new Date().toISOString();
  const timeMax = req.query.timeMax;
  const maxResults = parseInt(req.query.maxResults || '2500', 10);
  const orderBy = (req.query.orderBy as 'startTime' | 'updated') || 'updated';
  const showDeleted = req.query.showDeleted === 'true';
  const singleEvents = req.query.singleEvents === 'true';
  const q = req.query.q;
  const updatedMin = req.query.updatedMin;

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      maxResults,
      orderBy,
      pageToken,
      showDeleted,
      singleEvents,
      q,
      updatedMin,
    });

    const events = response.data.items || [];
    const nextPageToken = response.data.nextPageToken;

    // Group recurring events and their modifications
    const groupedEvents = groupRecurringEvents(events);

    res.json({ events: groupedEvents, nextPageToken });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send('Error fetching events');
  }
});

function groupRecurringEvents(events: calendar_v3.Schema$Event[]): calendar_v3.Schema$Event[] {
  const eventMap = new Map<string, calendar_v3.Schema$Event>();

  events.forEach(event => {
    if (event.recurringEventId) {
      // This is a modification of a recurring event
      const masterEvent = eventMap.get(event.recurringEventId);
      if (masterEvent) {
        if (!masterEvent.recurringEventExceptions) {
          masterEvent.recurringEventExceptions = [];
        }
        masterEvent.recurringEventExceptions.push(event);
      } else {
        // If we haven't seen the master event yet, store this modification
        eventMap.set(event.recurringEventId, {
          ...event,
          recurringEventExceptions: [event]
        });
      }
    } else if (event.id) {
      // This is either a non-recurring event or the master event of a recurring series
      eventMap.set(event.id, event);
    }
  });

  return Array.from(eventMap.values());
}
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));