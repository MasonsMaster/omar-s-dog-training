import { Check } from "lucide-react";

export default function CheckItem({ text }) {
  return (
    <div className="flex items-center gap-2.5 text-sm mb-1.5">
      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" strokeWidth={3} />
      <span>{text}</span>
    </div>
  );
}