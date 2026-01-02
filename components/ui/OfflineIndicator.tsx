import React from 'react';
import { WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing?: boolean;
  onSync?: () => void;
  variant?: 'banner' | 'badge' | 'minimal';
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  pendingCount,
  isSyncing = false,
  onSync,
  variant = 'banner',
}) => {
  // Don't show anything if online with no pending actions
  if (isOnline && pendingCount === 0) {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-1">
        {!isOnline && <WifiOff size={14} className="text-red-500" />}
        {pendingCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-oaxaca-yellow">
            <CloudOff size={12} />
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'badge') {
    if (!isOnline) {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
          <WifiOff size={12} />
          Sin conexion
        </div>
      );
    }

    if (pendingCount > 0) {
      return (
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2 py-1 bg-oaxaca-yellow/20 text-oaxaca-yellow rounded-full text-xs font-medium"
        >
          {isSyncing ? (
            <RefreshCw size={12} className="animate-spin" />
          ) : (
            <Cloud size={12} />
          )}
          {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
        </button>
      );
    }

    return null;
  }

  // Banner variant (default)
  if (!isOnline) {
    return (
      <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm">
        <WifiOff size={16} />
        <span>Sin conexion - Los cambios se sincronizaran al volver en linea</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="bg-oaxaca-yellow text-gray-900 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <CloudOff size={16} />
          <span>
            {pendingCount} accion{pendingCount !== 1 ? 'es' : ''} pendiente
            {pendingCount !== 1 ? 's' : ''} de sincronizar
          </span>
        </div>
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;
