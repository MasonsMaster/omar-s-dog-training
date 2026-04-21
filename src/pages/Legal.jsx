import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const LEGAL_CONTENT = {
  terms: {
    title: "Terms of Service",
    content: "By using omarsdogtraining.com, you agree to these Terms. Omar's Dog Training™ provides training, PoopPatrol™, Walk & Talks™, coaching, product sales, and Mason™ AI services. Payments processed by Stripe — we never store card numbers. Refund within 48 hours if no sessions attended. Guarantee: no improvement in 3 sessions = extra session free. Dog training involves inherent risks. Mason™ AI is informational — not veterinary advice. All content is trademarked and copyrighted. Florida/Brevard County jurisdiction. Contact: info@omarsdogtraining.com · (321) 830-6272",
  },
  privacy: {
    title: "Privacy Policy",
    content: "We collect: name, email, phone, dog info (from forms), payment info (processed by Stripe — we don't store cards), usage data (Google Analytics, with consent), cookies (with consent), push notification status (OneSignal). We use data to: provide services, process payments, communicate, send notifications (with consent), improve our site. We share with: Stripe (payments), OneSignal (push), Google Analytics (analytics), AWW (vet checkups). We NEVER sell your data. Your rights: access, delete, opt-out anytime. CCPA compliant. Children under 13: we don't knowingly collect. Contact: info@omarsdogtraining.com",
  },
  cookies: {
    title: "Cookie Policy",
    content: "Essential cookies (always active): session, cart, consent preferences. Analytics cookies (requires consent): Google Analytics — tracks visits and traffic sources. Marketing cookies (requires consent): OneSignal (push notifications), Facebook Pixel (if added). Manage cookies via our consent banner or your browser settings. Contact: info@omarsdogtraining.com",
  },
  disclaimer: {
    title: "Disclaimer",
    content: "Training results vary. Our 98% success rate is client-reported. Mason™ AI is not a substitute for veterinary advice. Dog training involves inherent risks including bites and scratches. Omar's Dog Training™ is fully insured with general liability coverage. We are not veterinarians — consult Dr. Kristy Pilkerton at AWW or your vet for medical concerns. By attending sessions, you consent to photo/video use unless you notify us in writing. Contact: info@omarsdogtraining.com · (321) 830-6272",
  },
  dmca: {
    title: "DMCA Notice",
    content: "Omar's Dog Training™ respects intellectual property. To report infringement, send a written notice to info@omarsdogtraining.com with: identification of the copyrighted work, location of infringing material, your contact info, good faith statement, perjury statement, and signature. Phone: (321) 830-6272",
  },
};

export default function Legal() {
  const { page } = useParams();
  const content = LEGAL_CONTENT[page];

  if (!content) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="font-heading text-2xl mb-4">Page not found</h1>
        <Link to="/"><Button>Back to Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
      <Link to="/">
        <Button variant="outline" size="sm" className="gap-1 mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Button>
      </Link>

      <h1 className="font-heading text-3xl md:text-4xl mb-2">{content.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: April 2026</p>

      <div className="text-sm leading-[2] text-muted-foreground">
        {content.content}
      </div>
    </div>
  );
}