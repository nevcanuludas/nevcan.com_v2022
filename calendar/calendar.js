const part1 = 'AIzaSyDG2lZCJjnVjXDmGiwBRd';
const part2 = 'ciW9Yfniekkw';

const calendarIds = [
  'nevcanuludas@gmail.com',
  '0072942805560063dd60f78f2c2c70cc87e2226becaea62955dc4b7dc55b0e5f@group.calendar.google.com',
  'f20ea54d8a8cb746730d6ae9a92b1de2318c4785dd95c4770daf517c54550a25@group.calendar.google.com',
  'tr.turkish#holiday@group.v.calendar.google.com'
];

const calendarColors = {
  'nevcanuludas@gmail.com': '#6e72c2',
  '0072942805560063dd60f78f2c2c70cc87e2226becaea62955dc4b7dc55b0e5f@group.calendar.google.com': '#4b99d2',
  'f20ea54d8a8cb746730d6ae9a92b1de2318c4785dd95c4770daf517c54550a25@group.calendar.google.com': '#55ae7f',
  'tr.turkish#holiday@group.v.calendar.google.com': '#999'
};

const key = part1 + '_' + part2;

async function fetchEvents(calendarId) {
  const now = new Date();

  // 2 months ago
  const past = new Date(now);
  past.setMonth(past.getMonth() - 2);
  const timeMin = past.toISOString();

  // 12 months from now
  const future = new Date(now);
  future.setMonth(future.getMonth() + 12);
  const timeMax = future.toISOString();

  const encodedId = encodeURIComponent(calendarId);
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedId}/events?key=${key}&timeMin=${timeMin}&timeMax=${timeMax}&showDeleted=false&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.items) return [];

  const events = [];
  const color = calendarColors[calendarId] || '#3788d8';

  data.items.forEach(event => {
    const visibility = event.visibility || 'default';
    const status = event.transparency || 'opaque'; // opaque = busy, transparent = free

    if (visibility === 'private' && status === 'transparent') return;

    const end = event.end ? (event.end.dateTime || event.end.date) : undefined;

    if (visibility === 'private') {
      // Private and busy event: show as "BUSY"
      events.push({
        title: 'BUSY',
        start: event.start.dateTime || event.start.date,
        end: end,
        allDay: !!event.start.date,
        color: color
      });
    } else {
      const start = event.start.dateTime || event.start.date;
      events.push({
        title: event.summary,
        start: start,
        end: end,
        allDay: !!event.start.date,
        color: color
      });
    }
  });

  return events;
}

async function fetchAllEvents() {
  let allEvents = [];
  for (const calendarId of calendarIds) {
    const events = await fetchEvents(calendarId);
    allEvents = allEvents.concat(events);
  }
  return allEvents;
}

document.addEventListener('DOMContentLoaded', async function() {
  const calendarEl = document.getElementById('calendar');
  const events = await fetchAllEvents();

  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() - 2);

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 12);

  const calendar = new FullCalendar.Calendar(calendarEl, {
    locale: 'tr',
    timeZone: 'Europe/Istanbul',
    initialView: 'multiMonthYear',
    firstDay: 1,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'multiMonthYear,dayGridMonth,dayGridWeek,dayGridDay,listYear'
    },
    events: events,
    datesSet: function(info) {
      const prevBtn = calendarEl.querySelector('.fc-prev-button');
      const nextBtn = calendarEl.querySelector('.fc-next-button');

      // Disable Prev if visible start <= minDate
      if (info.view.activeStart <= minDate) {
        prevBtn.setAttribute('disabled', 'disabled');
      } else {
        prevBtn.removeAttribute('disabled');
      }

      // Disable Next if visible end >= maxDate
      // activeEnd is exclusive, so allow comparison accordingly
      if (info.view.activeEnd >= maxDate) {
        nextBtn.setAttribute('disabled', 'disabled');
      } else {
        nextBtn.removeAttribute('disabled');
      }
    }
  });

  calendar.render();
});
