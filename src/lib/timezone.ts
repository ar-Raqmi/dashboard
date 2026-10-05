/** `auto` follows the device, so travelling needs no action; any other value is an IANA zone chosen in Settings. */
export const AUTO_TIMEZONE = 'auto';

export function isValidTimeZone(zone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

const deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** The time zone the whole app measures "now" in. */
class TimeZoneService {
  private selected = AUTO_TIMEZONE;

  select(zone: string | null | undefined) {
    this.selected = zone || AUTO_TIMEZONE;
  }

  get setting() {
    return this.selected;
  }

  /** The IANA zone in effect; an unknown stored value falls back to the device. */
  get active() {
    return this.selected !== AUTO_TIMEZONE && isValidTimeZone(this.selected) ? this.selected : deviceTimeZone();
  }

  get device() {
    return deviceTimeZone();
  }

  /** Calendar date of an instant in the active zone, as YYYY-MM-DD. */
  dateKey(at = new Date()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: this.active, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
  }

  /** Formats an instant in the active zone. */
  format(at: Date, options: Intl.DateTimeFormatOptions) {
    return new Intl.DateTimeFormat('en-US', { ...options, timeZone: this.active }).format(at);
  }

  /** Short name such as "MYT" or "GMT+8"; empty when the zone is unknown. */
  abbreviation(zone: string, at = new Date()) {
    try {
      return new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'short' }).formatToParts(at).find(p => p.type === 'timeZoneName')?.value ?? '';
    } catch {
      return '';
    }
  }

  /** Minutes since midnight in a zone (the active one by default). */
  minutesOfDay(at = new Date(), zone = this.active) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(at);
    const value = (type: string) => Number(parts.find(p => p.type === type)?.value || 0);
    return value('hour') * 60 + value('minute');
  }

  /** Short offset such as "GMT+8" for any zone. */
  offsetLabel(zone: string, at = new Date()) {
    return new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(at).find(p => p.type === 'timeZoneName')?.value ?? zone;
  }
}

export const timeZone = new TimeZoneService();
