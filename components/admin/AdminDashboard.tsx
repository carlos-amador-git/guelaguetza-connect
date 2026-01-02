import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  Image,
  MessageCircle,
  Heart,
  Calendar,
  UsersRound,
  UserPlus,
  Activity,
  Loader2,
  Shield,
  FileText,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardStats, DashboardStats } from '../../services/admin';
import StatCard from '../ui/StatCard';

type AdminTab = 'dashboard' | 'users' | 'content' | 'reports';

interface AdminDashboardProps {
  onBack: () => void;
  initialTab?: AdminTab;
  children?: React.ReactNode;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBack,
  initialTab = 'dashboard',
  children,
}) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [token]);

  const loadStats = async () => {
    if (!token) return;

    try {
      const data = await getDashboardStats(token);
      setStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Activity },
    { id: 'users' as const, label: 'Usuarios', icon: Users },
    { id: 'content' as const, label: 'Contenido', icon: FileText },
    { id: 'reports' as const, label: 'Reportes', icon: Settings },
  ];

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 pb-20 overflow-hidden flex flex-col transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 pt-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-white hover:bg-white/10 rounded-full"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={24} className="text-oaxaca-yellow" />
            <div>
              <h1 className="text-white font-bold text-xl">Panel de Admin</h1>
              <p className="text-white/70 text-sm">Gestion del sistema</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-800'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-oaxaca-pink" size={32} />
          </div>
        ) : activeTab === 'dashboard' ? (
          <div className="space-y-4">
            {/* Today Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Hoy
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-500">
                    <UserPlus size={16} />
                    <span className="text-xl font-bold">{stats?.newUsersToday}</span>
                  </div>
                  <p className="text-xs text-gray-400">Nuevos usuarios</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-oaxaca-pink">
                    <Image size={16} />
                    <span className="text-xl font-bold">{stats?.newStoriesToday}</span>
                  </div>
                  <p className="text-xs text-gray-400">Nuevas historias</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-oaxaca-purple">
                    <Activity size={16} />
                    <span className="text-xl font-bold">{stats?.activeUsersToday}</span>
                  </div>
                  <p className="text-xs text-gray-400">Usuarios activos</p>
                </div>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Total usuarios"
                value={stats?.totalUsers || 0}
                icon={<Users size={20} />}
                color="purple"
              />
              <StatCard
                label="Total historias"
                value={stats?.totalStories || 0}
                icon={<Image size={20} />}
                color="pink"
              />
              <StatCard
                label="Total likes"
                value={stats?.totalLikes || 0}
                icon={<Heart size={20} />}
                color="pink"
              />
              <StatCard
                label="Total comentarios"
                value={stats?.totalComments || 0}
                icon={<MessageCircle size={20} />}
                color="blue"
              />
              <StatCard
                label="Comunidades"
                value={stats?.totalCommunities || 0}
                icon={<UsersRound size={20} />}
                color="green"
              />
              <StatCard
                label="Eventos"
                value={stats?.totalEvents || 0}
                icon={<Calendar size={20} />}
                color="yellow"
              />
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
