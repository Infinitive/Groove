import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  value?: number; // 0 to 5
  onChange?: (val: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  value = 0,
  onChange,
  size = 'md',
  showLabel = false,
}) => {
  const isInteractive = Boolean(onChange);

  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const currentVal = Math.max(0, Math.min(5, value));

  return (
    <div
      className="inline-flex items-center gap-1.5"
      role={isInteractive ? 'radiogroup' : 'img'}
      aria-label={isInteractive ? `Rating: ${currentVal > 0 ? `${currentVal} stars` : 'Unrated'}` : `Rated ${currentVal} out of 5 stars`}
    >
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const filled = currentVal >= starIndex;
          const half = !filled && currentVal >= starIndex - 0.5;

          if (!isInteractive) {
            return (
              <div key={starIndex} className="relative select-none" aria-hidden="true">
                <Star
                  className={`${starSizes[size]} ${
                    filled
                      ? 'fill-[#FFB800] text-[#FFB800]'
                      : half
                      ? 'text-[#FFB800]'
                      : 'text-white/20'
                  }`}
                />
                {half && (
                  <div className="absolute inset-0 overflow-hidden w-[50%] pointer-events-none">
                    <Star className={`${starSizes[size]} fill-[#FFB800] text-[#FFB800]`} />
                  </div>
                )}
              </div>
            );
          }

          // Interactive mode with two click zones per star: left half (index - 0.5) and right half (index)
          return (
            <div key={starIndex} className="relative group cursor-pointer active:scale-90 transition-transform">
              <Star
                aria-hidden="true"
                className={`${starSizes[size]} transition-colors ${
                  filled
                    ? 'fill-[#FFB800] text-[#FFB800]'
                    : half
                    ? 'text-[#FFB800]'
                    : 'text-white/20 group-hover:text-white/40'
                }`}
              />
              {half && (
                <div className="absolute inset-0 overflow-hidden w-[50%] pointer-events-none" aria-hidden="true">
                  <Star className={`${starSizes[size]} fill-[#FFB800] text-[#FFB800]`} />
                </div>
              )}
              {/* Left half clickable zone */}
              <button
                type="button"
                className="absolute inset-y-0 left-0 w-1/2 opacity-0 z-10 cursor-pointer"
                title={`${starIndex - 0.5} stars`}
                aria-label={`Rate ${starIndex - 0.5} stars`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.(currentVal === starIndex - 0.5 ? 0 : starIndex - 0.5);
                }}
              />
              {/* Right half clickable zone */}
              <button
                type="button"
                className="absolute inset-y-0 right-0 w-1/2 opacity-0 z-10 cursor-pointer"
                title={`${starIndex} stars`}
                aria-label={`Rate ${starIndex} stars`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.(currentVal === starIndex ? starIndex - 0.5 : starIndex);
                }}
              />
            </div>
          );
        })}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold text-[#8E8E93] ml-1 tabular-nums">
          {currentVal > 0 ? currentVal.toFixed(1) : 'Unrated'}
        </span>
      )}
    </div>
  );
};
