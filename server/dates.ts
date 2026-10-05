/** Calendar arithmetic on YYYY-MM-DD strings, independent of the server's own time zone. */

export const addDays = (isoDate: string, days: number) => {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** The calendar date of an instant in an IANA zone. */
export const dateIn = (zone: string, at = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);

/** DD-MM-YYYY, the form Aladhan expects in its paths. */
export const toDmy = (isoDate: string) => isoDate.split('-').reverse().join('-');
