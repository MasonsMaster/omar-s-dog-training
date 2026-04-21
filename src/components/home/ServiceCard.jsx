import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import CheckItem from "../shared/CheckItem";

export default function ServiceCard({ service }) {
  const { name, price, unit, tag, desc, checks, feat } = service;

  return (
    <div
      className={`relative bg-card rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${
        feat
          ? "border-2 border-primary shadow-md shadow-primary/5"
          : "border border-border hover:border-primary/30"
      }`}
    >
      {tag && (
        <span className={`absolute top-4 right-4 text-[10px] font-bold px-3 py-1 rounded-full ${
          feat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        }`}>
          {tag}
        </span>
      )}

      <h3 className="font-bold text-base mb-2 pr-16">{name}</h3>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{desc}</p>

      <div className="mb-4">
        {checks.map((c) => (
          <CheckItem key={c} text={c} />
        ))}
      </div>

      <div className="text-2xl font-bold mb-4">
        ${price.toLocaleString()}
        <span className="text-sm text-muted-foreground font-normal ml-1">{unit}</span>
      </div>

      <Link to="/apply">
        <Button
          className={`w-full rounded-lg gap-2 font-bold ${
            feat ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
          }`}
        >
          {feat ? "Book Now" : "Apply"}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </div>
  );
}