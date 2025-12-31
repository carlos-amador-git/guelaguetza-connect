import React, { useState } from 'react';
import { User, Mail, MapPin, LogOut, Camera, Scan, ChevronRight, Settings, Bell, Shield, Heart, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ViewState } from '../types';

interface ProfileViewProps {
  setView: (view: ViewState) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ setView }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    setView(ViewState.HOME);
  };

  // Not logged in state
  if (!isAuthenticated || !user) {
    return (
      <div className="h-full flex flex-col bg-gray-50 pb-20">
        <div className="bg-oaxaca-purple p-6 pt-8">
          <h2 className="text-white font-bold text-xl">Mi Perfil</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
            <User className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">¡Únete a la fiesta!</h3>
          <p className="text-gray-500 text-center text-sm mb-8 max-w-xs">
            Crea una cuenta para guardar tus favoritos, subir historias y más
          </p>
          <button
            onClick={() => setView(ViewState.LOGIN)}
            className="w-full max-w-xs bg-oaxaca-pink text-white py-4 rounded-xl font-bold"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setView(ViewState.REGISTER)}
            className="w-full max-w-xs mt-3 border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold"
          >
            Crear Cuenta
          </button>
        </div>
      </div>
    );
  }

  // Logged in state
  return (
    <div className="h-full flex flex-col bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-oaxaca-purple to-oaxaca-pink p-6 pt-8 pb-20 relative">
        <h2 className="text-white font-bold text-xl mb-1">Mi Perfil</h2>
        <p className="text-white/70 text-sm">Gestiona tu cuenta</p>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-14 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              {user.faceData ? (
                <img
                  src={user.faceData}
                  alt={user.nombre}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 bg-oaxaca-yellow rounded-full flex items-center justify-center border-4 border-white shadow-md">
                  <span className="text-2xl font-bold text-oaxaca-purple">
                    {user.nombre.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <button className="absolute bottom-0 right-0 bg-oaxaca-pink p-1.5 rounded-full text-white shadow-md">
                <Camera size={14} />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">
                {user.nombre} {user.apellido || ''}
              </h3>
              <p className="text-gray-500 text-sm">{user.email}</p>
              {user.region && (
                <div className="flex items-center gap-1 mt-1 text-oaxaca-pink text-xs">
                  <MapPin size={12} />
                  <span>{user.region}</span>
                </div>
              )}
            </div>
          </div>

          {/* Face ID Status */}
          <div className="mt-4 p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${user.faceData ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Scan size={20} className={user.faceData ? 'text-green-600' : 'text-gray-400'} />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Face ID</p>
                <p className="text-xs text-gray-500">
                  {user.faceData ? 'Configurado' : 'No configurado'}
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="px-4 mt-6 space-y-3">
        {/* Account Section */}
        <div className="bg-white rounded-xl overflow-hidden">
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Cuenta</p>

          <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
            <div className="p-2 bg-blue-100 rounded-full">
              <Settings size={18} className="text-blue-600" />
            </div>
            <span className="flex-1 text-left text-gray-900">Configuración</span>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
            <div className="p-2 bg-purple-100 rounded-full">
              <Bell size={18} className="text-purple-600" />
            </div>
            <span className="flex-1 text-left text-gray-900">Notificaciones</span>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
            <div className="p-2 bg-green-100 rounded-full">
              <Shield size={18} className="text-green-600" />
            </div>
            <span className="flex-1 text-left text-gray-900">Privacidad</span>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Activity Section */}
        <div className="bg-white rounded-xl overflow-hidden">
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Actividad</p>

          <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
            <div className="p-2 bg-pink-100 rounded-full">
              <Heart size={18} className="text-pink-600" />
            </div>
            <span className="flex-1 text-left text-gray-900">Mis favoritos</span>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          <button
            onClick={() => setView(ViewState.CHAT)}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
          >
            <div className="p-2 bg-yellow-100 rounded-full">
              <HelpCircle size={18} className="text-yellow-600" />
            </div>
            <span className="flex-1 text-left text-gray-900">Mis conversaciones con GuelaBot</span>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-white rounded-xl px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-red-50 transition"
        >
          <div className="p-2 bg-red-100 rounded-full">
            <LogOut size={18} className="text-red-500" />
          </div>
          <span className="flex-1 text-left font-medium">Cerrar Sesión</span>
        </button>
      </div>

      {/* App Version */}
      <div className="mt-auto px-4 py-4">
        <p className="text-center text-gray-400 text-xs">
          Guelaguetza Connect v1.0.0
        </p>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Cerrar sesión?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Tendrás que volver a iniciar sesión para acceder a tu cuenta
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
