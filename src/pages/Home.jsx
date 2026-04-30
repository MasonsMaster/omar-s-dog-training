import Hero from "@/components/home/Hero";
import Guarantee from "@/components/home/Guarantee";
import ServicesSection from "@/components/home/ServicesSection";
import MembershipsSection from "@/components/home/MembershipsSection";
import Testimonials from "@/components/home/Testimonials.jsx";
import FAQSection from "@/components/home/FAQSection";
import ServiceArea from "@/components/home/ServiceArea";
import BookingSection from "@/components/home/BookingSection";
import CalendlyScheduler from "@/components/home/CalendlyScheduler";

export default function Home() {
  return (
    <div>
      <Hero />
      <Guarantee />
      <ServicesSection />
      <BookingSection />
      <CalendlyScheduler />
      <MembershipsSection />
      <Testimonials />
      <FAQSection />
      <ServiceArea />
    </div>
  );
}