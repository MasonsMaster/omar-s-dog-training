import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';
import { format, startOfWeek, endOfWeek, subDays } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all active training schedules
    const schedules = await base44.asServiceRole.entities.TrainingSchedule.filter({ status: "active" });
    console.log(`Processing ${schedules.length} active training schedules`);

    if (schedules.length === 0) {
      return Response.json({ message: "No active schedules found" });
    }

    // Get unique client emails
    const clientEmails = [...new Set(schedules.map(s => s.client_email))];
    const results = [];

    for (const clientEmail of clientEmails) {
      try {
        // Get client data
        const users = await base44.asServiceRole.entities.User.filter({ email: clientEmail });
        const clientName = users[0]?.full_name || clientEmail.split('@')[0];

        // Get user level
        const levels = await base44.asServiceRole.entities.UserLevel.filter({ client_email: clientEmail });
        const userLevel = levels[0] || { current_level: 1, total_xp: 0 };

        // Get this week's sessions (Sunday to Saturday)
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

        const allSessions = await base44.asServiceRole.entities.TrainingSession.filter({ client_email: clientEmail }, "-session_date", 200);
        const weekSessions = allSessions.filter(s => {
          const sessionDate = new Date(s.session_date);
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        });

        // Calculate metrics
        const totalHours = weekSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60;
        const avgRating = weekSessions.filter(s => s.overall_session_rating).length > 0
          ? (weekSessions.reduce((sum, s) => sum + (s.overall_session_rating || 0), 0) / weekSessions.filter(s => s.overall_session_rating).length).toFixed(1)
          : null;

        // Get focus areas
        const focusAreas = {};
        weekSessions.forEach(s => {
          s.focus_areas?.forEach(area => {
            focusAreas[area] = (focusAreas[area] || 0) + 1;
          });
        });
        const topFocusAreas = Object.entries(focusAreas)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([area]) => area);

        // Get dog names for this client
        const dogProfiles = await base44.asServiceRole.entities.DogProfile.filter({ client_email: clientEmail });
        const dogName = dogProfiles[0]?.name || "Your Dog";

        // Generate personalized note based on ratings
        let personalizedNote = "";
        if (weekSessions.length === 0) {
          personalizedNote = `No training sessions this week. Keep up the momentum and book your next session!`;
        } else if (avgRating >= 9) {
          personalizedNote = `Excellent work this week! Your dog is showing amazing progress. ${dogName} is responding well to the training and you're both doing a fantastic job together.`;
        } else if (avgRating >= 7) {
          personalizedNote = `Great effort this week! ${dogName} is making solid progress. Keep focusing on the fundamentals and consistency will lead to even better results.`;
        } else if (avgRating >= 5) {
          personalizedNote = `Good start! ${dogName} is learning. Focus on the core behaviors we discussed and practice daily. Remember, consistency is key to success.`;
        } else {
          personalizedNote = `Keep pushing! Every session is a learning opportunity for both you and ${dogName}. Let's work together to improve those focus areas.`;
        }

        // Generate PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 20;

        // Header
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('Weekly Training Summary', 20, yPos);
        
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(`Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`, 20, yPos);
        
        yPos += 15;
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPos, pageWidth - 20, yPos);

        // Client info
        yPos += 10;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`Hi ${clientName}!`, 20, yPos);
        
        yPos += 8;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const splitText = doc.splitTextToSize(personalizedNote, pageWidth - 40);
        doc.text(splitText, 20, yPos);
        yPos += splitText.length * 5 + 10;

        // Metrics section
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Your Progress This Week', 20, yPos);
        yPos += 10;

        // Metric boxes
        const metrics = [
          { label: 'Training Level', value: userLevel.current_level },
          { label: 'Hours Trained', value: totalHours.toFixed(1) },
          { label: 'Sessions', value: weekSessions.length },
          { label: 'Avg Rating', value: avgRating || '—' },
        ];

        doc.setFontSize(10);
        metrics.forEach((metric, idx) => {
          const x = 20 + (idx % 2) * 85;
          const y = yPos + Math.floor(idx / 2) * 20;

          doc.setDrawColor(220, 220, 220);
          doc.rect(x, y - 8, 75, 18);

          doc.setFont(undefined, 'normal');
          doc.setTextColor(120, 120, 120);
          doc.text(metric.label, x + 5, y - 2);

          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(String(metric.value), x + 5, y + 6);
        });

        yPos += 50;

        // Focus areas
        if (topFocusAreas.length > 0) {
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text('Key Focus Areas', 20, yPos);
          yPos += 8;

          doc.setFontSize(9);
          doc.setFont(undefined, 'normal');
          topFocusAreas.forEach((area, idx) => {
            doc.text(`• ${area}`, 25, yPos + idx * 6);
          });
          yPos += topFocusAreas.length * 6 + 10;
        }

        // Footer
        yPos = pageHeight - 30;
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.setFont(undefined, 'normal');
        doc.text("Keep up the great work! - Omar's Dog Training™", 20, yPos);
        doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy')}`, 20, yPos + 6);

        // Convert to base64
        const pdfBytes = doc.output('arraybuffer');
        const pdfBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(pdfBytes)));

        // Send email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: clientEmail,
          subject: `Your Weekly Training Summary - Week of ${format(weekStart, 'MMM d')}`,
          body: `Hi ${clientName},\n\nPlease see attached your weekly training summary.\n\nBest regards,\nOmar's Dog Training™`,
          from_name: "Omar's Dog Training",
        });

        results.push({ clientEmail, success: true, sessions: weekSessions.length, hours: totalHours.toFixed(1) });
        console.log(`✓ Sent summary to ${clientEmail} (${weekSessions.length} sessions, ${totalHours.toFixed(1)} hours)`);
      } catch (clientError) {
        console.error(`✗ Failed to process ${clientEmail}:`, clientError.message);
        results.push({ clientEmail, success: false, error: clientError.message });
      }
    }

    return Response.json({
      message: `Processed ${clientEmails.length} clients`,
      results,
      successCount: results.filter(r => r.success).length,
    });
  } catch (error) {
    console.error("Weekly summary error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});