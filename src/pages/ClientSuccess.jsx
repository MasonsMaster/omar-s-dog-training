import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, Heart, Users, TrendingUp } from 'lucide-react';
import SectionBadge from '@/components/shared/SectionBadge';

function TestimonialCard({ feedback }) {
  const stars = Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      className={`w-4 h-4 ${i < feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
    />
  ));

  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col h-full hover:shadow-md transition-shadow">
      {/* Star rating */}
      <div className="flex gap-1 mb-3">{stars}</div>

      {/* Testimonial text */}
      <p className="text-sm text-foreground leading-relaxed flex-1 mb-4 italic">
        "{feedback.testimonial}"
      </p>

      {/* Client info */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        {feedback.photo_url && (
          <img
            src={feedback.photo_url}
            alt={feedback.client_name || 'Client'}
            className="w-12 h-12 rounded-full object-cover"
          />
        )}
        <div className="min-w-0">
          <div className="font-bold text-sm truncate">
            {feedback.client_name || 'Anonymous'}
          </div>
          {feedback.dog_name && (
            <p className="text-xs text-muted-foreground truncate">🐾 {feedback.dog_name}</p>
          )}
        </div>
      </div>

      {/* Recommendation badge */}
      {feedback.would_recommend && (
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full w-fit">
          <Heart className="w-3 h-3" /> Recommends Omar
        </div>
      )}
    </div>
  );
}

export default function ClientSuccess() {
  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ['public-feedback'],
    queryFn: () =>
      base44.entities.SessionFeedback.filter(
        { is_public: true },
        '-created_date',
        100
      ),
  });

  // Calculate stats
  const averageRating =
    feedback.length > 0
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
      : 0;

  const recommendCount = feedback.filter(f => f.would_recommend).length;
  const recommendPercent = feedback.length > 0 ? Math.round((recommendCount / feedback.length) * 100) : 0;

  const impactCounts = {
    life_changing: feedback.filter(f => f.trainer_impact === 'life_changing').length,
    significant_improvement: feedback.filter(f => f.trainer_impact === 'significant_improvement').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero section */}
      <div className="bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 text-center">
          <SectionBadge>Success Stories</SectionBadge>
          <h1 className="font-heading text-4xl md:text-5xl mt-3 mb-4">
            Real Results from Real Clients
          </h1>
          <p className="text-background/70 text-lg max-w-2xl mx-auto">
            See how Omar's training methods have transformed dogs and their owners across the region. These aren't marketing claims—they're genuine testimonials from our community.
          </p>
        </div>
      </div>

      {/* Stats section */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <div className="font-heading text-2xl font-black">{averageRating}</div>
            <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mt-1">
              Average Rating
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="font-heading text-2xl font-black">{feedback.length}+</div>
            <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mt-1">
              Client Reviews
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <Heart className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="font-heading text-2xl font-black">{recommendPercent}%</div>
            <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mt-1">
              Recommend Omar
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="font-heading text-2xl font-black">
              {impactCounts.life_changing + impactCounts.significant_improvement}
            </div>
            <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mt-1">
              Major Transformations
            </div>
          </div>
        </div>

        {/* Testimonials grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Loading testimonials...
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No testimonials yet. Be the first to share your success story!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedback.map((item) => (
              <TestimonialCard key={item.id} feedback={item} />
            ))}
          </div>
        )}
      </div>

      {/* CTA section */}
      <div className="bg-primary/5 border-y border-primary/10 py-12 my-12">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-heading text-2xl mb-3">Ready to Transform Your Dog's Behavior?</h2>
          <p className="text-muted-foreground mb-6">
            Join hundreds of satisfied dog owners. Start your journey with a consultation today.
          </p>
          <a
            href="/apply"
            className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90 transition-opacity"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
}