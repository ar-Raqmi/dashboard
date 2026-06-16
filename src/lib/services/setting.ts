import { BaseService } from './base'
import { HijriCalendarFactory } from './hijri'

export class SettingService extends BaseService {
  async get(args: { sessionToken: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    let settings = await this.db.userSettings.findUnique({
      where: { userId: user.id },
    })

    if (!settings) {
      settings = await this.db.userSettings.create({
        data: {
          userId: user.id,
          profileName: user.username,
          profilePicture: '',
          appTitle: 'Dashboard',
          appLogo: '/logo.png',
          iconBackgroundColor: '#A5D6A7',
          hijriVisible: true,
          hijriOffset: 0,
          hijriProvider: 'calculated',
          hijriCalendar: 'UmmAlQura',
          showSeconds: true,
          clipboardText: '',
          backgroundType: 'default',
          backgroundColor: '#A5D6A7',
          backgroundGradient: 'citrus-dawn',
          backgroundImage: '',
          backgroundOpacity: 30,
        },
      })
    }

    // Resolve the Hijri Date using factory and strategy design patterns
    const providerKey = settings.hijriProvider || 'calculated'
    const calendarType = settings.hijriCalendar || 'UmmAlQura'
    const provider = HijriCalendarFactory.getProvider(providerKey)
    
    const today = new Date()
    const hijriArg = providerKey === 'calculated' ? String(settings.hijriOffset || 0) : calendarType
    const hijriDate = await provider.getHijriDate(today, hijriArg)

    return {
      profileName: settings.profileName,
      profilePicture: settings.profilePicture || undefined,
      appTitle: settings.appTitle,
      appLogo: settings.appLogo || undefined,
      iconBackgroundColor: settings.iconBackgroundColor,
      hijriVisible: settings.hijriVisible,
      hijriOffset: settings.hijriOffset,
      hijriProvider: settings.hijriProvider,
      hijriCalendar: settings.hijriCalendar,
      hijriDate: hijriDate || undefined,
      showSeconds: settings.showSeconds,
      clipboardText: settings.clipboardText,
      background: {
        type: settings.backgroundType,
        color: settings.backgroundColor,
        gradient: settings.backgroundGradient,
        image: settings.backgroundImage,
        opacity: settings.backgroundOpacity,
      },
    }
  }

  async update(args: {
    sessionToken: string
    profileName?: string
    profilePicture?: string
    appTitle?: string
    appLogo?: string
    iconBackgroundColor?: string
    hijriVisible?: boolean
    hijriOffset?: number
    hijriProvider?: string
    hijriCalendar?: string
    showSeconds?: boolean
    clipboardText?: string
    background?: {
      type?: string
      color?: string
      gradient?: string
      image?: string
      opacity?: number
    }
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const {
      profileName,
      profilePicture,
      appTitle,
      appLogo,
      iconBackgroundColor,
      hijriVisible,
      hijriOffset,
      hijriProvider,
      hijriCalendar,
      showSeconds,
      clipboardText,
      background,
    } = args

    const data: any = {}
    if (profileName !== undefined) data.profileName = profileName
    if (profilePicture !== undefined) data.profilePicture = profilePicture
    if (appTitle !== undefined) data.appTitle = appTitle
    if (appLogo !== undefined) data.appLogo = appLogo
    if (iconBackgroundColor !== undefined) data.iconBackgroundColor = iconBackgroundColor
    if (hijriVisible !== undefined) data.hijriVisible = hijriVisible
    if (hijriOffset !== undefined) data.hijriOffset = hijriOffset
    if (hijriProvider !== undefined) data.hijriProvider = hijriProvider
    if (hijriCalendar !== undefined) data.hijriCalendar = hijriCalendar
    if (showSeconds !== undefined) data.showSeconds = showSeconds
    if (clipboardText !== undefined) data.clipboardText = clipboardText

    if (background !== undefined) {
      if (background.type !== undefined) data.backgroundType = background.type
      if (background.color !== undefined) data.backgroundColor = background.color
      if (background.gradient !== undefined) data.backgroundGradient = background.gradient
      if (background.image !== undefined) data.backgroundImage = background.image
      if (background.opacity !== undefined) data.backgroundOpacity = background.opacity
    }

    await this.db.userSettings.update({
      where: { userId: user.id },
      data,
    })
    return { success: true }
  }
}
