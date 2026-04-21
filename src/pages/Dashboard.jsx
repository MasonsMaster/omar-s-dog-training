import { useState } from "react";
import { Input } from "@/components/ui/input";
import SectionBadge from "@/components/shared/SectionBadge";
import { BLUEPRINT, PROMO_CODES } from "@/lib/constants";

const REVENUE_CATEGORIES = [
  { key: "t", label: "Training", color: "text-primary" },
  { key: "p", label: "Pet Svc", color: "text-secondary" },
  { key: "v", label: "Virtual", color: "text-purple-600" },
  { key: "m", label: "Members", color: "text-green-600" },
  { key: "c", label: "Coaching", color: "text-amber-500" },
  { key: "s", label: "Products", color: "text-pink-500" },
];

export default function Dashboard() {
  const [rev, setRev] = useState({ t: 0, p: 0, v: 0, m: 0, c: 0, s: 0 });
  const totalBP = BLUEPRINT.reduce((s, r) => s + r.r, 0);
  const totalRev = Object.values(rev).reduce((s, v) => s + v, 0);
  const pct = Math.min(100, (totalRev / 50000) * 100);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
      <SectionBadge>Revenue Tracker</SectionBadge>
      <h1 className="font-heading text-3xl md:text-4xl mb-8">
        $50K/Month <span className="italic text-primary">Blueprint</span>
      </h1>

      {/* Progress */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex justify-between mb-3">
          <span className="font-semibold text-sm">Monthly Goal</span>
          <span className="font-bold">${totalRev.toLocaleString()} / $50,000</span>
        </div>
        <div className="bg-muted rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${totalRev >= 50000 ? "bg-green-500" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Revenue inputs */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-bold mb-4">Track Revenue</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {REVENUE_CATEGORIES.map(({ key, label, color }) => (
            <div key={key} className="text-center">
              <div className={`text-[10px] font-bold ${color} mb-2`}>{label}</div>
              <Input
                type="number"
                value={rev[key] || ""}
                onChange={(e) => setRev((p) => ({ ...p, [key]: +e.target.value || 0 }))}
                className="text-center font-bold text-base"
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Blueprint table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div className="p-6 border-b border-border">
          <h3 className="font-bold">Blueprint → ${totalBP.toLocaleString()}/month</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                {["Service", "Clients", "Price", "Revenue"].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold text-primary tracking-widest px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLUEPRINT.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-5 py-3 text-sm">{r.s}</td>
                  <td className="px-5 py-3 text-sm">{r.c}</td>
                  <td className="px-5 py-3 text-sm">${r.p.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm font-bold text-secondary">${r.r.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-primary/5">
                <td colSpan={3} className="px-5 py-4 font-bold">TOTAL</td>
                <td className="px-5 py-4 font-black text-primary text-lg">${totalBP.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Promo codes */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-bold mb-4">🎁 Active Promo Codes</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PROMO_CODES.map(({ code, desc }) => (
            <div key={code} className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-center">
              <div className="font-mono font-black text-primary">{code}</div>
              <div className="text-xs font-medium text-muted-foreground mt-1">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}