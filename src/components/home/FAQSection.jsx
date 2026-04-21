import { FAQS } from "@/lib/constants";
import SectionBadge from "../shared/SectionBadge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQSection() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <SectionBadge variant="secondary">FAQ</SectionBadge>
        <h2 className="font-heading text-3xl md:text-4xl">
          Common <span className="italic text-secondary">Questions</span>
        </h2>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {FAQS.map(([question, answer], i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border border-border rounded-xl px-5 bg-card data-[state=open]:shadow-sm"
          >
            <AccordionTrigger className="text-left font-semibold text-sm md:text-base py-4 hover:no-underline">
              {question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
              {answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}