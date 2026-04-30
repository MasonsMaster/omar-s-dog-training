import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import SectionBadge from "@/components/shared/SectionBadge";
import ScheduleCard from "@/components/clientdash/ScheduleCard";
import HomeworkList from "@/components/clientdash/HomeworkList";
import AppointmentsPanel from "@/components/clientdash/AppointmentsPanel";
import VideosPanel from "@/components/clientdash/VideosPanel";
import { LogOut, Dog, BookOpen, Calendar, Video, Loader2 } from "lucide-react";

const TABS = [
  { id: "schedule", label: "My Schedule", icon: Dog },
  { id: "homework", label: "Homework", icon: BookOpen },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "videos", label: "Videos", icon: Video },
];

export default function ClientDashboard() {
  const { user, isAuthenticated, isLoadingAuth, navigateToLogin, logout } = useAuth();
  const [tab, setTab] = useState("schedule");

  const email = user?.email;

  const { data: schedules = [], isLoading: loadingSched } = useQuery({
    queryKey: ["client-schedules", email],
    queryFn: () => base44.entities.TrainingSchedule.filter({ client_email: email }),
    enabled: !!email,
  });

  const hwQueryKey = ["client-homework", email];
  const { data: homework = [], isLoading: loadingHW } = useQuery({
    queryKey: hwQueryKey,
    queryFn: () => base44.entities.HomeworkTask.filter({ client_email: email }),
    enabled: !!email,
  });

  // Auth gate
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <div className="text-5xl mb-4">🐾</div>
        <h2 className="font-heading text-2xl mb-2">Client Portal</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Log in to view your training schedule, homework, and upcoming appointments.
        </p>
        <Button onClick={navigateToLogin} size="lg" className="rounded-full font-bold px-10">
          Log In to My Dashboard
        </Button>
      </div>
    );
  }

  const pendingHW = homework.filter((t) => !t.completed).length;
  const doneHW = homework.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-6 py-10 flex items-start justify-between gap-4">
          <div>
            <SectionBadge>Client Portal</SectionBadge>
            <h1 className="font-heading text-3xl md:text-4xl mt-1">
              Welcome back, <span className="italic">{user.full_name?.split(" ")[0] || "Friend"}</span>
            </h1>
            <p className="text-background/50 text-sm mt-1">{user.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="bg-background/10 border-background/20 text-background hover:bg-background/20 gap-2 rounded-full flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Button>
        </div>

        {/* Stats bar */}
        <div className="max-w-5xl mx-auto px-6 pb-6 grid grid-cols-3 gap-4">
          <div className="bg-background/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-black">{schedules.length}</div>
            <div className="text-[10px] font-bold tracking-widest text-background/50 uppercase">Programs</div>
          </div>
          <div className="bg-background/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-black">{pendingHW}</div>
            <div className="text-[10px] font-bold tracking-widest text-background/50 uppercase">Tasks Left</div>
          </div>
          <div className="bg-background/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-black">{doneHW}</div>
            <div className="text-[10px] font-bold tracking-widest text-background/50 uppercase">Completed</div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border sticky top-0 bg-background z-10">
        <div className="max-w-5xl mx-auto px-6 flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-semibold border-b-2 transition-all ${
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              {id === "homework" && pendingHW > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {pendingHW}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        {tab === "schedule" && (
          <div>
            <h2 className="font-bold text-lg mb-5">Your Training Programs</h2>
            {loadingSched ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading schedule...
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Dog className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <div className="font-bold text-sm mb-1">No active programs yet</div>
                <p className="text-xs text-muted-foreground mb-4">Your trainer will set up your schedule after your first session.</p>
                <a href="/apply">
                  <Button size="sm" className="rounded-full font-bold">Apply to Train</Button>
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {schedules.map((s) => <ScheduleCard key={s.id} schedule={s} />)}
              </div>
            )}
          </div>
        )}

        {tab === "homework" && (
          <div>
            <h2 className="font-bold text-lg mb-5">Homework & Practice Tasks</h2>
            {loadingHW ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading tasks...
              </div>
            ) : (
              <HomeworkList tasks={homework} queryKey={hwQueryKey} />
            )}
          </div>
        )}

        {tab === "appointments" && (
          <div>
            <h2 className="font-bold text-lg mb-5">Upcoming Appointments</h2>
            <AppointmentsPanel />
          </div>
        )}

        {tab === "videos" && (
          <VideosPanel clientEmail={email} currentUser={user} />
        )}
      </div>
    </div>
  );
}