import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import CheckItem from "../shared/CheckItem";

export default function MembershipCard({ membership }) {
  const { name, price, checks, feat, tag } = membership;

  return (
    <div
      className={`relative bg-card rounded-xl p-6 text-center transition-all duration-300 hover:shadow-lg ${
        feat
          ? "border-2 border-primary shadow-md shadow-primary/5 scale-[1.02]"
          : "border border-border"
      }`}
    >
      {tag && (
        <span className="absolute top-4 right-4 text-[10px] font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground">
          {tag}
        </span>
      )}

      <h3 className="font-bold text-lg mb-2">{name}</h3>

      <div className="text-3xl font-bold my-3">
        <sup className="text-base">$</sup>
        {price}
        <span className="text-sm text-muted-foreground font-normal">/mo</span>
      </div>

      <div className="text-left my-5">
        {checks.map((c) => (
          <CheckItem key={c} text={c} />
        ))}
      </div>

      <Link to="/apply">
        <Button
          className={`w-full rounded-lg gap-2 font-bold ${
            feat ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
          }`}
        >
          {feat ? "Become Alpha" : "Join"}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </div>
  );
}