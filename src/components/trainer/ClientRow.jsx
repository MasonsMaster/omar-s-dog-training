import { ChevronRight, Dog } from "lucide-react";

const STATUS_COLOR = {
  active: "bg-green-100 text-green-700",
  completed: "bg-muted text-muted-foreground",
  paused: "bg-amber-100 text-amber-700",
};

export default function ClientRow({ client, onClick }) {
  const activePrograms = client.schedules.filter(s => s.status === "active");
  const pendingHW = client.homework.filter(h => !h.completed).length;
  const latestReport = client.reports[0];
  const dogs = client.dogs.map(d => d.name).filter(Boolean);

  return (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-5 hover:border-primary/40 hover:shadow-sm transition-all text-left group"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-primary font-black text-sm">{client.email[0].toUpperCase()}</span>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm truncate">{client.email}</div>
        {dogs.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Dog className="w-3 h-3" /> {dogs.join(", ")}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 text-center">
        <div>
          <div className="text-base font-black">{activePrograms.length}</div>
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Programs</div>
        </div>
        <div>
          <div className={`text-base font-black ${pendingHW > 0 ? "text-amber-600" : ""}`}>{pendingHW}</div>
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Pending HW</div>
        </div>
        <div>
          <div className="text-base font-black">{client.logs.length}</div>
          <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Logs</div>
        </div>
      </div>

      {/* Programs badges */}
      <div className="hidden md:flex flex-wrap gap-1.5 max-w-[200px]">
        {activePrograms.slice(0, 2).map(s => (
          <span key={s.id} className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[s.status]}`}>
            {s.program}
          </span>
        ))}
        {activePrograms.length > 2 && (
          <span className="text-[10px] text-muted-foreground">+{activePrograms.length - 2}</span>
        )}
      </div>

      {latestReport && (
        <div className="hidden lg:block text-xs text-muted-foreground whitespace-nowrap">
          Report: {latestReport.week_start}
        </div>
      )}

      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
    </button>
  );
}