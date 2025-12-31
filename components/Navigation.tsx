import React from 'react';
import { Home, Bus, Camera, Compass, User } from 'lucide-react';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const { isAuthenticated, user } = useAuth();

  const navItems = [
    { view: ViewState.HOME, icon: Home, label: 'Inicio' },
    { view: ViewState.TRANSPORT, icon: Bus, label: 'BinniBus' },
    { view: ViewState.AR_SCANNER, icon: Camera, label: 'AR' },
    { view: ViewState.STORIES, icon: Compass, label: 'Historias' },
    { view: ViewState.PROFILE, icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const isProfile = item.view === ViewState.PROFILE;

          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                isActive ? 'text-oaxaca-pink' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {isProfile && isAuthenticated && user?.faceData ? (
                <img
                  src={user.faceData}
                  alt="Perfil"
                  className={`w-6 h-6 rounded-full object-cover ${isActive ? 'ring-2 ring-oaxaca-pink' : ''}`}
                />
              ) : (
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              )}
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
