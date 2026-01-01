import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
} from '../services/pushNotifications';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = 'guelaguetza-push-prompted';

const NotificationPrompt: React.FC = () => {
  const { token } = useAuth();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const checkAndShow = () => {
      // Don't show if not supported
      if (!isPushSupported()) return;

      // Don't show if already decided
      const hasDecided = localStorage.getItem(STORAGE_KEY);
      if (hasDecided) return;

      // Don't show if already granted or denied
      const permission = getNotificationPermission();
      if (permission !== 'default') return;

      // Show after a delay
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    };

    checkAndShow();
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        await subscribeToPush(token || undefined);
      }
      localStorage.setItem(STORAGE_KEY, 'true');
      setShow(false);
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom duration-300">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <X size={20} />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-oaxaca-pink/10 rounded-full flex items-center justify-center shrink-0">
          <Bell className="text-oaxaca-pink" size={24} />
        </div>

        <div className="flex-1 pr-6">
          <h3 className="font-bold text-gray-900">No te pierdas nada</h3>
          <p className="text-sm text-gray-500 mt-1">
            Recibe alertas de eventos, calendas y actividades de la Guelaguetza.
          </p>

          <button
            onClick={handleEnable}
            disabled={loading}
            className="mt-3 w-full py-2.5 bg-oaxaca-pink text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Activando...
              </>
            ) : (
              'Activar notificaciones'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
