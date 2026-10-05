import { useBrand } from './useBrand';

export function BrandName() {
  return <span>{useBrand()}<span className="brand-period">.</span></span>;
}
