import { ChevronDown } from 'lucide-react';

export function SelectField({
  label,
  value,
  onChange,
  options,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  testId: string;
}) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <span className="select-wrap">
        <select
          className="select-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          data-testid={testId}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={15} />
      </span>
    </label>
  );
}
