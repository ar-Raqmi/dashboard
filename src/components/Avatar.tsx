import { useEffect, useState, type ReactNode } from 'react';

/** Shows the uploaded image when set (and loadable), otherwise the fallback content. */
export function AvatarContent({ src, fallback }: { src?: string; fallback: ReactNode }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (!src || broken) return <>{fallback}</>;
  return <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} onError={() => setBroken(true)}/>;
}
