import React from 'react';

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  color?: string; // Expecting tailwind text/border colors mostly
  size?: 'sm' | 'md' | 'lg';
}

export const Knob: React.FC<KnobProps> = ({ 
  label, value, min, max, step = 1, unit = '', onChange, color = 'border-zinc-600', size = 'md' 
}) => {
  // SAFETY: Ensure value is a number
  const safeValue = (typeof value === 'number' && !isNaN(value)) ? value : min;

  const normalize = (val: number) => (val - min) / (max - min);
  const rotation = normalize(safeValue) * 270 - 135; // -135deg to +135deg

  const handleDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startVal = safeValue;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const range = max - min;
      const deltaVal = (deltaY / 200) * range; 
      let newVal = startVal + deltaVal;
      
      if (newVal < min) newVal = min;
      if (newVal > max) newVal = max;
      
      if (step) newVal = Math.round(newVal / step) * step;
      onChange(newVal);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Modern sizing
  const outerSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';

  // Extract just the color name if possible for the accent, or default to white
  const accentColorClass = color.includes('red') ? 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)]' : 
                           color.includes('blue') ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 
                           color.includes('amber') ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
                           color.includes('orange') ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' :
                           color.includes('purple') ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]' :
                           'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]';

  return (
    <div className="flex flex-col items-center gap-2 group relative">
      <div 
        className={`relative ${outerSize} rounded-full bg-zinc-900 border border-zinc-700 shadow-xl cursor-ns-resize hover:border-zinc-500 transition-colors`}
        onMouseDown={handleDrag}
        title={`${safeValue.toFixed(1)}${unit}`}
      >
        {/* Inner Ring (Static) */}
        <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-zinc-800 to-black"></div>

        {/* Rotating Marker */}
        <div 
          className="w-full h-full rounded-full relative transition-transform duration-75 ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* LED Marker */}
          <div className={`absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2 rounded-full ${accentColorClass}`}></div>
        </div>
      </div>
      
      <div className="text-center flex flex-col">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-mono text-zinc-300">
            {safeValue > 0 && '+'}{safeValue.toFixed(step < 1 ? 1 : 0)}{unit}
        </span>
      </div>
    </div>
  );
};