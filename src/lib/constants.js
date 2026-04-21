export const SERVICES = [
  { id: "sat", name: "Saturday Basic Training", price: 399, unit: "/program", cat: "training", tag: "Enrolling!", desc: "4-session group at AWW. Only 6 families per class.", checks: ["4 sessions · Saturdays", "Max 6 dogs", "Handler coaching", "FREE slip lead"], feat: true },
  { id: "beh", name: "Behavioral Transformation", price: 3500, unit: "/program", cat: "training", desc: "8-week intensive at AWW. Vet checkup with Dr. Kristy included.", checks: ["8 sessions (90 min)", "Vet checkup included", "Life coaching integration"] },
  { id: "priv", name: "Private 1-on-1", price: 250, unit: "/session", cat: "training", desc: "Personalized handler sessions at your home.", checks: ["Custom protocol", "Leadership coaching", "Mason AI support"] },
  { id: "pp1", name: "PoopPatrol™ Weekly", price: 60, unit: "/month", cat: "pet", tag: "New!", desc: "We scoop your yard weekly. All Brevard County.", checks: ["$14/visit ($60/mo)", "Extra dog: +$2", "One-time cleanup: $49"] },
  { id: "pp2", name: "PoopPatrol™ 2x/Week", price: 95, unit: "/month", cat: "pet", desc: "Twice weekly yard scooping. Maximum cleanliness.", checks: ["$11/visit ($95/mo)", "Extra dog: +$2", "Serving all Brevard"] },
  { id: "wt", name: "Walk & Talks™", price: 13, unit: "/walk", cat: "pet", tag: "New!", desc: "Professional walking. GPS, photos, report every walk.", checks: ["20 min $13 · 30 min $18", "60 min $28", "Monthly plans from $199"] },
  { id: "em", name: "Emergency Consult", price: 500, unit: "/consult", cat: "training", desc: "Same-day intervention for bites or crisis.", checks: ["Priority scheduling", "Safety protocol", "48hr follow-up"] },
];

export const MEMBERSHIPS = [
  { name: "Pack Member", price: 97, checks: ["24/7 Mason AI", "Monthly Q&A", "Video library", "10% off everything"] },
  { name: "Alpha Leader", price: 497, feat: true, tag: "Best Value", checks: ["2 private sessions/mo", "Life coaching session", "Direct line to Omar", "20% off everything"] },
  { name: "Elite Circle", price: 1497, checks: ["Unlimited sessions", "Unlimited coaching", "Emergency access", "VIP retreats"] },
];

export const VIRTUAL = [
  { name: "Quick Call", price: 75, mins: "30 min/mo" },
  { name: "Handler Hotline", price: 125, mins: "60 min/mo", feat: true, tag: "Popular" },
  { name: "Unlimited Command", price: 199, mins: "120 min/mo" },
];

export const BLUEPRINT = [
  { s: "Saturday Training", c: 10, p: 399, r: 3990 },
  { s: "Behavioral Transformation", c: 2, p: 3500, r: 7000 },
  { s: "Private 1-on-1", c: 20, p: 250, r: 5000 },
  { s: "Emergency Consults", c: 3, p: 500, r: 1500 },
  { s: "PoopPatrol™ Subs", c: 40, p: 60, r: 2400 },
  { s: "Walk & Talks™ Subs", c: 20, p: 199, r: 3980 },
  { s: "Virtual Quick Call", c: 30, p: 75, r: 2250 },
  { s: "Virtual Hotline", c: 25, p: 125, r: 3125 },
  { s: "Virtual Unlimited", c: 10, p: 199, r: 1990 },
  { s: "Pack Member", c: 80, p: 97, r: 7760 },
  { s: "Alpha Leader", c: 15, p: 497, r: 7455 },
  { s: "Elite Circle", c: 3, p: 1497, r: 4491 },
  { s: "Life Coaching", c: 10, p: 200, r: 2000 },
  { s: "Slip Lead Sales", c: 60, p: 24.99, r: 1499 },
];

export const FAQS = [
  ["What makes Omar's training different?", "We train the HUMAN, not just the dog. Omar is a certified master trainer, behavior specialist, AND life coach. His Handler Method™ develops YOUR leadership — because every behavioral issue reflects the human-canine dynamic."],
  ["Is a slip lead safe?", "Yes, when used correctly. Our 3ft ODT slip lead communicates through gentle pressure, not harsh correction. It sits high behind the ears. We include a free how-to video and teach proper technique in every program."],
  ["How much does training cost?", "Saturday Group: $399 (4 sessions). Behavioral Transformation: $3,500 (8 weeks + vet checkup). Private 1-on-1: $250/session. PoopPatrol from $60/mo. Walk & Talks from $13/walk. Payment plans available."],
  ["What is PoopPatrol™?", "Our subscription yard-scooping service. We come weekly ($60/mo) or 2x/week ($95/mo), remove all waste, and leave your yard clean. Extra dogs +$2/visit. Serving all Brevard County."],
  ["Do you offer military discounts?", "Yes! Active military, veterans, first responders, and teachers get 15% off all services. Brevard County is home to Patrick Space Force Base — we're honored to serve those who serve."],
  ["Where are Saturday classes?", "Animal Wellness World (AWW) on Merritt Island — Dr. Kristy Pilkerton's veterinary facility. Safe, professional, clean. 10 AM and 12 PM, max 6 dogs per class."],
  ["What's the refund policy?", "Full refund within 48 hours if no sessions attended. Plus our guarantee: no improvement in 3 sessions = extra session FREE. Slip leads returnable within 30 days unused."],
  ["Can I buy just the slip lead?", "Absolutely! $24.99, ships anywhere. Every purchase includes a free video tutorial. 2 for $39.99 (save $10). FREE with any training sign-up ($399+)."],
];

export const AREAS = ["Merritt Island", "Cocoa Beach", "Cape Canaveral", "Melbourne", "Viera", "Palm Bay", "Titusville", "Satellite Beach", "Rockledge", "Indialantic"];

export const PROMO_CODES = [
  { code: "MASON10", desc: "10% off first service" },
  { code: "PACK50", desc: "$50 off Saturday" },
  { code: "SOCIAL15", desc: "15% off (follow+tag)" },
  { code: "SLIPLEAD", desc: "FREE lead w/ training" },
  { code: "BUNDLE10", desc: "$10/mo off bundles" },
  { code: "REFER50", desc: "$50 credit/referral" },
];