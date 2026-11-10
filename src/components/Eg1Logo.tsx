import React, { useEffect, useState } from 'react';
import { useTheme } from 'eg-web-core';
import './Eg1Logo.css';

export interface Eg1LogoProps {
  /** Diameter or size in pixels (default: 110 matching eg1.in) */
  size?: number;
  /** Explicit theme override ('light' | 'dark' | 'auto') */
  theme?: 'light' | 'dark' | 'auto';
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Authentic EG1 Brand Badge Logo for eg1.in portal.
 * Implements the exact 1:1 HTML & CSS specifications from eg1.in core common.css and theme.css:
 * - 110px x 110px circular badge with concentric inner ring (5px inset)
 * - Great Vibes cursive script ("EG1") with 2.6rem sizing, weight 300
 * - Subdomain suffix (".in") in Open Sans/PT Sans, 0.8rem, revealing on hover
 * - Micro-byline dynamically decoded from data-info attribute
 * - Complete parity with light and dark gray theme variations
 *
 * @param props - Eg1LogoProps configuration
 * @returns Stylized circular brand logo element
 *
 * @example
 * ```tsx
 * <Eg1Logo size={110} theme="auto" />
 * ```
 */
export const Eg1Logo: React.FC<Eg1LogoProps> = ({
  size = 110,
  theme = 'auto',
  onClick,
  className = '',
  style = {},
}) => {
  const { isDark: activeIsDark } = useTheme();
  const isDark = theme === 'dark' ? true : theme === 'light' ? false : activeIsDark;
  const [byline, setByline] = useState('');

  // Exactly replicates eg1.in runtime decoding of data-info="YnkgR2F1dGFtIEphbmdpZA=="
  useEffect(() => {
    try {
      setByline(atob('YnkgR2F1dGFtIEphbmdpZA=='));
    } catch {
      setByline('by Gautam Jangid');
    }
  }, []);

  const scale = size / 110;

  return (
    <div
      className={`eg1-logo-badge ${!isDark ? 'theme-light' : 'theme-dark'} ${className}`}
      id="header-logo-badge"
      onClick={onClick}
      style={{
        ...(scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: 'center center' } : {}),
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      <div className="eg1-logo-content">
        <span className="eg1-logo-script">EG1</span>
        <span className="eg1-logo-domain">.in</span>
      </div>
      <div className="eg1-logo-byline" data-info="YnkgR2F1dGFtIEphbmdpZA==">
        {byline}
      </div>
    </div>
  );
};
