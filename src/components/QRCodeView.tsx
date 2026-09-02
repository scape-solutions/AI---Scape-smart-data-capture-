import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRCodeViewProps {
  url: string;
  size?: number;
  className?: string;
}

export function QRCodeView({ url, size = 120, className = '' }: QRCodeViewProps) {
  const [svgHtml, setSvgHtml] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (!url) return;

    QRCode.toString(url, {
      type: 'svg',
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }, (err, svgString) => {
      if (err) {
        console.error("Failed to generate standard QR code:", err);
      } else if (isMounted && svgString) {
        setSvgHtml(svgString);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [url, size]);

  if (!svgHtml) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center animate-pulse ${className}`}
      />
    );
  }

  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
