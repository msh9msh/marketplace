export function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  step?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-neutral-600" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        step={step}
        className="rounded border px-2 py-1 text-neutral-900"
      />
    </div>
  );
}
