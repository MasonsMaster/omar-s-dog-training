import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';
import { format, startOfMonth, endOfMonth, parseISO, subMonths } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientEmail = user.email;
    const payload = await req.json();
    const monthOffset = payload.monthOffset || 0; // 0 = current month, -1 = last month, etc.

    // Get month dates
    const referenceDate = subMonths(new Date(), Math.abs(monthOffset));
    const monthStart = startOfMonth(referenceDate);
    const monthEnd = endOfMonth(referenceDate);
    const monthLabel = format(monthStart, 'MMMM yyyy');

    // Fetch client data
    const users = await base44.entities.User.filter({ email: clientEmail });
    const clientName = users[0]?.full_name || clientEmail.split('@')[0];

    const userLevel = (await base44.entities.UserLevel.filter({ client_email: clientEmail }))[0] || {};
    const dogProfiles = await base44.entities.DogProfile.filter({ client_email: clientEmail });
    
    // Fetch sessions for this month
    const allSessions = await base44.entities.TrainingSession.filter({ client_email: clientEmail }, "-session_date", 200);
    const monthSessions = allSessions.filter(s => {
      const sDate = new Date(s.session_date);
      return sDate >= monthStart && sDate <= monthEnd;
    });

    // Fetch homework completed this month
    const allHomework = await base44.entities.HomeworkTask.filter({ client_email: clientEmail }, "-completed_date", 200);
    const monthHomework = allHomework.filter(h => {
      if (!h.completed || !h.completed_date) return false;
      const cDate = new Date(h.completed_date);
      return cDate >= monthStart && cDate <= monthEnd;
    });

    // Fetch weekly reports for this month
    const allReports = await base44.entities.WeeklyReport.filter({ client_email: clientEmail }, "-week_start", 50);
    const monthReports = allReports.filter(r => {
      const rDate = new Date(r.week_start);
      return rDate >= monthStart && rDate <= monthEnd;
    });

    // Calculate metrics
    const totalHours = monthSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60;
    const avgSessionRating = monthSessions.filter(s => s.overall_session_rating).length > 0
      ? (monthSessions.reduce((sum, s) => sum + (s.overall_session_rating || 0), 0) / monthSessions.filter(s => s.overall_session_rating).length).toFixed(1)
      : null;

    const homeworkCompleted = monthHomework.length;
    const focusAreas = {};
    monthSessions.forEach(s => {
      s.focus_areas?.forEach(area => {
        focusAreas[area] = (focusAreas[area] || 0) + 1;
      });
    });
    const topFocusAreas = Object.entries(focusAreas).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([area]) => area);

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // === COVER PAGE ===
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text('Monthly Training Report', 20, yPos);

    yPos += 15;
    doc.setFontSize(16);
    doc.setTextColor(80, 80, 80);
    doc.text(monthLabel, 20, yPos);

    yPos += 25;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);

    yPos += 15;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.text(`Hi ${clientName}! 🐾`, 20, yPos);

    yPos += 10;
    doc.setFontSize(10);
    const introText = `This is your comprehensive monthly training summary. Below you'll find your progress metrics, key achievements, top focus areas, and personalized insights from Omar.`;
    const splitIntro = doc.splitTextToSize(introText, pageWidth - 40);
    doc.text(splitIntro, 20, yPos);

    yPos += splitIntro.length * 4 + 20;

    // Key Stats
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Key Metrics', 20, yPos);
    yPos += 10;

    const metrics = [
      { label: 'Training Sessions', value: monthSessions.length },
      { label: 'Total Hours', value: totalHours.toFixed(1) },
      { label: 'Avg Session Rating', value: avgSessionRating || '—' },
      { label: 'Current Level', value: userLevel.current_level || 1 },
      { label: 'Total XP', value: (userLevel.total_xp || 0).toLocaleString() },
      { label: 'Current Streak', value: `${userLevel.current_streak || 0} days` },
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

    yPos += 70;

    // Dog Profiles
    if (dogProfiles.length > 0) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Your Dogs', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      dogProfiles.slice(0, 2).forEach(dog => {
        doc.setFont(undefined, 'bold');
        doc.text(`• ${dog.name}`, 25, yPos);
        yPos += 5;
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        const dogInfo = [dog.breed, dog.age_years ? `${dog.age_years} yrs` : null, dog.weight_lbs ? `${dog.weight_lbs} lbs` : null].filter(Boolean).join(' • ');
        doc.text(dogInfo, 30, yPos);
        yPos += 6;
      });
      yPos += 5;
    }

    // Add page break
    doc.addPage();
    yPos = 20;

    // === PAGE 2: DETAILED ANALYSIS ===
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Detailed Analysis', 20, yPos);
    yPos += 12;

    // Focus Areas
    if (topFocusAreas.length > 0) {
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Primary Focus Areas', 20, yPos);
      yPos += 7;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      topFocusAreas.forEach((area, idx) => {
        const count = focusAreas[area];
        doc.text(`${idx + 1}. ${area} (${count} session${count !== 1 ? 's' : ''})`, 25, yPos);
        yPos += 5;
      });
      yPos += 5;
    }

    // Weekly Summaries
    if (monthReports.length > 0) {
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Weekly Insights', 20, yPos);
      yPos += 7;

      doc.setFontSize(8);
      monthReports.slice(0, 4).forEach(report => {
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        const weekLabel = `Week of ${format(parseISO(report.week_start), 'MMM d')}`;
        doc.text(weekLabel, 25, yPos);
        yPos += 4;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(80, 80, 80);
        if (report.ai_summary) {
          const summaryText = doc.splitTextToSize(report.ai_summary, pageWidth - 50);
          doc.text(summaryText, 25, yPos);
          yPos += summaryText.length * 3 + 2;
        }
        yPos += 1;
      });
    }

    // Footer
    yPos = pageHeight - 30;
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont(undefined, 'normal');
    doc.text("Keep pushing toward your goals! - Omar's Dog Training™", 20, yPos);
    doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy')}`, 20, yPos + 6);

    // Return PDF as base64
    const pdfBytes = doc.output('arraybuffer');
    const pdfBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(pdfBytes)));

    return Response.json({
      success: true,
      pdfBase64,
      fileName: `Training_Report_${format(monthStart, 'MMM_yyyy')}.pdf`,
    });
  } catch (error) {
    console.error("Monthly report generation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});