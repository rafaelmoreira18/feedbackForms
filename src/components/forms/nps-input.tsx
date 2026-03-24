interface NpsInputProps {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}

export default function NpsInput({ label, value, onChange }: NpsInputProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-400 font-sans">{label}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(1)}
          className={`flex-1 h-14 rounded-xl font-bold text-base transition-all duration-150 border-2 ${
            value === 1
              ? "bg-green-base border-green-base text-white"
              : "bg-white border-gray-200 text-gray-300 hover:border-green-base hover:text-green-base"
          }`}
        >
          ✓ Sim
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange(0)}
          className={`flex-1 h-14 rounded-xl font-bold text-base transition-all duration-150 border-2 ${
            value === 0
              ? "bg-red-base border-red-base text-white"
              : "bg-white border-gray-200 text-gray-300 hover:border-red-base hover:text-red-base"
          }`}
        >
          ✗ Não
        </button>
      </div>
    </div>
  );
}
