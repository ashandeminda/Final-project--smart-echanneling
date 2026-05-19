export const formatDisplayTime = (timeValue) => {
  if (!timeValue) return "-";

  const normalized = String(timeValue).trim();
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return normalized;

  const hours = Number.parseInt(match[1], 10);
  const minutes = match[2];

  if (!Number.isInteger(hours) || hours < 0 || hours > 23) {
    return normalized;
  }

  const period = hours >= 12 ? "p.m" : "a.m";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
};
