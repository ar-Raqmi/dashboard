'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, AppWindow, Globe, Info, Upload, Save, ImageIcon } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Istanbul',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Jakarta',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'Africa/Cairo',
  'Africa/Lagos',
  'Africa/Johannesburg',
]

export default function SettingsPage() {
  const {
    profileName, setProfileName,
    profilePicture, setProfilePicture,
    appTitle, setAppTitle,
    appLogo, setAppLogo,
    timezone, setTimezone,
  } = useAppStore()

  const [localName, setLocalName] = useState(profileName)
  const [localAppTitle, setLocalAppTitle] = useState(appTitle)
  const [localTimezone, setLocalTimezone] = useState(timezone)
  const [saved, setSaved] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setProfilePicture(url)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAppLogo(url)
  }

  const handleSave = () => {
    setProfileName(localName)
    setAppTitle(localAppTitle)
    setTimezone(localTimezone)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4 },
    }),
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-2xl bg-[oklch(0.72_0.19_142_/_0.15)]">
          <Settings className="size-6 text-[oklch(0.72_0.19_142)]" />
        </div>
        <h1 className="text-2xl font-bold">Settings</h1>
      </motion.div>

      {/* Profile Section */}
      <motion.section
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="rounded-3xl bg-[oklch(0.17_0.008_155)] border border-[oklch(0.28_0.01_155)] p-6 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <User className="size-5 text-[oklch(0.72_0.19_142)]" />
          <h2 className="text-lg font-semibold text-[oklch(0.96_0.005_155)]">Profile</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative group">
            <Avatar className="size-20 rounded-2xl">
              <AvatarImage src={profilePicture} alt="Profile" />
              <AvatarFallback className="bg-[oklch(0.22_0.008_155)] text-[oklch(0.72_0.19_142)] text-2xl rounded-2xl">
                {localName?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Upload className="size-5 text-white" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div className="flex-1 w-full flex flex-col gap-2">
            <label className="text-sm text-[oklch(0.75_0.01_155)]">Display Name</label>
            <Input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Your name"
              className="rounded-2xl bg-[oklch(0.24_0.01_155)] border-[oklch(0.28_0.01_155)]"
            />
          </div>
        </div>
      </motion.section>

      {/* App Section */}
      <motion.section
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="rounded-3xl bg-[oklch(0.17_0.008_155)] border border-[oklch(0.28_0.01_155)] p-6 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <AppWindow className="size-5 text-[oklch(0.72_0.19_142)]" />
          <h2 className="text-lg font-semibold text-[oklch(0.96_0.005_155)]">App</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-[oklch(0.75_0.01_155)]">App Title</label>
            <Input
              value={localAppTitle}
              onChange={(e) => setLocalAppTitle(e.target.value)}
              placeholder="App title"
              className="rounded-2xl bg-[oklch(0.24_0.01_155)] border-[oklch(0.28_0.01_155)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-[oklch(0.75_0.01_155)]">App Logo</label>
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-[oklch(0.22_0.008_155)] border border-[oklch(0.28_0.01_155)] flex items-center justify-center overflow-hidden">
                {appLogo ? (
                  <img src={appLogo} alt="App Logo" className="size-full object-cover" />
                ) : (
                  <ImageIcon className="size-6 text-[oklch(0.5_0.01_155)]" />
                )}
              </div>
              <Button
                variant="outline"
                className="rounded-2xl border-[oklch(0.28_0.01_155)]"
                onClick={() => logoInputRef.current?.click()}
              >
                <Upload className="size-4 mr-2" />
                Upload Logo
              </Button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Timezone Section */}
      <motion.section
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="rounded-3xl bg-[oklch(0.17_0.008_155)] border border-[oklch(0.28_0.01_155)] p-6 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <Globe className="size-5 text-[oklch(0.72_0.19_142)]" />
          <h2 className="text-lg font-semibold text-[oklch(0.96_0.005_155)]">Timezone</h2>
        </div>
        <Select value={localTimezone} onValueChange={setLocalTimezone}>
          <SelectTrigger className="rounded-2xl bg-[oklch(0.24_0.01_155)] border-[oklch(0.28_0.01_155)] w-full">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent className="bg-[oklch(0.17_0.008_155)] border-[oklch(0.28_0.01_155)] rounded-2xl max-h-64">
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-[oklch(0.55_0.01_155)]">
          Current: {new Date().toLocaleString('en-US', { timeZone: localTimezone })}
        </p>
      </motion.section>

      {/* About Section */}
      <motion.section
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="rounded-3xl bg-[oklch(0.17_0.008_155)] border border-[oklch(0.28_0.01_155)] p-6 flex flex-col gap-3"
      >
        <div className="flex items-center gap-2">
          <Info className="size-5 text-[oklch(0.72_0.19_142)]" />
          <h2 className="text-lg font-semibold text-[oklch(0.96_0.005_155)]">About</h2>
        </div>
        <Separator className="bg-[oklch(0.28_0.01_155)]" />
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[oklch(0.65_0.01_155)]">App Name</span>
            <span className="text-[oklch(0.96_0.005_155)]">{appTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[oklch(0.65_0.01_155)]">Version</span>
            <span className="text-[oklch(0.96_0.005_155)]">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[oklch(0.65_0.01_155)]">Credits</span>
            <span className="text-[oklch(0.72_0.19_142)]">ar-Raqmi Team</span>
          </div>
        </div>
      </motion.section>

      {/* Save Button */}
      <motion.div
        custom={4}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="sticky bottom-4"
      >
        <Button
          onClick={handleSave}
          className="w-full rounded-2xl bg-[oklch(0.72_0.19_142)] text-[oklch(0.13_0.005_155)] hover:bg-[oklch(0.65_0.19_142)] h-12 text-base font-semibold"
        >
          <Save className="size-5 mr-2" />
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </motion.div>
    </div>
  )
}
