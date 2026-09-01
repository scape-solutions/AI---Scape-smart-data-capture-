import React, { useMemo } from 'react';
import { generateQRSvgString } from '../utils/qrGenerator';

interface QRCodeViewProps {
  url: string;
  size?: number;
  className?: string;
}

export function QRCodeView({ url, size = 120, className = '' }: QRCodeViewProps) {
  const svgHtml = useMemo(() => {
    try {
      return generateQRSvgString(url, size);
    } catch (e) {
      console.error("Failed to generate QR code:", e);
      return '';
    }
  }, [url, size]);

  if (!svgHtml) return null;

  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
