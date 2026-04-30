import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SERVICES = [
  { id: "private", label: "Private In-Home", price: "$250/session", duration: "60 min" },
  { id: "emergency", label: "Emergency Session", price: "$500", duration: "60 min" },
];

export default function CalendlyBooking({ clientEmail, user }) {
  const [selectedService, setSelectedService] = useState("private");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getCalendlySlots", {
        service: selectedService,
        days_ahead: 30,
      });
      setSlots(res.data?.slots || []);
      setSelectedSlot(null);
      setBooked(false);
    } catch (error) {
      toast.error("Failed to load available slots");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedService]);

  const handleBook = async () => {
    if (!selectedSlot || !user?.email) {
      toast.error("Please select a time slot");
      return;
    }

    setBooking(true);
    try {
      // Create an appointment record
      await base44.integrations.Core.SendEmail({
        to: "info@omarsdogtraining.com",
        subject: `New Calendly Booking: ${user.full_name} - ${SERVICES.find(s => s.id === selectedService)?.label}`,
        body: `Client: ${user.full_name}\nEmail: ${user.email}\nService: ${SERVICES.find(s => s.id === selectedService)?.label}\nSlot: ${selectedSlot.start_time}\n\nRedirect to Calendly to confirm the booking.`,
      });

      // Redirect to Calendly booking link
      const calendlyUrl = selectedSlot.booking_url || `https://calendly.com/omarsdogtraining/${selectedService}`;
      window.open(calendlyUrl, "_blank");

      toast.success("Redirecting to Calendly to complete your booking!");
      setBooked(true);
      setSelectedSlot(null);
    } catch (error) {
      toast.error("Failed to complete booking");
      console.error(error);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Service Selection */}
      <div>
        <h3 className="font-bold text-sm mb-3">Select Service</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SERVICES.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                selectedService === service.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="font-semibold text-sm">{service.label}</div>
              <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                <span>{service.price}</span>
                <span>•</span>
                <span>{service.duration}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Available Slots */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Available Times</h3>
          <button
            onClick={fetchSlots}
            disabled={loading}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading available slots...
          </div>
        ) : slots.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <div className="font-semibold text-sm mb-1">No slots available</div>
            <p className="text-xs text-muted-foreground">
              Please contact Omar directly at (321) 830-6272 to schedule.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.map((slot, idx) => {
              const slotDate = new Date(slot.start_time);
              const day = slotDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              const time = slotDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-3 rounded-lg border-2 text-center transition-all text-sm ${
                    selectedSlot === slot
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="font-semibold">{day}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" /> {time}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Button */}
      {slots.length > 0 && (
        <div className="flex gap-3">
          <Button
            onClick={handleBook}
            disabled={!selectedSlot || booking}
            className="flex-1 rounded-full font-bold gap-2"
          >
            {booking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : booked ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Booking Confirmed
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" /> Book This Time
              </>
            )}
          </Button>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-muted rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
        <strong>Can't find a good time?</strong> Call Omar directly at{" "}
        <span className="text-foreground font-semibold">(321) 830-6272</span> or email{" "}
        <span className="text-foreground font-semibold">info@omarsdogtraining.com</span>
      </div>
    </div>
  );
}