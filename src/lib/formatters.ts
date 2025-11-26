export function formatAmount(value: number, locale: string = "id-ID"): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(
  input: string | Date,
  locale: string = "id-ID",
  timeZone: string = "Asia/Jakarta",
): string {
  const date = typeof input === "string" ? new Date(input) : input;

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const makeParts = (d: Date) => {
    const fmt = new Intl.DateTimeFormat(locale, {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = fmt.formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

    return {
      year: get("year"),
      month: get("month"),
      day: get("day"),
      hour: get("hour"),
      minute: get("minute"),
    };
  };

  const now = new Date();
  const nowParts = makeParts(now);
  const dateParts = makeParts(date);

  const key = (p: { year: string; month: string; day: string }) =>
    `${p.year}-${p.month}-${p.day}`;

  const todayKey = key(nowParts);
  const dateKey = key(dateParts);

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayParts = makeParts(yesterday);
  const yesterdayKey = key(yesterdayParts);

  const timeStr = `${dateParts.hour}:${dateParts.minute}`;

  const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  });
  const weekdayStr = weekdayFormatter.format(date);

  if (dateKey === todayKey) {
    return `Today, ${timeStr}`;
  }

  if (dateKey === yesterdayKey) {
    return `Yesterday, ${timeStr}`;
  }

  const sameYear = nowParts.year === dateParts.year;

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    day: "2-digit",
    month: "short",
    year: sameYear ? undefined : "numeric",
  });

  const dateStr = dateFormatter.format(date);

  return `${weekdayStr}, ${dateStr}, ${timeStr}`;
}
