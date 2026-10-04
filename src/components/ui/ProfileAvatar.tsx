import { initials } from '@/lib/dates'

interface ProfileAvatarProps {
  name: string
  src?: string | null
  className?: string
}

/** Profile picture when one is set in Settings, otherwise initials. */
export default function ProfileAvatar({ name, src, className = '' }: ProfileAvatarProps) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={`avatar avatar-photo ${className}`} src={src} alt="" />
  }
  return <span className={`avatar ${className}`} aria-hidden="true">{initials(name)}</span>
}
