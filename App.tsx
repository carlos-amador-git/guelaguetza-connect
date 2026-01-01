import React, { useState, useEffect, lazy, Suspense } from 'react';
import Navigation from './components/Navigation';
import HomeView from './components/HomeView';
import TransportView from './components/TransportView';
import StoriesView from './components/StoriesView';
import ChatAssistant from './components/ChatAssistant';
import ProgramView from './components/ProgramView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import ProfileView from './components/ProfileView';
import UserProfileView from './components/UserProfileView';
import BadgesView from './components/BadgesView';
import LeaderboardView from './components/LeaderboardView';
import OfflineIndicator from './components/OfflineIndicator';
import UpdatePrompt from './components/UpdatePrompt';
import NotificationPrompt from './components/NotificationPrompt';
import Onboarding from './components/Onboarding';
import { ViewState } from './types';

// Lazy load ARScanner for code splitting
const ARScanner = lazy(() => import('./components/ARScanner'));

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleViewUserProfile = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView(ViewState.USER_PROFILE);
  };

  // Check if onboarding has been completed
  useEffect(() => {
    const completed = localStorage.getItem('guelaguetza_onboarding_completed');
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <HomeView setView={setCurrentView} />;
      case ViewState.TRANSPORT:
        return <TransportView />;
      case ViewState.AR_SCANNER:
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-full">Cargando AR...</div>}>
            <ARScanner />
          </Suspense>
        );
      case ViewState.STORIES:
        return <StoriesView onUserProfile={handleViewUserProfile} />;
      case ViewState.USER_PROFILE:
        return selectedUserId ? (
          <UserProfileView
            userId={selectedUserId}
            onBack={() => setCurrentView(ViewState.STORIES)}
          />
        ) : (
          <StoriesView onUserProfile={handleViewUserProfile} />
        );
      case ViewState.CHAT:
        return <ChatAssistant />;
      case ViewState.PROGRAM:
        return <ProgramView />;
      case ViewState.LOGIN:
        return <LoginView setView={setCurrentView} />;
      case ViewState.REGISTER:
        return <RegisterView setView={setCurrentView} />;
      case ViewState.PROFILE:
        return <ProfileView setView={setCurrentView} />;
      case ViewState.BADGES:
        return <BadgesView onBack={() => setCurrentView(ViewState.PROFILE)} />;
      case ViewState.LEADERBOARD:
        return (
          <LeaderboardView
            onBack={() => setCurrentView(ViewState.PROFILE)}
            onUserProfile={handleViewUserProfile}
          />
        );
      default:
        return <HomeView setView={setCurrentView} />;
    }
  };

  // Hide navigation on auth screens, user profile, and gamification views
  const hideNav = [ViewState.LOGIN, ViewState.REGISTER, ViewState.USER_PROFILE, ViewState.BADGES, ViewState.LEADERBOARD].includes(currentView);

  return (
    <div className="max-w-md mx-auto h-screen bg-white dark:bg-gray-900 relative shadow-2xl overflow-hidden flex flex-col font-sans transition-colors">
      {/* Onboarding */}
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}

      {/* PWA Offline Indicator */}
      <OfflineIndicator />

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        {renderView()}
      </div>
      {!hideNav && <Navigation currentView={currentView} setView={setCurrentView} onUserProfile={handleViewUserProfile} />}

      {/* PWA Prompts */}
      <NotificationPrompt />
      <UpdatePrompt />
    </div>
  );
};

export default App;
