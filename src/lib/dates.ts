// Civil dates have no timezone. Legacy audit timestamps from Python are UTC.
// Appointment wall times belong to the service, independently of the device.
export const SERVICE_TIME_ZONE = "America/Sao_Paulo";
const unavailable = "Data não informada";

export function calendarDate(value?: string | null): string | null {
  if (!value) return null;
  const brazilian = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const iso = brazilian ? `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}` : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1] ? iso : null;
}

export function formatDate(value?: string | null): string {
  const iso = calendarDate(value);
  if (iso) return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
  const timestamp = utcTimestamp(value);
  return timestamp === null ? unavailable : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(timestamp);
}

export function utcTimestamp(value?: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if (!match || !calendarDate(match[1]) || +match[2] > 23 || +match[3] > 59 || +(match[4] || 0) > 59) return null;
  const normalized = `${match[1]}T${match[2]}:${match[3]}:${match[4] || "00"}${match[5] ? match[5].slice(0, 4).padEnd(4, "0") : ""}${match[6] || "Z"}`;
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function formatDateTime(value?: string | null): string {
  if (calendarDate(value)) return formatDate(value);
  const timestamp = utcTimestamp(value);
  return timestamp === null ? unavailable : new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(timestamp);
}

const serviceClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: SERVICE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

export function appointmentTimestamp(date?: string | null, time = "23:59:59"): number | null {
  if (!calendarDate(date) || !/^\d{2}:\d{2}(?::\d{2})?$/.test(time)) return null;
  const wall = utcTimestamp(`${date}T${time}Z`);
  if (wall === null) return null;
  let candidate = wall;
  // Derive the IANA offset instead of assuming Brazil always uses UTC-3.
  for (let i = 0; i < 2; i++) {
    const p = Object.fromEntries(serviceClock.formatToParts(candidate).map(part => [part.type, part.value]));
    const represented = utcTimestamp(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
    if (represented === null) return null;
    candidate += wall - represented;
  }
  const p = Object.fromEntries(serviceClock.formatToParts(candidate).map(part => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}` === `${date}T${time.length === 5 ? `${time}:00` : time}` ? candidate : null;
}
