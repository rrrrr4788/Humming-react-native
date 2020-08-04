const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'June',
  'July',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

export function formatDate(date) {
  let month = monthNames[date.getMonth()];
  let day = date.getDate();
  let year = date.getFullYear();

  if (day.length < 2) {
    day = '0' + day;
  }

  return `${month} ${day}, ${year}`;
}

export function formatTime(date) {
  let hour = date.getHours();
  let minute = date.getMinutes();
  let suffix = 'AM';

  if (hour >= 12) {
    suffix = 'PM';
    hour -= 12;
  }

  if (hour.toString().length < 2) {
    hour = '0' + hour.toString();
  }
  if (minute.toString().length < 2) {
    minute = '0' + minute;
  }

  return `${hour}:${minute} ${suffix}`;
}
