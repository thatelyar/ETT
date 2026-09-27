export const SESSION_DEFINITIONS = {
  london: { label: "لندن", english: "London", timeZone: "Europe/London" },
  newYork: { label: "نیویورک", english: "New York", timeZone: "America/New_York" },
};

export const DEFAULT_SESSION_CHECK = { enabled: false, open: "08:00", rules: [] };

const formatterCache = new Map();

function zonedParts(date, timeZone) {
  if (!formatterCache.has(timeZone)) {
    formatterCache.set(timeZone, new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }));
  }
  return Object.fromEntries(formatterCache.get(timeZone).formatToParts(date)
    .filter(({ type }) => type !== "literal")
    .map(({ type, value }) => [type, Number(value)]));
}

function localTimeToInstant(year, month, day, hours, minutes, timeZone) {
  const desired = Date.UTC(year, month - 1, day, hours, minutes);
  let instant = desired;
  for (let index = 0; index < 4; index += 1) {
    const parts = zonedParts(new Date(instant), timeZone);
    const actual = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    const adjustment = desired - actual;
    instant += adjustment;
    if (!adjustment) break;
  }
  return instant;
}

function dateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isWeekday(year, month, day) {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday > 0 && weekday < 6;
}

function openingForDate(id, config, year, month, day) {
  const [hours, minutes] = String(config.open || "08:00").split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return localTimeToInstant(year, month, day, hours, minutes, SESSION_DEFINITIONS[id].timeZone);
}

export function getDueSessionChecks(checks, now = Date.now()) {
  return Object.entries(SESSION_DEFINITIONS).flatMap(([id, definition]) => {
    const config = checks?.[id];
    const rules = Array.isArray(config?.rules) ? config.rules.map((rule) => String(rule).trim()).filter(Boolean) : [];
    if (!config?.enabled || !rules.length) return [];
    const { year, month, day } = zonedParts(new Date(now), definition.timeZone);
    if (!isWeekday(year, month, day)) return [];
    const opening = openingForDate(id, config, year, month, day);
    if (opening === null || now < opening - 30 * 60 * 1000) return [];
    return [{ id, date: dateKey(year, month, day), opening, trigger: opening - 30 * 60 * 1000, rules, open: config.open }];
  }).sort((a, b) => a.trigger - b.trigger);
}

export function getNextSessionOpening(id, config, now = Date.now()) {
  const definition = SESSION_DEFINITIONS[id];
  const local = zonedParts(new Date(now), definition.timeZone);
  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = new Date(Date.UTC(local.year, local.month - 1, local.day + offset));
    const year = candidate.getUTCFullYear();
    const month = candidate.getUTCMonth() + 1;
    const day = candidate.getUTCDate();
    if (!isWeekday(year, month, day)) continue;
    const opening = openingForDate(id, config, year, month, day);
    if (opening !== null && opening > now) return opening;
  }
  return null;
}

export function sessionAcknowledgementKey(owner, due) {
  return `tradeflow_session_ack_${owner}_${due.id}_${due.date}`;
}

export function sessionRuleSignature(due) {
  return JSON.stringify({ open: due.open, rules: due.rules });
}
