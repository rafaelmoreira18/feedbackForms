interface NpsInputProps {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}

function getColor(selected: number | null, n: number): string {
  if (selected !== n) return "bg-gray-100 text-gray-300 hover:bg-gray-200";
  if (n <= 6) return "bg-red-base text-white";
  if (n <= 8) return "bg-yellow-base text-white";
  return "bg-green-base text-white";
}

function Bracket({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-full flex items-end h-2 ${color}`}
        style={{ borderLeft: "2px solid currentColor", borderTop: "2px solid currentColor", borderRight: "2px solid currentColor", borderRadius: "2px 2px 0 0" }}
      />
      <span className={`text-[10px] font-semibold font-sans mt-0.5 ${color}`}>{label}</span>
    </div>
  );
}

export default function NpsInput({ label, value, onChange }: NpsInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-gray-400 font-sans">{label}</p>
      <div className="grid grid-cols-11 gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button key={n} type="button" onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(n)}
            className={`h-10 w-full rounded-lg font-bold text-sm transition-all duration-150 ${getColor(value, n)}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-11 gap-1">
        <div className="col-span-7"><Bracket color="text-red-base" label="Detrator" /></div>
        <div className="col-span-2"><Bracket color="text-yellow-base" label="Neutro" /></div>
        <div className="col-span-2"><Bracket color="text-green-base" label="Promotor" /></div>
      </div>
    </div>
  );
}
