import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import jsPDF from 'npm:jspdf@4.0.0';
import { subDays, format, parseISO } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all active training schedules to find unique clients
    const allSchedules = await base44.asServiceRole.entities.TrainingSchedule.list('-created_date', 500);
    const uniqueEmails = [...new Set(allSchedules.filter(s => s.client_email && s.status === 'active').map(s => s.client_email))];

    const weekAgo = subDays(new Date(), 7);

    // Generate and send PDFs for each client
    const results = [];
    for (const clientEmail of uniqueEmails) {
      try {
        // Fetch client data
        const [schedules, homework, userLevel, behaviorLogs] = await Promise.all([
          base44.asServiceRole.entities.TrainingSchedule.filter({ client_email: clientEmail }),
          base44.asServiceRole.entities.HomeworkTask.filter({ client_email: clientEmail }),
          base44.asServiceRole.entities.UserLevel.filter({ client_email: clientEmail }),
          base44.asServiceRole.entities.BehaviorLog.filter({ client_email: clientEmail }, '-log_date', 50),
        ]);

        // Filter for this week's activities
        const weeklyHomework = homework.filter(h => {
          const dueDate = h.due_date ? new Date(h.due_date) : null;
          return dueDate && dueDate >= weekAgo;
        });

        const weeklyLogs = behaviorLogs.filter(l => {
          const logDate = l.log_date ? new Date(l.log_date) : null;
          return logDate && logDate >= weekAgo;
        });

        const completedSessions = schedules.reduce((sum, s) => sum + (s.sessions_completed || 0), 0);
        const totalSessions = schedules.reduce((sum, s) => sum + (s.sessions_total || 0), 0);
        const userLevelData = userLevel[0] || {};

        // Generate PDF
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        // Header
        pdf.setFontSize(24);
        pdf.setFont(undefined, 'bold');
        pdf.text('Weekly Training Summary', pageWidth / 2, 20, { align: 'center' });

        // Week dates
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const weekStart = format(weekAgo, 'MMM d, yyyy');
        const weekEnd = format(new Date(), 'MMM d, yyyy');
        pdf.text(`${weekStart} - ${weekEnd}`, pageWidth / 2, 28, { align: 'center' });

        // Client info
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text(`Client: ${clientEmail}`, 20, 40);

        // Level & XP section
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text('🎮 Level & Experience', 20, 52);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Current Level: ${userLevelData.current_level || 1}`, 25, 60);
        pdf.text(`Total XP: ${userLevelData.total_xp || 0}`, 25, 67);
        pdf.text(`Badges Earned: ${userLevelData.total_badges_earned || 0}`, 25, 74);

        // Sessions section
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text('📅 Training Sessions', 20, 85);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Sessions Completed: ${completedSessions} / ${totalSessions}`, 25, 93);
        const progress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
        pdf.text(`Overall Progress: ${progress}%`, 25, 100);

        // Homework section
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text('📝 Homework This Week', 20, 111);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const completedHW = weeklyHomework.filter(h => h.completed).length;
        pdf.text(`Completed: ${completedHW} / ${weeklyHomework.length}`, 25, 119);

        if (weeklyHomework.length > 0) {
          let hwY = 128;
          weeklyHomework.slice(0, 5).forEach(hw => {
            const status = hw.completed ? '✓' : '○';
            const text = `${status} ${hw.title.substring(0, 40)}`;
            pdf.text(text, 30, hwY);
            hwY += 6;
          });
          if (weeklyHomework.length > 5) {
            pdf.text(`... and ${weeklyHomework.length - 5} more`, 30, hwY);
          }
        }

        // Behavior logs summary
        if (weeklyLogs.length > 0) {
          pdf.setFontSize(11);
          pdf.setFont(undefined, 'bold');
          pdf.text('📊 Behavior Logs', 20, 170);
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'normal');
          pdf.text(`Logs submitted: ${weeklyLogs.length}`, 25, 178);
          
          const moodCounts = {};
          weeklyLogs.forEach(log => {
            moodCounts[log.overall_mood] = (moodCounts[log.overall_mood] || 0) + 1;
          });
          
          let moodY = 186;
          Object.entries(moodCounts).forEach(([mood, count]) => {
            pdf.text(`${mood}: ${count} days`, 30, moodY);
            moodY += 6;
          });
        }

        // Footer
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}`, 20, pageHeight - 15);
        pdf.text("Omar's Dog Training™ | www.omarsdogtraining.com", pageWidth / 2, pageHeight - 15, { align: 'center' });

        // Convert to base64
        const pdfBytes = pdf.output('arraybuffer');
        const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

        // Call sendWeeklyReportEmail function
        const emailResult = await base44.asServiceRole.functions.invoke('sendWeeklyReportEmail', {
          client_email: clientEmail,
          pdf_base64: pdfBase64,
          week_start: weekStart,
          week_end: weekEnd,
          level: userLevelData.current_level || 1,
          total_xp: userLevelData.total_xp || 0,
          badges: userLevelData.total_badges_earned || 0,
        });

        results.push({ client: clientEmail, status: 'sent', email_result: emailResult });
      } catch (clientError) {
        console.error(`Error processing client ${clientEmail}:`, clientError);
        results.push({ client: clientEmail, status: 'failed', error: clientError.message });
      }
    }

    return Response.json({
      success: true,
      total_clients: uniqueEmails.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating weekly training summary PDFs:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});