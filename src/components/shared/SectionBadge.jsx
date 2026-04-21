export default function SectionBadge({ children, variant = "primary" }) {
  const styles = variant === "secondary"
    ? "text-secondary bg-secondary/5 border-secondary/15"
    : "text-primary bg-primary/5 border-primary/15";

  return (
    <span className={`inline-block text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full border mb-4 ${styles}`}>
      {children}
    </span>
  );
}