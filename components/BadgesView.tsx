import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getMyBadges, Badge, getCategoryName } from '../services/gamification';
import { useAuth } from '../contexts/AuthContext';
import BadgeCard from './ui/BadgeCard';

interface BadgesViewProps {
  onBack: () => void;
}

const BadgesView: React.FC<BadgesViewProps> = ({ onBack }) => {
  const { token } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    if (!token) return;

    try {
      const data = await getMyBadges(token);
      setBadges(data);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'STORIES', 'SOCIAL', 'ENGAGEMENT', 'STREAK', 'SPECIAL'];

  const filteredBadges = activeCategory === 'all'
    ? badges
    : badges.filter(b => b.category === activeCategory);

  const unlockedCount = badges.filter(b => b.isUnlocked).length;
  const totalCount = badges.length;

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 pb-20 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-br from-oaxaca-purple to-oaxaca-pink p-6 pt-8 pb-20">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 text-white hover:bg-white/10 rounded-full"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-white font-bold text-xl">Mis Logros</h2>
        </div>

        {/* Progress */}
        <div className="text-center text-white">
          <p className="text-4xl font-bold">{unlockedCount}/{totalCount}</p>
          <p className="text-white/80">badges desbloqueados</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 flex overflow-x-auto no-scrollbar gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-oaxaca-pink text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {cat === 'all' ? 'Todos' : getCategoryName(cat as Badge['category'])}
            </button>
          ))}
        </div>
      </div>

      {/* Badges grid */}
      <div className="px-4 mt-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-oaxaca-pink" size={32} />
          </div>
        ) : filteredBadges.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No hay badges en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {filteredBadges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                size="sm"
                onClick={() => setSelectedBadge(badge)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Badge detail modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Badge icon large */}
            <div className="flex justify-center mb-4">
              <div
                className={`w-24 h-24 rounded-3xl flex items-center justify-center ${
                  selectedBadge.isUnlocked
                    ? 'bg-gradient-to-br from-oaxaca-yellow/20 to-oaxaca-pink/20'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`text-5xl ${
                    selectedBadge.isUnlocked ? '' : 'grayscale opacity-30'
                  }`}
                >
                  {selectedBadge.icon}
                </span>
              </div>
            </div>

            {/* Badge info */}
            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
              {selectedBadge.name}
            </h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-4">
              {selectedBadge.description}
            </p>

            {/* Category & XP */}
            <div className="flex justify-center gap-4 mb-4">
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300">
                {getCategoryName(selectedBadge.category)}
              </span>
              {selectedBadge.xpReward > 0 && (
                <span className="px-3 py-1 bg-oaxaca-yellow/20 rounded-full text-sm text-oaxaca-yellow font-medium">
                  +{selectedBadge.xpReward} XP
                </span>
              )}
            </div>

            {/* Status */}
            {selectedBadge.isUnlocked ? (
              <p className="text-center text-oaxaca-pink font-medium">
                Desbloqueado el {new Date(selectedBadge.unlockedAt!).toLocaleDateString('es-MX')}
              </p>
            ) : (
              <p className="text-center text-gray-400">
                Aún no desbloqueado
              </p>
            )}

            {/* Close button */}
            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full mt-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgesView;
