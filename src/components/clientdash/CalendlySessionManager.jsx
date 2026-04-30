import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, X, RefreshCw, Plus, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const CONNECTOR_ID = '69f0c9bf39998d128b643a8e';

export default function CalendlySessionManager({ clientEmail, user }) {
  const [connected, setConnected] = useState(false);
  const [slots, setSlots] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const qc = useQueryClient();

  // Fetch upcoming sessions
  const { data: sessions = [], isLoading: loadingSessions, refetch: refetchSessions } = useQuery({
    queryKey: ['calendly-sessions', clientEmail],
    queryFn: async () => {
      try {
        const res = await base44.functions.invoke('getCalendlyEvents', {});
        setConnected(true);
        return res.data?.events || [];
      } catch {
        setConnected(false);
        return [];
      }
    },
    enabled: !!clientEmail,
  });

  // Fetch available slots
  const handleLoadSlots = async () => {
    try {
      const res = await base44.functions.invoke('getCalendlySlots', {});
      setSlots(res.data?.slots || []);
      setShowBooking(true);
    } catch {
      toast.error('Failed to load available slots');
    }
  };

  const handleBook = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    setBooking(true);
    try {
      const res = await base44.functions.invoke('bookCalendlySession', {
        eventTypeId: selectedSlot.eventTypeId,
        startTime: selectedSlot.startTime,
        clientEmail,
      });

      if (res.data.success) {
        toast.success('Session booked! Check your email for confirmation.');
        setShowBooking(false);
        setSelectedSlot(null);
        setSlots([]);
        refetchSessions();
        qc.invalidateQueries({ queryKey: ['client-schedules', clientEmail] });
      }
    } catch (error) {
      toast.error('Booking failed: ' + error.message);
    } finally {
      setBooking(false);
    }
  };

  const handleReschedule = async (eventId, newStartTime) => {
    try {
      const res = await base44.functions.invoke('rescheduleCalendlySession', {
        eventId,
        newStartTime,
        clientEmail,
      });

      if (res.data.success) {
        toast.success('Session rescheduled!');
        refetchSessions();
        qc.invalidateQueries({ queryKey: ['client-schedules', clientEmail] });
      }
    } catch (error) {
      toast.error('Reschedule failed: ' + error.message);
    }
  };

  const handleCancel = async (eventId) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;

    try {
      const res = await base44.functions.invoke('cancelCalendlySession', {
        eventId,
        clientEmail,
      });

      if (res.data.success) {
        toast.success('Session cancelled');
        refetchSessions();
        qc.invalidateQueries({ queryKey: ['client-schedules', clientEmail] });
      }
    } catch (error) {
      toast.error('Cancellation failed: ' + error.message);
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">
          Connect your Calendly account to book sessions directly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Book button */}
      <div>
        <Button
          onClick={handleLoadSlots}
          disabled={showBooking}
          className="w-full rounded-full font-bold gap-2"
        >
          <Plus className="w-4 h-4" /> Book a Session
        </Button>
      </div>

      {/* Booking UI */}
      {showBooking && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold">Select a Time Slot</h4>
            <button
              onClick={() => setShowBooking(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {slots.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No available slots</p>
            ) : (
              slots.map((slot) => (
                <button
                  key={slot.startTime}
                  onClick={() => setSelectedSlot(slot)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    selectedSlot?.startTime === slot.startTime
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="font-semibold text-sm">
                    {format(parseISO(slot.startTime), 'EEE, MMM d')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(slot.startTime), 'h:mm a')}
                  </div>
                </button>
              ))
            )}
          </div>

          <Button
            onClick={handleBook}
            disabled={!selectedSlot || booking}
            className="w-full rounded-full font-bold"
          >
            {booking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </Button>
        </div>
      )}

      {/* Upcoming sessions */}
      <div>
        <h4 className="font-bold text-sm mb-3">Upcoming Sessions</h4>
        {loadingSessions ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No upcoming sessions</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div key={session.uri} className="bg-card border border-border rounded-xl p-3 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{session.name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(parseISO(session.start_time), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {format(parseISO(session.start_time), 'h:mm a')} – {format(parseISO(session.end_time), 'h:mm a')}
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(session.id || session.uri.split('/').pop())}
                  className="text-destructive hover:bg-destructive/10 rounded-lg p-2 transition-colors"
                  title="Cancel session"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}