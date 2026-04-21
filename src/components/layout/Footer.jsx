import { Link } from "react-router-dom";

const SOCIAL_LINKS = [
  { label: "IG", href: "https://instagram.com/omarsdogtraining" },
  { label: "TT", href: "https://tiktok.com/@omarsdogtraining" },
  { label: "YT", href: "https://youtube.com/omarsdogtraining" },
  { label: "FB", href: "https://facebook.com/omarsdogtraining" },
];

export default function Footer() {
  return (
    <footer className="bg-foreground text-background/60 mt-20">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="text-background font-heading text-xl mb-3">Omar's Dog Training™</div>
            <p className="text-sm leading-relaxed mb-4">
              Better Dogs Start With Better Leaders™<br />
              Space Coast, Florida
            </p>
            <p className="text-sm">📞 (321) 830-6272</p>
            <p className="text-sm">📧 info@omarsdogtraining.com</p>
            <div className="flex gap-2 mt-4">
              {SOCIAL_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-md bg-background/10 border border-background/10 flex items-center justify-center text-xs font-bold hover:bg-background/20 transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="text-background text-[11px] font-bold tracking-[0.2em] mb-4">SERVICES</div>
            <div className="space-y-2 text-sm">
              <Link to="/booking" className="block hover:text-background transition-colors">Saturday Training</Link>
              <Link to="/services" className="block hover:text-background transition-colors">Behavioral Program</Link>
              <Link to="/services" className="block hover:text-background transition-colors">Private 1-on-1</Link>
              <Link to="/services" className="block hover:text-background transition-colors">PoopPatrol™</Link>
              <Link to="/services" className="block hover:text-background transition-colors">Walk & Talks™</Link>
              <Link to="/shop" className="block hover:text-background transition-colors">Slip Lead Store</Link>
            </div>
          </div>

          {/* More */}
          <div>
            <div className="text-background text-[11px] font-bold tracking-[0.2em] mb-4">MORE</div>
            <div className="space-y-2 text-sm">
              <Link to="/mason" className="block hover:text-background transition-colors">Mason™ AI</Link>
              <Link to="/services" className="block hover:text-background transition-colors">Memberships</Link>
              <Link to="/services" className="block hover:text-background transition-colors">Virtual Training</Link>
              <Link to="/apply" className="block hover:text-background transition-colors">Apply Now</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <div className="text-background text-[11px] font-bold tracking-[0.2em] mb-4">LEGAL</div>
            <div className="space-y-2 text-sm">
              <Link to="/legal/terms" className="block hover:text-background transition-colors">Terms of Service</Link>
              <Link to="/legal/privacy" className="block hover:text-background transition-colors">Privacy Policy</Link>
              <Link to="/legal/cookies" className="block hover:text-background transition-colors">Cookie Policy</Link>
              <Link to="/legal/disclaimer" className="block hover:text-background transition-colors">Disclaimer</Link>
              <Link to="/legal/dmca" className="block hover:text-background transition-colors">DMCA</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 pt-6 text-center text-[10px] leading-relaxed max-w-4xl mx-auto">
          © 2026 Omar's Dog Training. All Rights Reserved. Omar's Dog Training™, Elite Handler Academy™, Better Dogs Start With Better Leaders™, The Handler Method™, Mason™, PoopPatrol™, Walk & Talks™, ODT™ are trademarks. Unauthorized reproduction prohibited. 🛡️ Fully insured business. Mason™ AI is informational only — not veterinary advice.
        </div>
      </div>
    </footer>
  );
}