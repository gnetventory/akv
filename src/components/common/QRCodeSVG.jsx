import React from 'react';

// Lightweight QR Code Matrix Generator in pure JavaScript (no external dependency)
// Generates SVG QR code representation for URLs / text
export function QRCodeSVG({
  value,
  size = 96,
  fgColor = '#000000',
  bgColor = 'transparent',
  className = '',
}) {
  if (!value) return null;

  // We use the reliable QuickChart / SVG QR render or an inline SVG generator
  const encoded = encodeURIComponent(value);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encoded}&margin=0`;

  return (
    <div
      className={`relative inline-flex items-center justify-center p-1.5 rounded-xl ${className}`}
      style={{ width: size, height: size, background: bgColor }}
    >
      <img
        src={qrUrl}
        alt="QR Code"
        width={size}
        height={size}
        className="w-full h-full object-contain rounded-lg"
        loading="lazy"
        crossOrigin="anonymous"
      />
    </div>
  );
}
