import React, { useEffect, useMemo, useState } from 'react';
import { imageForPlaceholder } from '../lib/images';

interface PlaceholderImageProps {
  className?: string;
  text?: string;
  aspectRatio?: string;
  src?: string;
  alt?: string;
}

export function PlaceholderImage({ className = '', text, aspectRatio = 'aspect-square', src, alt }: PlaceholderImageProps) {
  const fallbackSrc = useMemo(() => imageForPlaceholder(text || alt) || imageForPlaceholder('room'), [text, alt]);
  const [imageSrc, setImageSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setImageSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      src={imageSrc}
      alt={alt || text || 'BREW interior'}
      className={`bg-[#EAE7E0] w-full h-full object-cover ${aspectRatio} ${className}`}
      loading="lazy"
      onError={() => setImageSrc(fallbackSrc)}
    />
  );
}
