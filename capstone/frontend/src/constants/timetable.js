export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const periods = [
  '08:00 - 08:50', '08:50 - 09:40', '09:40 - 10:30', '10:30 - 11:20',
  '11:20 - 12:10', '12:10 - 13:00', '13:00 - 13:50', '13:50 - 14:40',
  '14:40 - 15:30', '15:30 - 16:20', '16:20 - 17:10',
];

export const periodLabels = [
  '1 (8:00–8:50)', '2 (8:50–9:40)', '3 (9:40–10:30)', '4 (10:30–11:20)',
  '5 (11:20–12:10)', '6 (12:10–1:00)', '7 (1:00–1:50)', '8 (1:50–2:40)',
  '9 (2:40–3:30)', '10 (3:30–4:20)', '11 (4:20–5:10)',
];

export const createEmptyTimetable = () => {
  const structure = {};
  days.forEach((day) => {
    structure[day] = Array(periods.length).fill(null);
  });
  return structure;
};

export const formatTimetableData = (data) => {
  const formatted = createEmptyTimetable();

  data.forEach((entry) => {
    const { day, time, subject, type, room } = entry;
    if (!day || !time) return;

    const [start, end] = time.split('-').map((part) => part.trim());
    const startIndex = periods.findIndex((slot) => slot.startsWith(start));
    const endIndex = periods.findIndex((slot) => slot.endsWith(end));

    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      const span = endIndex - startIndex + 1;
      formatted[day][startIndex] = {
        text: `${subject} (${type}) [Room ${room}]`,
        span,
      };
      for (let i = 1; i < span; i += 1) {
        formatted[day][startIndex + i] = 'SKIP';
      }
    }
  });

  return formatted;
};
