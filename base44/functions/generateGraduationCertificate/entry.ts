import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import jsPDF from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { clientEmail, clientName, dogName, sessionsCompleted, averageRating } = await req.json();

    if (!clientEmail || !dogName || !sessionsCompleted || averageRating === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if certificate already issued
    const existing = await base44.asServiceRole.entities.GraduationCertificate.filter({
      client_email: clientEmail,
      dog_name: dogName,
    });

    if (existing.length > 0) {
      console.log(`Certificate already issued for ${clientEmail} and ${dogName}`);
      return Response.json({ 
        success: false, 
        message: 'Certificate already issued for this client and dog' 
      });
    }

    // Generate PDF certificate
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Background
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, width, height, 'F');

    // Decorative border
    doc.setLineWidth(3);
    doc.setDrawColor(220, 38, 38); // Red
    doc.rect(10, 10, width - 20, height - 20);

    // Inner decorative border
    doc.setLineWidth(1);
    doc.setDrawColor(220, 38, 38);
    doc.rect(12, 12, width - 24, height - 24);

    // Paw prints decoration (top corners)
    doc.setFont('Arial', 'bold');
    doc.setTextColor(200, 0, 0);
    doc.setFontSize(20);
    doc.text('🐾', 25, 25);
    doc.text('🐾', width - 30, 25);

    // Title
    doc.setFont('Arial', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(42);
    doc.text('TRAINING GRADUATION', width / 2, 50, { align: 'center' });

    // Subtitle
    doc.setFont('Arial', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(14);
    doc.text("Certificate of Achievement in Dog Training", width / 2, 62, { align: 'center' });

    // Horizontal line
    doc.setLineWidth(1.5);
    doc.setDrawColor(220, 38, 38);
    doc.line(30, 70, width - 30, 70);

    // Main text
    doc.setFont('Arial', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    doc.text('This certifies that', width / 2, 85, { align: 'center' });

    // Client and dog names
    doc.setFont('Arial', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(28);
    doc.text(`${clientName}`, width / 2, 100, { align: 'center' });
    doc.text(`and`, width / 2, 112, { align: 'center' });
    doc.text(`${dogName}`, width / 2, 124, { align: 'center' });

    // Achievement text
    doc.setFont('Arial', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    const achievementText = `have successfully completed ${sessionsCompleted} professional training sessions and achieved an average performance rating of ${averageRating.toFixed(1)}/10, demonstrating exceptional progress and commitment to positive dog training.`;
    const wrapped = doc.splitTextToSize(achievementText, width - 40);
    doc.text(wrapped, width / 2, 140, { align: 'center' });

    // Horizontal line
    doc.setLineWidth(1);
    doc.setDrawColor(220, 38, 38);
    doc.line(30, 165, width - 30, 165);

    // Trainer signature area
    doc.setFont('Arial', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text('Omar Castaneda, Professional Dog Trainer', 60, 185);
    doc.text(`${new Date().toLocaleDateString()}`, 60, 192);

    // Medal/badge emoji
    doc.setFontSize(24);
    doc.text('🏆', width - 65, 180);

    // Paw prints decoration (bottom)
    doc.setFontSize(18);
    doc.text('🐾', 30, height - 20);
    doc.text('🐾', width - 40, height - 20);

    // Disclaimer
    doc.setFont('Arial', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('This certificate recognizes the dedication and hard work of the handler and the progress of their dog.', width / 2, height - 8, { align: 'center' });

    // Get PDF as base64
    const pdfBase64 = btoa(doc.output('arraybuffer'));

    // Upload certificate
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({
      file: doc.output('blob'),
    });

    // Send email
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626; text-align: center;">🏆 Congratulations! 🏆</h1>
            <p style="font-size: 16px;">Dear ${clientName},</p>
            <p>We're thrilled to celebrate your incredible achievement! You and ${dogName} have successfully graduated from Omar's Dog Training Program.</p>
            <div style="background-color: #f5f5f5; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Sessions Completed:</strong> ${sessionsCompleted}</p>
              <p style="margin: 10px 0;"><strong>Average Performance Rating:</strong> ${averageRating.toFixed(1)}/10</p>
              <p style="margin: 10px 0;"><strong>Status:</strong> ⭐ Graduated</p>
            </div>
            <p>Your training certificate is attached and also available for download below. This represents the hard work and dedication you've invested in ${dogName}'s behavioral development.</p>
            <p style="text-align: center; margin-top: 30px;">
              <a href="${file_url}" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">📥 Download Your Certificate</a>
            </p>
            <p style="margin-top: 30px;">What's next? Consider our advanced training programs or maintenance sessions to keep ${dogName}'s skills sharp.</p>
            <p>Thank you for choosing Omar's Dog Training! We look forward to supporting you both in the future.</p>
            <p style="color: #dc2626; font-weight: bold;">- Omar Castaneda<br/>Omar's Dog Training™</p>
          </div>
        </body>
      </html>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: clientEmail,
      subject: `🏆 Your Training Graduation Certificate - ${dogName}`,
      body: emailHtml,
      from_name: 'Omar\'s Dog Training',
    });

    // Record certificate in database
    const cert = await base44.asServiceRole.entities.GraduationCertificate.create({
      client_email: clientEmail,
      client_name: clientName,
      dog_name: dogName,
      sessions_completed: sessionsCompleted,
      average_rating: averageRating,
      certificate_url: file_url,
      issued_date: new Date().toISOString(),
      email_sent_date: new Date().toISOString(),
    });

    console.log(`Graduation certificate issued to ${clientEmail} for ${dogName}`);

    return Response.json({
      success: true,
      certificateId: cert.id,
      certificateUrl: file_url,
      message: 'Certificate generated and emailed successfully',
    });
  } catch (error) {
    console.error('Error in generateGraduationCertificate:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});