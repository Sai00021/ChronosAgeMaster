import React from 'react';

interface AdPlaceholderProps {
  slot: string;
  className?: string;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ slot, className = "" }) => {
  return (
    <div 
      className={`bg-neutral-100 border-2 border-dashed border-neutral-300 rounded-lg flex flex-col items-center justify-center p-4 min-h-[100px] text-neutral-400 ${className}`}
      id={`ad-slot-${slot}`}
    >
      <span className="text-xs font-mono uppercase tracking-widest mb-1">Advertisement</span>
      <span className="text-[10px] opacity-50">AdSense Slot: {slot}</span>
      <div className="mt-2 w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
        <div className="bg-neutral-300 h-full w-1/3 animate-pulse"></div>
      </div>
    </div>
  );
};
