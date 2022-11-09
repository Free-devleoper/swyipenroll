export default function getDateAtStartOfWeek(originalDate: Date) {
  const date = new Date(originalDate.getTime());
  const day = date.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + delta);
  date.setHours(0, 0, 0, 0);
  return date;
}
