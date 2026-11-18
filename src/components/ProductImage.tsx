"use client";

import React, { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}

export default function ProductImage({
  src,
  alt,
  className = "h-12 w-12 rounded-xl",
  imgClassName = "object-cover",
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}
        title={alt}
      >
        <ImageOff className="h-1/2 w-1/2 stroke-[1.5]" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 ${className}`}
      title={alt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        className={`h-full w-full transition duration-300 ${imgClassName}`}
      />
    </div>
  );
}
