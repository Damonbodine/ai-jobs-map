'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { prepareWithSegments, layoutNextLine, type PreparedTextWithSegments } from '@chenglou/pretext';

interface PretextRendererProps {
  text: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  widthAtY: (y: number) => number; // Function to get width at a specific y-coordinate
  color?: string;
  className?: string;
}

export const PretextRenderer: React.FC<PretextRendererProps> = ({
  text,
  fontFamily,
  fontSize,
  lineHeight,
  widthAtY,
  color = 'currentColor',
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const result = useMemo(() => {
    if (!mounted) return null;
    const fontString = `${fontSize}px ${fontFamily}`;
    
    try {
      const prepared = prepareWithSegments(text, fontString);
      const lines: { text: string; width: number; y: number }[] = [];
      let cursor = { segmentIndex: 0, graphemeIndex: 0 };
      let currentY = 0;

      while (true) {
        const maxWidth = widthAtY(currentY);
        const line = layoutNextLine(prepared, cursor, maxWidth);
        if (!line) break;
        
        lines.push({ 
          text: line.text, 
          width: line.width, 
          y: currentY 
        });
        
        cursor = line.end;
        currentY += lineHeight;
      }

      return { lines, height: currentY };
    } catch (e) {
      console.error('Pretext layout failed:', e);
      return null;
    }
  }, [text, fontFamily, fontSize, lineHeight, widthAtY, mounted]);

  if (!mounted || !result) {
    return <div className={className}>{text}</div>;
  }

  return (
    <div 
      className={`relative select-none ${className}`} 
      style={{ 
        height: result.height, 
        fontFamily: fontFamily,
        fontSize: fontSize,
        lineHeight: `${lineHeight}px`,
        color: color
      }}
    >
      {result.lines.map((line, i) => (
        <div 
          key={i}
          className="absolute whitespace-nowrap overflow-visible transition-all duration-300"
          style={{
            top: line.y,
            left: 0,
            width: line.width,
          }}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
};
