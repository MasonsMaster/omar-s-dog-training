import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { invoiceId, type } = await req.json();
  if (!invoiceId || !type) {
    return Response.json({ error: 'invoiceId and type are required' }, { status: 400 });
  }

  const invoice = await base44.asServiceRole.entities.Invoice.get(invoiceId);
  if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 });

  const isReminder = type === 'reminder';
  const isReceipt = type === 'receipt';

  const subject = isReminder
    ? `Payment Reminder — Omar's Dog Training™`
    : `Payment Receipt — Omar's Dog Training™`;

  const formattedAmount = `$${Number(invoice.amount).toFixed(2)}`;
  const programLine = invoice.program ? `<strong>Program:</strong> ${invoice.program}<br>` : '';
  const dogLine = invoice.dog_name ? `<strong>Dog:</strong> ${invoice.dog_name}<br>` : '';
  const dueLine = invoice.due_date ? `<strong>Due Date:</strong> ${invoice.due_date}<br>` : '';
  const paidLine = invoice.paid_date ? `<strong>Paid On:</strong> ${invoice.paid_date}<br>` : '';
  const notesLine = invoice.notes ? `<br><p style="color:#666;">${invoice.notes}</p>` : '';

  const body = isReminder
    ? `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
  <h2 style="color:#8b1a1a;">Omar's Dog Training™</h2>
  <p>Hi there,</p>
  <p>This is a friendly reminder that the following invoice is still outstanding:</p>
  <div style="background:#f5f5f0;border-radius:10px;padding:16px;margin:16px 0;">
    ${programLine}${dogLine}
    <strong>Amount Due:</strong> ${formattedAmount}<br>
    ${dueLine}
  </div>
  ${notesLine}
  <p>Please reach out if you have any questions. You can pay by calling or texting Omar directly at <strong>(321) 830-6272</strong>.</p>
  <p>Thank you!<br><strong>Omar</strong><br>Omar's Dog Training™<br>📞 (321) 830-6272</p>
</div>`
    : `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
  <h2 style="color:#8b1a1a;">Omar's Dog Training™</h2>
  <p>Hi there,</p>
  <p>Thank you for your payment! Here's your receipt:</p>
  <div style="background:#f0fdf4;border-radius:10px;padding:16px;margin:16px 0;">
    ${programLine}${dogLine}
    <strong>Amount Paid:</strong> ${formattedAmount}<br>
    ${paidLine}
  </div>
  ${notesLine}
  <p>We appreciate your trust and look forward to seeing you and your pup!</p>
  <p>— <strong>Omar</strong><br>Omar's Dog Training™<br>📞 (321) 830-6272</p>
</div>`;

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: invoice.client_email,
    subject,
    body,
    from_name: "Omar's Dog Training™",
  });

  // Record when reminder was sent
  if (isReminder) {
    await base44.asServiceRole.entities.Invoice.update(invoiceId, {
      reminder_sent_at: new Date().toISOString(),
    });
  }

  return Response.json({ success: true, type, to: invoice.client_email });
});