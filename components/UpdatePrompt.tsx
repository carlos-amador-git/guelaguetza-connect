import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { subscribeToSWUpdate, skipWaiting } from '../services/pwa';

const UpdatePrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSWUpdate(() => {
      setShowPrompt(true);
    });

    return unsubscribe;
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    await skipWaiting();
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 z-50 animate-in slide-in-from-bottom duration-300">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <X size={20} />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-oaxaca-sky/10 rounded-full flex items-center justify-center shrink-0">
          <RefreshCw className="text-oaxaca-sky" size={24} />
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-gray-900">Nueva version disponible</h3>
          <p className="text-sm text-gray-500 mt-1">
            Hay una actualizacion lista para instalar.
          </p>

          <button
            onClick={handleUpdate}
            disabled={updating}
            className="mt-3 w-full py-2.5 bg-oaxaca-sky text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {updating ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Actualizando...
              </>
            ) : (
              'Actualizar ahora'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
