interface PriceFilterProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  label?: string;
  className?: string;
}

export default function PriceFilter({
  min,
  max,
  value,
  onChange,
  label = "Preço",
  className = "",
}: PriceFilterProps) {
  return (
    <div className={className}>
      <label className="block text-xs mb-1 text-gray-300">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={value[1]}
          value={value[0]}
          onChange={(e) => onChange([+e.target.value, value[1]])}
          className="w-16 px-2 py-1 rounded bg-gray-700 border border-gray-600 text-white text-xs"
        />
        <span className="text-gray-400">-</span>
        <input
          type="number"
          min={value[0]}
          {...(max > 0 ? { max } : {})}
          value={value[1]}
          onChange={(e) => onChange([value[0], +e.target.value])}
          className="w-16 px-2 py-1 rounded bg-gray-700 border border-gray-600 text-white text-xs"
        />
      </div>
    </div>
  );
} 