/** Material Symbols Outlined icon (same icon set as the Stitch export). Decorative by default. */
export function Icon({
  name,
  className = "",
  label,
}: {
  name: string;
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {name}
    </span>
  );
}
