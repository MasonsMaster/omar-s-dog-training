import BookingSection from "@/components/home/BookingSection";
import SectionBadge from "@/components/shared/SectionBadge";
import FAQSection from "@/components/home/FAQSection";

export default function Booking() {
  return (
    <div>
      <section className="bg-foreground text-background py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <SectionBadge>Enroll Now</SectionBadge>
          <h1 className="font-heading text-4xl md:text-5xl mb-4">
            Saturday <span className="italic">Classes</span>
          </h1>
          <p className="text-background/60 max-w-lg mx-auto">
            Animal Wellness World, Merritt Island. Max 6 dogs per class. Handler-focused training.
          </p>
        </div>
      </section>
      <div className="py-8">
        <BookingSection />
      </div>
      <FAQSection />
    </div>
  );
}