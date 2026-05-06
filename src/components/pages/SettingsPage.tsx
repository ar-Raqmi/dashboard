'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, AppWindow, Globe, Info, Upload, Save, ImageIcon, Palette, Paintbrush, Droplets, Image as ImageLucide, Mountain } from 'lucide-react'
import { useAppStore, type BackgroundType } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// Preset gradient definitions
const GRADIENT_PRESETS = [
  { id: 'citrus-dawn', label: 'Citrus Dawn', css: 'linear-gradient(135deg, #A5D6A7 0%, #F48FB1 50%, #CE93D8 100%)' },
  { id: 'citrus-breeze', label: 'Citrus Breeze', css: 'linear-gradient(135deg, #80CBC4 0%, #A5D6A7 50%, #C5E1A5 100%)' },
  { id: 'pink-sunset', label: 'Pink Sunset', css: 'linear-gradient(135deg, #F48FB1 0%, #CE93D8 50%, #9FA8DA 100%)' },
  { id: 'ocean-mist', label: 'Ocean Mist', css: 'linear-gradient(135deg, #80DEEA 0%, #80CBC4 50%, #A5D6A7 100%)' },
  { id: 'warm-sand', label: 'Warm Sand', css: 'linear-gradient(135deg, #FFE082 0%, #FFCC80 50%, #F48FB1 100%)' },
  { id: 'forest-dew', label: 'Forest Dew', css: 'linear-gradient(135deg, #A5D6A7 0%, #66BB6A 50%, #26A69A 100%)' },
  { id: 'lavender-dream', label: 'Lavender Dream', css: 'linear-gradient(135deg, #CE93D8 0%, #B39DDB 50%, #9FA8DA 100%)' },
  { id: 'golden-hour', label: 'Golden Hour', css: 'linear-gradient(135deg, #FFD54F 0%, #FFB74D 50%, #FF8A65 100%)' },
]

// Preset solid colors
const COLOR_PRESETS = [
  '#A5D6A7', '#80CBC4', '#C5E1A5', '#FFE082', '#FFCC80',
  '#F48FB1', '#CE93D8', '#9FA8DA', '#80DEEA', '#FFAB91',
  '#B39DDB', '#66BB6A', '#26A69A', '#FFB74D', '#EF9A9A',
]

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
    background, setBackground,
  } = useAppStore()

  const [localName, setLocalName] = useState(profileName)
  const [localAppTitle, setLocalAppTitle] = useState(appTitle)
  const [localTimezone, setLocalTimezone] = useState(timezone)
  const [saved, setSaved] = useState(false)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bgImageInputRef = useRef<HTMLInputElement>(null)

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

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setBackground({ image: url })
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

  // Compute background preview style
  const previewStyle = (() => {
    switch (background.type) {
      case 'color':
        return { backgroundColor: background.color }
      case 'gradient': {
        const preset = GRADIENT_PRESETS.find((p) => p.id === background.gradient)
        return { background: preset?.css || background.gradient }
      }
      case 'image':
        return {
          backgroundImage: `url(${background.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      default:
        return {}
    }
  })()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-2xl bg-primary/15">
          <Settings className="size-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Settings</h1>
      </motion.div>

      {/* Profile Section */}
      <motion.section
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="rounded-3xl bg-card border border-border p-6 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <User className="size-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative group">
            <Avatar className="size-20 rounded-2xl">
              <AvatarImage src={profilePicture} alt="Profile" />
              <AvatarFallback className="bg-muted text-primary text-2xl rounded-2xl">
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
            <label className="text-sm text-on-surface-variant">Display Name</label>
            <Input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Your name"
              className="rounded-2xl bg-input border-border"
            />
          </div>
        </div>
      </motion.section>

      {/* Background Section */}
      <motion.section
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="rounded-3xl bg-card border border-border p-6 flex flex-col gap-5"
      >
        <div className="flex items-center gap-2">
          <Palette className="size-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Background</h2>
        </div>

        {/* Background Type Tabs */}
        <Tabs
          value={background.type}
          onValueChange={(val) => setBackground({ type: val as BackgroundType })}
          className="w-full"
        >
          <TabsList className="w-full rounded-2xl">
            <TabsTrigger value="default" className="rounded-xl flex-1 gap-1.5">
              <Droplets className="size-3.5" />
              <span className="hidden sm:inline">Default</span>
            </TabsTrigger>
            <TabsTrigger value="color" className="rounded-xl flex-1 gap-1.5">
              <Paintbrush className="size-3.5" />
              <span className="hidden sm:inline">Color</span>
            </TabsTrigger>
            <TabsTrigger value="gradient" className="rounded-xl flex-1 gap-1.5">
              <Mountain className="size-3.5" />
              <span className="hidden sm:inline">Gradient</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="rounded-xl flex-1 gap-1.5">
              <ImageLucide className="size-3.5" />
              <span className="hidden sm:inline">Image</span>
            </TabsTrigger>
          </TabsList>

          {/* Default */}
          <TabsContent value="default" className="mt-4">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="size-16 rounded-2xl bg-muted border border-border flex items-center justify-center">
                <Droplets className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Using the default clean background. No decorative layer will be shown.
              </p>
            </div>
          </TabsContent>

          {/* Solid Color */}
          <TabsContent value="color" className="mt-4">
            <div className="flex flex-col gap-4">
              {/* Preset colors */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-on-surface-variant">Preset Colors</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBackground({ color })}
                      className={`size-9 rounded-xl border-2 transition-all hover:scale-110 active:scale-95 ${
                        background.color === color
                          ? 'border-primary ring-2 ring-primary/30 scale-110'
                          : 'border-transparent hover:border-primary/30'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Custom color */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-on-surface-variant">Custom Color</Label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={background.color}
                      onChange={(e) => setBackground({ color: e.target.value })}
                      className="size-10 rounded-xl cursor-pointer border-2 border-border p-0.5 bg-transparent"
                    />
                  </div>
                  <Input
                    value={background.color}
                    onChange={(e) => setBackground({ color: e.target.value })}
                    className="rounded-2xl bg-input border-border font-mono text-sm flex-1"
                    placeholder="#A5D6A7"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Gradient */}
          <TabsContent value="gradient" className="mt-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-on-surface-variant">Gradient Presets</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setBackground({ gradient: preset.id })}
                    className={`group relative h-16 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 overflow-hidden ${
                      background.gradient === preset.id
                        ? 'border-primary ring-2 ring-primary/30 scale-105'
                        : 'border-transparent hover:border-primary/30'
                    }`}
                    style={{ background: preset.css }}
                  >
                    <div className="absolute inset-x-0 bottom-0 bg-black/40 backdrop-blur-sm px-2 py-1">
                      <span className="text-[10px] text-white font-medium leading-tight">
                        {preset.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Image */}
          <TabsContent value="image" className="mt-4">
            <div className="flex flex-col gap-4">
              {/* Upload or URL */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-on-surface-variant">Background Image</Label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="rounded-2xl border-border"
                    onClick={() => bgImageInputRef.current?.click()}
                  >
                    <Upload className="size-4 mr-2" />
                    Upload
                  </Button>
                  <input
                    ref={bgImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBgImageUpload}
                  />
                  {background.image && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-2xl text-destructive hover:text-destructive"
                      onClick={() => setBackground({ image: '' })}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {background.image && (
                  <div className="relative h-32 rounded-2xl overflow-hidden border border-border">
                    <img
                      src={background.image}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Image URL input */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm text-on-surface-variant">Or paste image URL</Label>
                <Input
                  value={background.image && !background.image.startsWith('blob:') ? background.image : ''}
                  onChange={(e) => setBackground({ image: e.target.value })}
                  className="rounded-2xl bg-input border-border text-sm"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Opacity Slider - shown for all non-default types */}
        {background.type !== 'default' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-on-surface-variant flex items-center gap-2">
                <Droplets className="size-3.5" />
                Opacity
              </Label>
              <span className="text-sm font-medium text-primary tabular-nums">
                {background.opacity}%
              </span>
            </div>
            <Slider
              value={[background.opacity]}
              onValueChange={([val]) => setBackground({ opacity: val })}
              min={5}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        )}

        {/* Live Preview */}
        {background.type !== 'default' && (
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-on-surface-variant">Preview</Label>
            <div className="relative h-28 rounded-2xl border border-border overflow-hidden bg-background">
              {/* Background layer */}
              <div
                className="absolute inset-0"
                style={{
                  ...previewStyle,
                  opacity: background.opacity / 100,
                }}
              />
              {/* Simulated card overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border px-6 py-3 shadow-sm">
                  <p className="text-sm text-foreground font-medium">Widget Card Preview</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Background shows behind cards</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.section>

      {/* App Section */}
      <motion.section
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="rounded-3xl bg-card border border-border p-6 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <AppWindow className="size-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">App</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-on-surface-variant">App Title</label>
            <Input
              value={localAppTitle}
              onChange={(e) => setLocalAppTitle(e.target.value)}
              placeholder="App title"
              className="rounded-2xl bg-input border-border"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-on-surface-variant">App Logo</label>
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden">
                {appLogo ? (
                  <img src={appLogo} alt="App Logo" className="size-full object-cover" />
                ) : (
                  <ImageIcon className="size-6 text-outline" />
                )}
              </div>
              <Button
                variant="outline"
                className="rounded-2xl border-border"
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
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="rounded-3xl bg-card border border-border p-6 flex flex-col gap-4"
      >
        <div className="flex items-center gap-2">
          <Globe className="size-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Timezone</h2>
        </div>
        <Select value={localTimezone} onValueChange={setLocalTimezone}>
          <SelectTrigger className="rounded-2xl bg-input border-border w-full">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border rounded-2xl max-h-64">
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-outline">
          Current: {new Date().toLocaleString('en-US', { timeZone: localTimezone })}
        </p>
      </motion.section>

      {/* About Section */}
      <motion.section
        custom={4}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="rounded-3xl bg-card border border-border p-6 flex flex-col gap-3"
      >
        <div className="flex items-center gap-2">
          <Info className="size-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">About</h2>
        </div>
        <Separator className="bg-border" />
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">App Name</span>
            <span className="text-foreground">{appTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="text-foreground">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Credits</span>
            <span className="text-primary">ar-Raqmi Team</span>
          </div>
        </div>
      </motion.section>

      {/* Save Button */}
      <motion.div
        custom={5}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="sticky bottom-4"
      >
        <Button
          onClick={handleSave}
          className="w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
        >
          <Save className="size-5 mr-2" />
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </motion.div>
    </div>
  )
}
