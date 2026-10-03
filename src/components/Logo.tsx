import React from 'react';

interface LogoProps {
  dark?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ dark = false, className = "", size = 'md' }) => {
  const sizeClasses = {
    sm: { container: 'h-4', box: 'w-5', text: 'text-[9px]', sub: 'text-[6px] tracking-[0.2em] mt-0.5' },
    md: { container: 'h-6', box: 'w-7', text: 'text-xs', sub: 'text-[7px] tracking-[0.25em] mt-0.5' },
    lg: { container: 'h-8', box: 'w-10', text: 'text-lg', sub: 'text-[10px] tracking-[0.3em] mt-1' },
    xl: { container: 'h-12', box: 'w-16', text: 'text-3xl', sub: 'text-sm tracking-[0.35em] mt-1' },
  };

  const s = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Skewed color boxes container */}
      <div className={`flex ${s.container} overflow-hidden transform -skew-x-[15deg]`}>
        <div className={`bg-[#5DBE47] ${s.box} flex items-center justify-center`}>
          <span className={`transform skew-x-[15deg] text-white font-black ${s.text}`}>E</span>
        </div>
        <div className={`bg-[#FF4D4D] ${s.box} flex items-center justify-center`}>
          <span className={`transform skew-x-[15deg] text-white font-black ${s.text}`}>A</span>
        </div>
        <div className={`bg-[#FFD100] ${s.box} flex items-center justify-center`}>
          <span className={`transform skew-x-[15deg] text-white font-black ${s.text}`}>S</span>
        </div>
        <div className={`bg-[#33A1FD] ${s.box} flex items-center justify-center`}>
          <span className={`transform skew-x-[15deg] text-white font-black ${s.text}`}>Y</span>
        </div>
      </div>
      {/* Subtext */}
      <div className={`font-black ${s.sub} ${dark ? 'text-white' : 'text-[#222]'}`}>
        TICKETS
      </div>
    </div>
  );
};

export default Logo;
