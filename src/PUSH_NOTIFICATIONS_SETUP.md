# Push Notifications Setup Guide

## Firebase Cloud Messaging (FCM) Integration

This app includes a complete push notification system for:
- Training session reminders (24 hours & 1 hour before)
- Vaccination expiry alerts (10 days before)
- Instant message notifications from trainers

### Setup Steps

#### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Cloud Messaging

#### 2. Get Frontend Configuration
1. In Firebase Console → Project Settings
2. Copy your Web App config (API Key, Auth Domain, Project ID, etc.)
3. Add to `.env.local` with `VITE_` prefix (see `.env.example`)

#### 3. Get Backend Credentials
1. In Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Add to secrets via Base44 Dashboard:
   - `FIREBASE_PROJECT_ID`: from the JSON
   - `FIREBASE_CLIENT_EMAIL`: from the JSON
   - `FIREBASE_PRIVATE_KEY`: from the JSON (preserve newlines as `\n`)

#### 4. Get Web Push Certificate
1. In Firebase Console → Cloud Messaging tab
2. Copy the Web Push Certificate (VAPID public key)
3. Add to `.env.local` as `VITE_FIREBASE_VAPID_KEY`

#### 5. Register Service Worker
The service worker (`public/firebase-messaging-sw.js`) needs your Firebase config.
Update the `firebaseConfig` object with your credentials.

### How It Works

**Frontend Flow:**
1. User visits app → Notification permission prompt shown after 2 seconds
2. User approves → FCM token generated and saved
3. Token stored in `NotificationToken` entity

**Backend Flow:**
1. **Session Reminders** (every 30 min):
   - Checks active training schedules
   - Sends notification 24h and 1h before session

2. **Vaccination Reminders** (daily at 9am UTC):
   - Checks all dog vaccination records
   - Alerts 10 days before expiry

3. **Message Notifications** (immediate):
   - Triggered when trainer sends message
   - Instant alert to client with preview

### Testing

1. Build & deploy your app
2. Visit the site and approve notifications
3. In Firebase Console → Messaging → Send Test Message
4. Select your device and send

### Troubleshooting

- **Tokens not saving**: Check `NotificationToken` entity created
- **Notifications not sending**: Verify Firebase credentials in secrets
- **Service worker not registering**: Check browser console for errors
- **Browser support**: FCM requires HTTPS or localhost

### Notifications Sent
- **Training Sessions**: Sent via `sendSessionReminders` function
- **Vaccinations**: Sent via `sendVaccinationReminders` function  
- **Messages**: Sent via `sendMessageNotification` function (auto-triggered)