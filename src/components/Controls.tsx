interface ControlsProps {
  onReset: () => void;
  disabled?: boolean;
}

export default function Controls({
  onReset,
  disabled = false,
}: ControlsProps) {
  return (
    <div className="flex gap-3 justify-center">
      <button
        id="reset-btn"
        onClick={onReset}
        disabled={disabled}
        className="px-5 py-2.5 rounded-lg bg-white text-gray-500 border border-gray-200
          hover:bg-gray-50 hover:text-gray-700
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-all duration-150 text-sm font-medium
          cursor-pointer"
      >
        ⟲ Reset
      </button>
    </div>
  );
}
