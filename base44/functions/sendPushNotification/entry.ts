import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Use FCM REST API instead of Admin SDK to avoid dependency issues
const FCM_API_URL = 'https://fcm.googleapis.com/v1/projects';
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID');
const FIREBASE_PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL');

// Simple JWT creation for Firebase OAuth
async function getAccessToken() {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const headerStr = btoa(JSON.stringify(header));
  const payloadStr = btoa(JSON.stringify(payload));
  const data = `${headerStr}.${payloadStr}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(FIREBASE_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(data));
  const signatureStr = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const token = `${data}.${signatureStr}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
  });

  const json = await response.json();
  return json.access_token;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const { clientEmail, title, body, type, data = {}, requireInteraction = false } = await req.json();

    if (!clientEmail || !title || !body) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get FCM tokens for the client from NotificationToken entity
    const tokens = await base44.asServiceRole.entities.NotificationToken.filter({
      client_email: clientEmail,
    });

    if (!tokens || tokens.length === 0) {
      return Response.json({ success: false, message: 'No FCM tokens found for user' });
    }

    const fcmTokens = tokens.map(t => t.fcm_token).filter(Boolean);

    if (fcmTokens.length === 0) {
      return Response.json({ success: false, message: 'No valid FCM tokens' });
    }

    // Get access token for FCM API
    const accessToken = await getAccessToken();

    const results = await Promise.allSettled(
      fcmTokens.map(async (token) => {
        const messagePayload = {
          message: {
            token,
            notification: {
              title,
              body,
            },
            data: {
              type,
              ...data,
            },
            android: {
              priority: 'high',
              notification: {
                clickAction: 'FLUTTER_NOTIFICATION_CLICK',
              },
            },
            webpush: {
              headers: {
                TTL: '86400',
              },
              data: {
                type,
                ...data,
              },
              notification: {
                title,
                body,
                requireInteraction: String(requireInteraction),
              },
            },
          },
        };

        const response = await fetch(
          `${FCM_API_URL}/${FIREBASE_PROJECT_ID}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(messagePayload),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'FCM send failed');
        }

        return response.json();
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Clean up invalid tokens
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        const error = results[i].reason;
        if (error.message?.includes('INVALID_ARGUMENT') || error.message?.includes('NOT_FOUND')) {
          await base44.asServiceRole.entities.NotificationToken.delete(tokens[i].id);
        }
      }
    }

    return Response.json({
      success: successful > 0,
      sent: successful,
      failed,
      message: `Notification sent to ${successful} device(s)`,
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});