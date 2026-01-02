import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  Users,
  TrendingUp,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getMyAnalytics,
  getTrends,
  UserAnalytics,
  TrendsResponse,
  formatNumber,
} from '../services/analytics';
import StatCard from './ui/StatCard';
import SimpleChart from './ui/SimpleChart';

interface AnalyticsDashboardProps {
  onBack: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onBack }) => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 14 | 30>(7);
  const [activeTab, setActiveTab] = useState<'overview' | 'content'>('overview');

  useEffect(() => {
    loadData();
  }, [token, selectedPeriod]);

  const loadData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [analyticsData, trendsData] = await Promise.all([
        getMyAnalytics(token),
        getTrends(selectedPeriod, token),
      ]);
      setAnalytics(analyticsData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-oaxaca-pink" size={32} />
      </div>
    );
  }

  const chartData = trends?.daily.map((d) => ({
    label: new Date(d.date).toLocaleDateString('es-MX', { weekday: 'short' }),
    value: d.likes + d.comments,
  })) || [];

  const viewsData = trends?.daily.map((d) => ({
    label: new Date(d.date).toLocaleDateString('es-MX', { weekday: 'short' }),
    value: d.views,
  })) || [];

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 pb-20 overflow-y-auto transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-br from-oaxaca-purple to-oaxaca-pink p-6 pt-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-white hover:bg-white/10 rounded-full"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-white font-bold text-xl">Analytics</h1>
            <p className="text-white/70 text-sm">Estadisticas de tu cuenta</p>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-2 mt-4">
          {([7, 14, 30] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-white text-oaxaca-purple'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {period} dias
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-oaxaca-pink text-oaxaca-pink'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'content'
              ? 'border-oaxaca-pink text-oaxaca-pink'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Contenido
        </button>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Vistas totales"
                value={formatNumber(analytics?.totalViews || 0)}
                change={trends?.growth.viewsChange}
                icon={<Eye size={20} />}
                color="purple"
              />
              <StatCard
                label="Likes recibidos"
                value={formatNumber(analytics?.totalLikes || 0)}
                change={trends?.growth.likesChange}
                icon={<Heart size={20} />}
                color="pink"
              />
              <StatCard
                label="Comentarios"
                value={formatNumber(analytics?.totalComments || 0)}
                change={trends?.growth.commentsChange}
                icon={<MessageCircle size={20} />}
                color="blue"
              />
              <StatCard
                label="Seguidores"
                value={formatNumber(analytics?.followersCount || 0)}
                change={trends?.growth.followersChange}
                icon={<Users size={20} />}
                color="green"
              />
            </div>

            {/* Engagement Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Engagement
                </h3>
                <TrendingUp size={18} className="text-oaxaca-pink" />
              </div>
              <SimpleChart
                data={chartData}
                type="bar"
                color="#E91E63"
                height={100}
              />
            </div>

            {/* Views Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Vistas
                </h3>
                <Eye size={18} className="text-oaxaca-purple" />
              </div>
              <SimpleChart
                data={viewsData}
                type="line"
                color="#9C27B0"
                height={100}
              />
            </div>

            {/* Engagement Rate */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-oaxaca-yellow/10 rounded-lg">
                  <BarChart3 size={24} className="text-oaxaca-yellow" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tasa de engagement
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analytics?.engagementRate.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-400">Likes/historia</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {analytics?.avgLikesPerStory.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Comentarios/historia</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {analytics?.avgCommentsPerStory.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'content' && (
          <>
            {/* Top Performing Stories */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Historias con mejor rendimiento
              </h3>

              {analytics?.topPerformingStories.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  Aun no tienes historias
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics?.topPerformingStories.map((story, index) => (
                    <div
                      key={story.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <span className="w-6 h-6 flex items-center justify-center bg-oaxaca-pink/10 text-oaxaca-pink rounded-full text-xs font-bold">
                        {index + 1}
                      </span>
                      <img
                        src={story.thumbnailUrl || story.mediaUrl}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {story.description.slice(0, 50)}...
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Eye size={12} />
                            {story.views}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Heart size={12} />
                            {story.likes}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MessageCircle size={12} />
                            {story.comments}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-oaxaca-pink">
                          {story.engagementRate}%
                        </p>
                        <p className="text-xs text-gray-400">engagement</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center">
                <p className="text-3xl font-bold text-oaxaca-purple">
                  {analytics?.totalStories || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Historias publicadas
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center">
                <p className="text-3xl font-bold text-oaxaca-pink">
                  {analytics?.followingCount || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Siguiendo
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
