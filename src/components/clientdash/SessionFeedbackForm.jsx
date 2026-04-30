import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const IMPACT_OPTIONS = [
  { value: 'life_changing', label: '🎯 Life-changing improvement' },
  { value: 'significant_improvement', label: '⭐ Significant improvement' },
  { value: 'helped_a_lot', label: '✓ Helped a lot' },
  { value: 'somewhat_helpful', label: '👍 Somewhat helpful' },
];

export default function SessionFeedbackForm({ session, clientEmail, clientName, dogName, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [testimonial, setTestimonial] = useState('');
  const [trainerImpact, setTrainerImpact] = useState('');
  const [recommend, setRecommend] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const qc = useQueryClient();

  const handleSubmit = async () => {
    if (rating === 0 || !testimonial.trim() || !trainerImpact) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.SessionFeedback.create({
        client_email: clientEmail,
        session_id: session.id,
        dog_name: dogName || 'Your Dog',
        client_name: clientName,
        rating,
        testimonial: testimonial.trim(),
        trainer_impact: trainerImpact,
        would_recommend: recommend,
        is_public: isPublic,
      });

      toast.success('Thank you for your feedback!');
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ['session-feedback', clientEmail] });
      
      setTimeout(() => {
        if (onSubmitted) onSubmitted();
      }, 1500);
    } catch (error) {
      toast.error('Failed to submit feedback');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <div>
          <h4 className="font-bold text-sm">Feedback Submitted!</h4>
          <p className="text-xs text-muted-foreground mt-1">
            {isPublic ? 'Your testimonial will appear on our client success page.' : 'Thank you for helping us improve!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <div>
        <h4 className="font-bold text-base mb-1">How was your session?</h4>
        <p className="text-xs text-muted-foreground">Your feedback helps us improve and inspire other dog owners</p>
      </div>

      {/* Star rating */}
      <div className="space-y-2">
        <label className="text-xs font-semibold">Session Rating *</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoverRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs font-semibold text-primary">
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]} experience
          </p>
        )}
      </div>

      {/* Trainer impact */}
      <div className="space-y-2">
        <label className="text-xs font-semibold">Omar's Impact *</label>
        <div className="space-y-1.5">
          {IMPACT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTrainerImpact(opt.value)}
              className={`w-full text-left px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                trainerImpact === opt.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div className="space-y-2">
        <label className="text-xs font-semibold">Your Feedback *</label>
        <Textarea
          placeholder="Share your experience with Omar and your dog's progress..."
          value={testimonial}
          onChange={(e) => setTestimonial(e.target.value)}
          maxLength={500}
          className="min-h-[100px] resize-none"
        />
        <p className="text-[10px] text-muted-foreground">
          {testimonial.length}/500 characters
        </p>
      </div>

      {/* Recommend */}
      <div className="space-y-2">
        <label className="text-xs font-semibold">Would you recommend Omar's training?</label>
        <div className="flex gap-2">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              onClick={() => setRecommend(val)}
              className={`flex-1 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                recommend === val
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              {val ? '👍 Yes' : '👎 No'}
            </button>
          ))}
        </div>
      </div>

      {/* Public toggle */}
      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="w-4 h-4 rounded cursor-pointer"
          id="public-consent"
        />
        <label htmlFor="public-consent" className="text-xs font-medium text-primary cursor-pointer flex-1">
          Share this testimonial on our Client Success page
        </label>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="w-full rounded-full font-bold gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Submit Feedback
          </>
        )}
      </Button>
    </div>
  );
}