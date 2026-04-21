import { Link } from "react-router-dom";

export default function FloatingMason() {
  return (
    <Link
      to="/mason"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl shadow-lg shadow-primary/30 mason-bounce hover:scale-110 transition-transform"
      aria-label="Chat with Mason AI"
    >
      🐾
    </Link>
  );
}