import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Download, Calendar, Award } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function GraduationCertificates({ clientEmail }) {
  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['graduation-certificates', clientEmail],
    queryFn: () =>
      base44.entities.GraduationCertificate.filter(
        { client_email: clientEmail },
        '-issued_date',
        50
      ),
    enabled: !!clientEmail,
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-8">Loading certificates...</div>;
  }

  if (certificates.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
        <Award className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <div className="font-bold text-sm mb-1">No Graduation Certificates Yet</div>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Complete {6} training sessions with an average rating of {7.0}/10 to earn your graduation certificate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {certificates.map((cert) => (
        <div
          key={cert.id}
          className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Training Graduation Certificate</h3>
              </div>

              <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                <p>
                  <span className="font-semibold text-foreground">🐾 {cert.dog_name}</span>
                </p>
                <div className="flex gap-6 text-xs">
                  <div>
                    <span className="text-muted-foreground">Sessions Completed:</span>{' '}
                    <span className="font-bold text-foreground">{cert.sessions_completed}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Average Rating:</span>{' '}
                    <span className="font-bold text-foreground">{cert.average_rating.toFixed(1)}/10</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  Issued {format(parseISO(cert.issued_date), 'MMM d, yyyy')}
                </div>
              </div>

              <Button
                onClick={() => window.open(cert.certificate_url, '_blank')}
                className="gap-2 rounded-full font-bold"
                size="sm"
              >
                <Download className="w-4 h-4" /> Download Certificate
              </Button>
            </div>

            <div className="text-5xl">🏆</div>
          </div>
        </div>
      ))}
    </div>
  );
}