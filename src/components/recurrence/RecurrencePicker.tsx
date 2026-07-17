'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const ORDINALS = [
  { v: 1, l: 'First' },
  { v: 2, l: 'Second' },
  { v: 3, l: 'Third' },
  { v: 4, l: 'Fourth' },
  { v: -1, l: 'Last' },
]

function defaultNth(date: Date): number {
  const n = Math.ceil(date.getDate() / 7)
  return n > 4 ? -1 : n
}

interface RecurrencePickerProps {
  value: RecurrenceConfig | null
  onChange: (value: RecurrenceConfig | null) => void
  startDate: Date
  disabled?: boolean
}

export function RecurrencePicker({ value, onChange, startDate, disabled }: RecurrencePickerProps) {
  // getDay(): 0=Sun..6=Sat → shift so Monday is index 0 (matching WEEKDAY_CODES)
  const startCode = WEEKDAY_CODES[(startDate.getDay() + 6) % 7]

  const [freq, setFreq] = useState<FreqChoice>(value?.freq ?? 'none')
  const [interval, setIntervalN] = useState<number>(value?.interval ?? 1)
  const [byday, setByday] = useState<WeekdayCode[]>(value?.byday?.length ? value.byday : [startCode])
  const [monthMode, setMonthMode] = useState<MonthMode>(value?.bymonthday?.length ? 'day' : 'nth')
  const [monthDay, setMonthDay] = useState<number>(value?.bymonthday?.[0] ?? startDate.getDate())
  const [ordinal, setOrdinal] = useState<number>(value?.bysetpos?.[0] ?? defaultNth(startDate))
  const [ordinalWeekday, setOrdinalWeekday] = useState<WeekdayCode>(value?.byday?.[0] ?? startCode)
  const [yearMonth, setYearMonth] = useState<number>(value?.bymonth?.[0] ?? startDate.getMonth() + 1)
  const [yearDay, setYearDay] = useState<number>(value?.bymonthday?.[0] ?? startDate.getDate())

  const compose = (o: Partial<{
    freq: RecurrenceFreq
    interval: number
    byday: WeekdayCode[]
    monthMode: MonthMode
    monthDay: number
    ordinal: number
    ordinalWeekday: WeekdayCode
    yearMonth: number
    yearDay: number
  }>): RecurrenceConfig | null => {
    const f = o.freq ?? freq
    if (!f || f === 'none') return null
    const cfg: RecurrenceConfig = { freq: f }
    const iv = o.interval ?? interval
    if (iv && iv > 1) cfg.interval = iv

    if (f === 'WEEKLY') {
      const days = o.byday ?? byday
      if (days.length) cfg.byday = days
    } else if (f === 'MONTHLY') {
      const mode = o.monthMode ?? monthMode
      if (mode === 'day') {
        cfg.bymonthday = [o.monthDay ?? monthDay]
      } else {
        cfg.byday = [o.ordinalWeekday ?? ordinalWeekday]
        cfg.bysetpos = [o.ordinal ?? ordinal]
      }
    } else if (f === 'YEARLY') {
      cfg.bymonth = [o.yearMonth ?? yearMonth]
      cfg.bymonthday = [o.yearDay ?? yearDay]
    }
    return cfg
  }

  const handleFreq = (f: string) => {
    setFreq(f as FreqChoice)
    onChange(compose({ freq: f as RecurrenceFreq }))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select value={freq} onValueChange={handleFreq} disabled={disabled}>
          <SelectTrigger className="rounded-2xl bg-input border-border w-full">
            <SelectValue placeholder="Does not repeat" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border rounded-2xl">
            <SelectItem value="none">Does not repeat</SelectItem>
            <SelectItem value="DAILY">Daily</SelectItem>
            <SelectItem value="WEEKLY">Weekly</SelectItem>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
            <SelectItem value="YEARLY">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {freq !== 'none' && (
        <div className="rounded-2xl bg-muted/40 border border-border p-3 flex flex-col gap-3">
          {/* Interval (Daily / Weekly / Monthly) */}
          {freq !== 'YEARLY' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-on-surface-variant">Every</span>
              <Input
                type="number"
                min={1}
                max={99}
                value={interval}
                onChange={(e) => {
                  const n = Math.max(1, Number(e.target.value) || 1)
                  setIntervalN(n)
                  onChange(compose({ interval: n }))
                }}
                className="h-8 w-16 rounded-xl bg-input border-border"
                disabled={disabled}
              />
              <span className="text-sm text-on-surface-variant">
                {freq === 'DAILY' ? (interval === 1 ? 'day' : 'days') : freq === 'WEEKLY' ? (interval === 1 ? 'week' : 'weeks') : interval === 1 ? 'month' : 'months'}
              </span>
            </div>
          )}

          {/* Weekly weekday chips */}
          {freq === 'WEEKLY' && (
            <ToggleGroup
              type="multiple"
              value={byday}
              onValueChange={(v) => {
                const arr = (v as string[]).map((x) => x as WeekdayCode)
                if (arr.length === 0) return
                setByday(arr)
                onChange(compose({ byday: arr }))
              }}
              className="justify-start"
              disabled={disabled}
            >
              {WEEKDAY_CODES.map((c) => (
                <ToggleGroupItem
                  key={c}
                  value={c}
                  aria-label={WEEKDAY_NAMES[c]}
                  className="size-8 rounded-lg text-xs px-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {WEEKDAY_NAMES[c][0]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}

          {/* Monthly mode */}
          {freq === 'MONTHLY' && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => { setMonthMode('day'); onChange(compose({ monthMode: 'day' })) }}
                  className={`flex-1 text-xs rounded-xl px-3 py-1.5 border transition-colors ${monthMode === 'day' ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-on-surface-variant'}`}
                >
                  On a day
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => { setMonthMode('nth'); onChange(compose({ monthMode: 'nth' })) }}
                  className={`flex-1 text-xs rounded-xl px-3 py-1.5 border transition-colors ${monthMode === 'nth' ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-on-surface-variant'}`}
                >
                  On a weekday
                </button>
              </div>
              {monthMode === 'day' ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-on-surface-variant">On day</span>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={monthDay}
                    onChange={(e) => {
                      const n = Math.min(31, Math.max(1, Number(e.target.value) || 1))
                      setMonthDay(n)
                      onChange(compose({ monthDay: n }))
                    }}
                    className="h-8 w-16 rounded-xl bg-input border-border"
                    disabled={disabled}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={String(ordinal)}
                    onValueChange={(v) => { setOrdinal(Number(v)); onChange(compose({ ordinal: Number(v) })) }}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9 rounded-xl bg-input border-border w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-2xl">
                      {ORDINALS.map((o) => (
                        <SelectItem key={o.v} value={String(o.v)}>{o.l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={ordinalWeekday}
                    onValueChange={(v) => { setOrdinalWeekday(v as WeekdayCode); onChange(compose({ ordinalWeekday: v as WeekdayCode })) }}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9 rounded-xl bg-input border-border w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border rounded-2xl">
                      {WEEKDAY_CODES.map((c) => (
                        <SelectItem key={c} value={c}>{WEEKDAY_NAMES[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Yearly month + day */}
          {freq === 'YEARLY' && (
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={String(yearMonth)}
                onValueChange={(v) => { setYearMonth(Number(v)); onChange(compose({ yearMonth: Number(v) })) }}
                disabled={disabled}
              >
                <SelectTrigger className="h-9 rounded-xl bg-input border-border w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-2xl">
                  {MONTHS.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                max={31}
                value={yearDay}
                onChange={(e) => {
                  const n = Math.min(31, Math.max(1, Number(e.target.value) || 1))
                  setYearDay(n)
                  onChange(compose({ yearDay: n }))
                }}
                className="h-9 w-16 rounded-xl bg-input border-border"
                disabled={disabled}
              />
            </div>
          )}

          <p className="text-xs text-primary font-medium">
            {describeRecurrence(value ?? { freq: freq as RecurrenceFreq })}
          </p>
        </div>
      )}
    </div>
  )
}
