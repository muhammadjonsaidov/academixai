const UZ_MONTHS_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
const UZ_MONTHS_FULL = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];
const UZ_WEEKDAYS = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function uzDate(input: string | Date, opts: { withYear?: boolean; full?: boolean } = {}): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const day = d.getDate();
  const month = opts.full ? UZ_MONTHS_FULL[d.getMonth()] : UZ_MONTHS_SHORT[d.getMonth()];
  const year = opts.withYear ? ` ${d.getFullYear()}` : "";
  return `${day}-${month}${year}`;
}

export function uzDateTime(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return `${uzDate(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function uzTime(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function uzWeekday(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return UZ_WEEKDAYS[d.getDay()];
}

export function uzLongDate(input: string | Date = new Date()): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return `${uzWeekday(d)}, ${d.getDate()}-${UZ_MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}
