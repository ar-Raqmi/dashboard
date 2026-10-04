'use client'

import { useState } from 'react'
import {
  WEEKDAY_CODES,
  WEEKDAY_NAMES,
  describeRecurrence,
  type RecurrenceConfig,
  type RecurrenceFreq,
  type WeekdayCode,
} from '@/lib/recurrence'

type FreqChoice = 'none' | RecurrenceFreq
type MonthMode = 'day' | 'nth'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const ORDINALS = [
  { v: 1, l: 'First' },
  { v: 2, l: 'Second' },
  { v: 3, l: 'Third' },
  { v: 4, l: 'Fourth' },
  { v: -1, l: 'Last' },
]

const defaultNth = (date: Date) => {
  const n = Math.ceil(date.getDate() / 7)
  return n > 4 ? -1 : n
}

interface RecurrenceFieldProps {
  value: RecurrenceConfig | null
  onChange: (value: RecurrenceConfig | null) => void
  startDate: Date
  disabled?: boolean
}

type Draft = Partial<{
  freq: RecurrenceFreq
  interval: number
  byday: WeekdayCode[]
  monthMode: MonthMode
  monthDay: number
  ordinal: number
  ordinalWeekday: WeekdayCode
  yearMonth: number
  yearDay: number
}>

/** Repeat rule editor. Emits an RFC-5545-style config; null means "does not repeat". */
export default function RecurrenceField({ value, onChange, startDate, disabled }: RecurrenceFieldProps) {
  // getDay(): 0=Sun..6=Sat, shifted so Monday is index 0 like WEEKDAY_CODES.
  const startCode = WEEKDAY_CODES[(startDate.getDay() + 6) % 7]

  const [freq, setFreq] = useState<FreqChoice>(value?.freq ?? 'none')
  const [interval, setIntervalN] = useState<number>(value?.interval ?? 1)
  const [byday, setByday] = useState<WeekdayCode[]>(value?.byday?.length ? value.byday : [startCode])
  const [monthMode, setMonthMode] = useState<MonthMode>(value?.bymonthday?.length ? 'day' : value?.bysetpos?.length ? 'nth' : 'day')
  const [monthDay, setMonthDay] = useState<number>(value?.bymonthday?.[0] ?? startDate.getDate())
  const [ordinal, setOrdinal] = useState<number>(value?.bysetpos?.[0] ?? defaultNth(startDate))
  const [ordinalWeekday, setOrdinalWeekday] = useState<WeekdayCode>(value?.byday?.[0] ?? startCode)
  const [yearMonth, setYearMonth] = useState<number>(value?.bymonth?.[0] ?? startDate.getMonth() + 1)
  const [yearDay, setYearDay] = useState<number>(value?.bymonthday?.[0] ?? startDate.getDate())

  const compose = (o: Draft): RecurrenceConfig | null => {
    const f = o.freq ?? (freq === 'none' ? null : freq)
    if (!f) return null
    const cfg: RecurrenceConfig = { freq: f }
    const iv = o.interval ?? interval
    if (iv > 1) cfg.interval = iv

    if (f === 'WEEKLY') {
      const days = o.byday ?? byday
      if (days.length) cfg.byday = days
    } else if (f === 'MONTHLY') {
      if ((o.monthMode ?? monthMode) === 'day') {
        cfg.bymonthday = [o.monthDay ?? monthDay]
      } else {
        cfg.byday = [o.ordinalWeekday ?? ordinalWeekday]
        cfg.bysetpos = [o.ordinal ?? ordinal]
      }
    } else if (f === 'YEARLY') {
      cfg.bymonth = [o.yearMonth ?? yearMonth]
      cfg.bymonthday = [o.yearDay ?? yearDay]
    }
    // Preserve an existing end condition when editing a series.
    if (value?.count) cfg.count = value.count
    if (value?.until) cfg.until = value.until
    return cfg
  }

  const emit = (draft: Draft) => onChange(compose(draft))
  const unit = freq === 'DAILY' ? 'day' : freq === 'WEEKLY' ? 'week' : 'month'

  return (
    <div className="recurrence-field">
      <select
        aria-label="Repeat"
        value={freq}
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.value as FreqChoice
          setFreq(f)
          onChange(f === 'none' ? null : compose({ freq: f }))
        }}
      >
        <option value="none">Does not repeat</option>
        <option value="DAILY">Daily</option>
        <option value="WEEKLY">Weekly</option>
        <option value="MONTHLY">Monthly</option>
        <option value="YEARLY">Yearly</option>
      </select>

      {freq !== 'none' && (
        <div className="recurrence-box">
          {freq !== 'YEARLY' && (
            <div className="inline-field">
              <span>Every</span>
              <input
                type="number"
                min={1}
                max={99}
                value={interval}
                disabled={disabled}
                aria-label="Repeat interval"
                onChange={(e) => {
                  const n = Math.max(1, Number(e.target.value) || 1)
                  setIntervalN(n)
                  emit({ interval: n })
                }}
              />
              <span>{interval === 1 ? unit : `${unit}s`}</span>
            </div>
          )}

          {freq === 'WEEKLY' && (
            <div className="chip-group" role="group" aria-label="Weekdays">
              {WEEKDAY_CODES.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={disabled}
                  className={`chip ${byday.includes(c) ? 'active' : ''}`}
                  aria-pressed={byday.includes(c)}
                  aria-label={WEEKDAY_NAMES[c]}
                  onClick={() => {
                    const next = byday.includes(c) ? byday.filter((d) => d !== c) : [...byday, c]
                    if (!next.length) return
                    setByday(next)
                    emit({ byday: next })
                  }}
                >
                  {WEEKDAY_NAMES[c][0]}
                </button>
              ))}
            </div>
          )}

          {freq === 'MONTHLY' && (
            <>
              <div className="theme-segment" role="group" aria-label="Monthly pattern">
                {(['day', 'nth'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={disabled}
                    className={monthMode === mode ? 'active' : ''}
                    onClick={() => {
                      setMonthMode(mode)
                      emit({ monthMode: mode })
                    }}
                  >
                    {mode === 'day' ? 'On a day' : 'On a weekday'}
                  </button>
                ))}
              </div>
              {monthMode === 'day' ? (
                <div className="inline-field">
                  <span>On day</span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={monthDay}
                    disabled={disabled}
                    aria-label="Day of month"
                    onChange={(e) => {
                      const n = Math.min(31, Math.max(1, Number(e.target.value) || 1))
                      setMonthDay(n)
                      emit({ monthDay: n })
                    }}
                  />
                </div>
              ) : (
                <div className="inline-field">
                  <select
                    aria-label="Which occurrence"
                    value={ordinal}
                    disabled={disabled}
                    onChange={(e) => {
                      setOrdinal(Number(e.target.value))
                      emit({ ordinal: Number(e.target.value) })
                    }}
                  >
                    {ORDINALS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                  <select
                    aria-label="Weekday"
                    value={ordinalWeekday}
                    disabled={disabled}
                    onChange={(e) => {
                      setOrdinalWeekday(e.target.value as WeekdayCode)
                      emit({ ordinalWeekday: e.target.value as WeekdayCode })
                    }}
                  >
                    {WEEKDAY_CODES.map((c) => <option key={c} value={c}>{WEEKDAY_NAMES[c]}</option>)}
                  </select>
                </div>
              )}
            </>
          )}

          {freq === 'YEARLY' && (
            <div className="inline-field">
              <select
                aria-label="Month"
                value={yearMonth}
                disabled={disabled}
                onChange={(e) => {
                  setYearMonth(Number(e.target.value))
                  emit({ yearMonth: Number(e.target.value) })
                }}
              >
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <input
                type="number"
                min={1}
                max={31}
                value={yearDay}
                disabled={disabled}
                aria-label="Day of month"
                onChange={(e) => {
                  const n = Math.min(31, Math.max(1, Number(e.target.value) || 1))
                  setYearDay(n)
                  emit({ yearDay: n })
                }}
              />
            </div>
          )}

          <p className="form-hint accent">{describeRecurrence(value ?? { freq })}</p>
        </div>
      )}
    </div>
  )
}
