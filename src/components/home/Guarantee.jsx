import { Shield } from "lucide-react";

export default function Guarantee() {
  return (
    <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-20">
      <div className="bg-secondary text-secondary-foreground rounded-xl p-4 md:p-5 flex items-center justify-center gap-3 text-sm md:text-base font-semibold shadow-lg">
        <Shield className="w-5 h-5 flex-shrink-0" />
        <span>
          <strong>Guarantee:</strong> No improvement in 3 sessions? Get an extra session FREE. No questions asked.
        </span>
      </div>
    </div>
  );
}