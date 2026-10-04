import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'overview' | 'tasks' | 'calendar' | 'notes' | 'files' | 'book' | 'flag' | 'shield' | 'settings' | 'help'
  | 'search' | 'down' | 'up' | 'right' | 'left' | 'collapse' | 'bell' | 'plus' | 'upRight' | 'arrow' | 'filter'
  | 'clock' | 'sun' | 'moon' | 'more' | 'check' | 'close' | 'external' | 'copy' | 'download' | 'upload'
  | 'refresh' | 'sort' | 'pin' | 'target' | 'file' | 'trash' | 'pen' | 'info' | 'location'
  | 'repeat' | 'star' | 'logout' | 'image' | 'video' | 'audio' | 'folderPlus' | 'grip' | 'clipboard' | 'move'

const iconPaths: Record<IconName, ReactNode> = {
  overview: <><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="14" width="6.5" height="6.5" rx="1.5"/></>,
  tasks: <><circle cx="12" cy="12" r="8.5"/><path d="m8 12 2.7 2.7L16.5 9"/></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M7.5 3v4M16.5 3v4M3.5 10h17M7.5 14h2M14.5 14h2M7.5 17h2"/></>,
  notes: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></>,
  files: <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
  book: <path d="M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1zM12 5v15"/>,
  flag: <path d="M5 21V4m0 0c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>,
  shield: <><path d="M12 3 4.5 6v5c0 5 3.5 8 7.5 10 4-2 7.5-5 7.5-10V6z"/><path d="m8.5 11.5 2.5 2.5 4.5-4.5"/></>,
  settings: <><path d="m9.5 3-.7 2.3-2 .9-2.2-.6-2 3.4 1.6 1.7v2.6L2.6 15l2 3.4 2.2-.6 2 .9.7 2.3h5l.7-2.3 2-.9 2.2.6 2-3.4-1.6-1.7v-2.6L21.4 9l-2-3.4-2.2.6-2-.9L14.5 3z"/><circle cx="12" cy="12" r="3"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 8.7a2.6 2.6 0 0 1 5 .9c0 2-2.5 2-2.5 4M12 17h.01"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
  down: <path d="m7 10 5 5 5-5"/>,
  up: <path d="m7 14 5-5 5 5"/>,
  right: <path d="m9 6 6 6-6 6"/>,
  left: <path d="m15 6-6 6 6 6"/>,
  collapse: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m7-11-3 3 3 3"/></>,
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  upRight: <path d="M6 18 18 6M7 6h11v11"/>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4"/><circle cx="8" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></>,
  moon: <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
  check: <path d="m5 12 4.5 4.5L19 7"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  external: <path d="M14 3h7v7m0-7L11 13M10 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5"/>,
  copy: <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>,
  upload: <path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4"/>,
  refresh: <path d="M20 7a8 8 0 0 0-14-2L3 8m0-5v5h5M4 17a8 8 0 0 0 14 2l3-3m0 5v-5h-5"/>,
  sort: <path d="M8 4v16m-3-3 3 3 3-3M16 20V4m-3 3 3-3 3 3"/>,
  pin: <path d="m16 3 5 5-4 2-3 5-2 1-4-4 1-2 5-3zM8 16l-5 5"/>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
  file: <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6"/>,
  trash: <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>,
  pen: <path d="m14 5 5 5M3 21l5-1L21 7a2.1 2.1 0 0 0 0-3l-1-1a2.1 2.1 0 0 0-3 0L4 16z"/>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
  location: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
  repeat: <path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3"/>,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></>,
  video: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9.5 5 2.5-5 2.5z"/></>,
  audio: <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>,
  folderPlus: <path d="M12 11v6M9 14h6M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
  grip: <path d="M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01"/>,
  clipboard: <path d="M9 3h6v3H9zM7 5H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>,
  move: <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>,
}

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

export default function Icon({ name, size = 18, className = '', ...rest }: IconProps) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {iconPaths[name]}
    </svg>
  )
}
