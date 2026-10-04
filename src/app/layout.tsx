import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Amiri } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from '@/components/Providers'
import { PWAProvider } from '@/components/PWAProvider'
import DynamicHead from '@/components/DynamicHead'
import ToastHost from '@/components/app/ToastHost'
import { THEME_BOOT_SCRIPT } from '@/lib/theme'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' })
const jetbrains = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin'], display: 'swap' })
const amiri = Amiri({ variable: '--font-amiri', subsets: ['arabic', 'latin'], weight: ['400', '700'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Personal dashboard',
  manifest: '/manifest.json',
  icons: { icon: '/logo.png', apple: '/logo.png' },
}

// The boot script rewrites these to the chosen theme; the media queries only cover the first paint.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EFEBD4' },
    { media: '(prefers-color-scheme: dark)', color: '#232A2E' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrains.variable} ${amiri.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <DynamicHead />
        <PWAProvider>
          <Providers>{children}</Providers>
        </PWAProvider>
        <ToastHost />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
