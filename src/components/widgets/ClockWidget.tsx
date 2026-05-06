'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'

const TIMEZONES = [
  { label: 'Kuala Lumpur (MYT)', value: 'Asia/Kuala_Lumpur' },
  { label: 'Makkah (AST)', value: 'Asia/Riyadh' },
  { label: 'London (GMT)', value: 'Europe/London' },
  { label: 'New York (EST)', value: 'America/New_York' },
  { label: 'Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Istanbul (TRT)', value: 'Europe/Istanbul' },
  { label: 'Jakarta (WIB)', value: 'Asia/Jakarta' },
  { label: 'Cairo (EET)', value: 'Africa/Cairo' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Sydney (AEST)', value: 'Australia/Sydney' },
]

function AnimatedDigit({ digit }: { digit: string }) {
  return (
    <div className="relative inline-block overflow-hidden w-[1ch]">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="inline-block"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

function AnimatedTime({ timeStr }: { timeStr: string }) {
  return (
    <span className="font-mono">
      {timeStr.split('').map((char, i) =>
        char === ':' ? (
          <span key={`sep-${i}`} className="opacity-60 mx-0.5">
            :
          </span>
        ) : (
          <AnimatedDigit key={`${i}-${char}`} digit={char} />
        )
      )}
    </span>
  )
}

export default function ClockWidget() {
  const { timezone, setTimezone } = useAppStore()
  const [now, setNow] = useState(new Date())
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getTimeString = useCallback(
    (format: 'time' | 'date' | 'label') => {
      try {
        if (format === 'time') {
          return now.toLocaleTimeString('en-GB', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
        }
        if (format === 'date') {
          return now.toLocaleDateString('en-US', {
            timeZone: timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        }
        // label
        const tz = TIMEZONES.find((t) => t.value === timezone)
        return tz ? tz.label : timezone
      } catch {
        return format === 'time' ? '--:--:--' : format === 'date' ? '---' : timezone
      }
    },
    [now, timezone]
  )

  const timeStr = getTimeString('time')
  const dateStr = getTimeString('date')
  const tzLabel = getTimeString('label')

  return (
    <div className="flex flex-col h-full items-center justify-center text-center relative">
      {/* Config Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="absolute top-0 right-0 w-7 h-7 rounded-xl hover:bg-[oklch(0.2_0.01_155)] flex items-center justify-center transition-colors"
      >
        <Settings2 className="w-3.5 h-3.5 text-[oklch(0.5_0.01_155)]" />
      </button>

      {/* Timezone Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-8 right-0 z-50 w-56 max-h-48 overflow-y-auto rounded-2xl bg-[oklch(0.17_0.008_155)] border border-[oklch(0.25_0.01_155)] shadow-xl scrollbar-thin"
          >
            {TIMEZONES.map((tz) => (
              <button
                key={tz.value}
                onClick={() => {
                  setTimezone(tz.value)
                  setShowDropdown(false)
                }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  timezone === tz.value
                    ? 'text-[oklch(0.72_0.19_142)] bg-[oklch(0.72_0.19_142)/10]'
                    : 'text-[oklch(0.7_0.01_155)] hover:bg-[oklch(0.2_0.01_155)]'
                }`}
              >
                {tz.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time Display */}
      <div className="text-3xl font-bold text-[oklch(0.72_0.19_142)] tracking-wider mb-1.5">
        <AnimatedTime timeStr={timeStr} />
      </div>

      {/* Timezone Label */}
      <p className="text-[10px] text-[oklch(0.5_0.01_155)] font-medium uppercase tracking-wider mb-1">
        {tzLabel}
      </p>

      {/* Date */}
      <p className="text-xs text-[oklch(0.6_0.01_155)]">{dateStr}</p>
    </div>
  )
}
