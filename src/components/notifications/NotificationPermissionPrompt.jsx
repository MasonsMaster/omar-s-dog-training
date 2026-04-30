import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestNotificationPermission, saveFCMToken, onForegroundMessage } from '@/lib/firebase';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';

export default function NotificationPermissionPrompt() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show prompt if permissions not granted and user is authenticated
    if (user && Notification.permission === 'default') {
      const hasSeenPrompt = localStorage.getItem('notification-prompt-seen');
      if (!hasSeenPrompt) {
        setTimeout(() => setShow(true), 2000);
      }
    }

    // Handle foreground messages
    onForegroundMessage((payload) => {
      toast.success(payload.notification?.title || 'New notification', {
        description: payload.notification?.body,
      });
    });
  }, [user]);

  const handleEnable = async () => {
    setLoading(true);
    const token = await requestNotificationPermission();
    if (token && user) {
      await saveFCMToken(user.email, token);
      toast.success('Push notifications enabled!');
      setShow(false);
      localStorage.setItem('notification-prompt-seen', 'true');
    } else {
      toast.error('Failed to enable notifications');
    }
    setLoading(false);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('notification-prompt-seen', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-card border border-border rounded-2xl shadow-xl p-5 z-50 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm">Stay Updated</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Get reminders for upcoming training sessions, vaccination dates, and messages from Mason.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={loading}
              className="rounded-full font-bold gap-1 text-xs"
            >
              {loading ? 'Enabling...' : 'Enable Notifications'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              className="rounded-full text-xs"
            >
              Not now
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}