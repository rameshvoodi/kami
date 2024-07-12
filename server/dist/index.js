"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const googleapis_1 = require("googleapis");
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
app.use((0, cors_1.default)({
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);
app.get('/api/login', (_req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
    });
    res.redirect(url);
});
app.get('/api/check-login', (_req, res) => {
    if (oauth2Client.credentials && oauth2Client.credentials.access_token) {
        res.json({ loggedIn: true });
    }
    else {
        res.json({ loggedIn: false });
    }
});
app.get('/api/logout', (_req, res) => {
    oauth2Client.revokeCredentials((err) => {
        if (err) {
            console.error('Error revoking credentials:', err);
            res.status(500).send('Error revoking credentials');
            return;
        }
        res.redirect(CLIENT_URL);
    });
});
app.get('/api/redirect', (req, res) => {
    const code = req.query.code;
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
app.get('/api/calendars', (_req, res) => {
    const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
    calendar.calendarList.list({}, (err, response) => {
        if (err) {
            console.error('Error fetching calendars', err);
            res.status(500).send('Error!');
            return;
        }
        const calendars = (response === null || response === void 0 ? void 0 : response.data.items) || [];
        res.json(calendars);
    });
});
app.get('/api/events', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const calendarId = req.query.calendar || 'primary';
    const pageToken = req.query.pageToken;
    const timeMin = req.query.timeMin || new Date().toISOString();
    const timeMax = req.query.timeMax;
    const maxResults = parseInt(req.query.maxResults || '2500', 10);
    const orderBy = req.query.orderBy || 'updated';
    const showDeleted = req.query.showDeleted === 'true';
    const singleEvents = req.query.singleEvents === 'true';
    const q = req.query.q;
    const updatedMin = req.query.updatedMin;
    const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
    try {
        const response = yield calendar.events.list({
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
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).send('Error fetching events');
    }
}));
function groupRecurringEvents(events) {
    const eventMap = new Map();
    events.forEach(event => {
        if (event.recurringEventId) {
            // This is a modification of a recurring event
            const masterEvent = eventMap.get(event.recurringEventId);
            if (masterEvent) {
                if (!masterEvent.recurringEventExceptions) {
                    masterEvent.recurringEventExceptions = [];
                }
                masterEvent.recurringEventExceptions.push(event);
            }
            else {
                // If we haven't seen the master event yet, store this modification
                eventMap.set(event.recurringEventId, Object.assign(Object.assign({}, event), { recurringEventExceptions: [event] }));
            }
        }
        else if (event.id) {
            // This is either a non-recurring event or the master event of a recurring series
            eventMap.set(event.id, event);
        }
    });
    return Array.from(eventMap.values());
}
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
