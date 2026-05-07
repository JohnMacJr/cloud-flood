import { COLORS } from '../lib/constants';

interface ColorPickerProps {
  currentColor: number;
  onPickColor: (colorId: number) => void;
  disabled?: boolean;
}

export default function ColorPicker({
  currentColor,
  onPickColor,
  disabled = false,
}: ColorPickerProps) {
  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {COLORS.map((color) => {
        const isCurrent = color.id === currentColor;
        return (
          <button
            key={color.id}
            id={`color-btn-${color.id}`}
            onClick={() => onPickColor(color.id)}
            disabled={disabled || isCurrent}
            className={`
              w-12 h-12 rounded-lg
              transition-all duration-150 ease-out
              border-2 cursor-pointer
              ${
                isCurrent
                  ? 'border-gray-300 opacity-35 scale-90 cursor-not-allowed'
                  : 'border-transparent hover:scale-110 active:scale-95'
              }
            `}
            style={{ backgroundColor: color.hex }}
            aria-label={`Choose ${color.name}`}
            title={color.name}
          />
        );
      })}
    </div>
  );
}
