"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var date_fns_1 = require("date-fns");
// Function to get relative time from now to a given date
var getRelativeTime = function (date) {
    if (!date)
        return "No date available";
    return (0, date_fns_1.formatDistance)(new Date(date), new Date(), { addSuffix: true });
};
// Function to calculate days between two dates
var getTimeBetweenInstances = function (start, end) {
    if (!start || !end)
        return "N/A";
    var startDate = new Date(start);
    var endDate = new Date(end);
    var diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return "".concat(diffDays, " days");
};
// Function to get formatted distance from a given date to now
var getLastDate = function (start) {
    if (!start)
        return "No date available";
    var startDate = new Date(start);
    var now = new Date();
    return startDate < now
        ? (0, date_fns_1.formatDistance)(startDate, now) + " ago"
        : "No past instances";
};
var eventData = {
    "kind": "calendar#event",
    "etag": "\"3437272843210000\"",
    "id": "3654flt23h4go055isrk4goah0_20240724",
    "status": "confirmed",
    "htmlLink": "https://www.google.com/calendar/event?eid=MzY1NGZsdDIzaDRnbzA1NWlzcms0Z29haDBfMjAyNDA3MjQgcmFtZXNoa3VtYXJ2b29kaTIwMDJAbQ",
    "created": "2024-06-17T15:00:21.000Z",
    "updated": "2024-06-17T15:00:21.605Z",
    "summary": "allu arjun",
    "creator": {
        "email": "rameshkumarvoodi2002@gmail.com",
        "self": true
    },
    "organizer": {
        "email": "rameshkumarvoodi2002@gmail.com",
        "self": true
    },
    "start": {
        "date": "2024-07-24"
    },
    "end": {
        "date": "2024-07-25"
    },
    "recurringEventId": "3654flt23h4go055isrk4goah0",
    "originalStartTime": {
        "date": "2024-07-24"
    },
    "transparency": "transparent",
    "iCalUID": "3654flt23h4go055isrk4goah0@google.com",
    "sequence": 0,
    "reminders": {
        "useDefault": false
    },
    "eventType": "default"
};
// Test function usage with the eventData
console.log("Event Summary:", eventData.summary);
console.log("Relative Time:", getRelativeTime(eventData.start.date));
console.log("Time Between Instances:", getTimeBetweenInstances(eventData.start.date, eventData.end.date));
console.log("Last Date:", getLastDate(eventData.start.date));
