import { useState, useEffect, type ImgHTMLAttributes, type ReactNode } from 'react';

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string | undefined;
  fallback: ReactNode;
}

// Renders an <img> when `src` is set and loads successfully; otherwise
// renders `fallback`. Used everywhere admin-uploaded images (logo, covers,
// editorial photos, hero images, news images) are displayed, so a broken
// or missing file never shows the browser's default broken-image icon.
export default function ImageWithFallback({ src, fallback, alt, ...imgProps }: ImageWithFallbackProps) {
  const [errored, setErrored] = useState(false);

  // Reset the error state whenever the URL changes (e.g. admin replaces the image).
  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored) {
    return <>{fallback}</>;
  }

  return <img src={src} alt={alt} onError={() => setErrored(true)} {...imgProps} />;
}
