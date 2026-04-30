import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    // Handle both direct invocation and automation payload
    let clientEmail, senderName, messagePreview;
    
    if (body.event) {
      // From entity automation
      clientEmail = body.data?.client_email;
      senderName = body.data?.sender_name;
      messagePreview = body.data?.body?.substring(0, 100);
    } else {
      // Direct invocation
      clientEmail = body.clientEmail;
      senderName = body.senderName;
      messagePreview = body.messagePreview;
    }

    if (!clientEmail || !senderName) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await base44.functions.invoke('sendPushNotification', {
      clientEmail,
      title: `Message from ${senderName}`,
      body: messagePreview || 'You have a new message',
      type: 'new_message',
      data: {
        senderName,
        url: '/my-dashboard?tab=messages',
      },
    });

    return Response.json(result);
  } catch (error) {
    console.error('Error sending message notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});