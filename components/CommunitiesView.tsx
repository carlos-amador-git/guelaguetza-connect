import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Users,
  Loader2,
  X,
  Lock,
  Globe,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getCommunities,
  getMyCommunities,
  createCommunity,
  Community,
} from '../services/communities';
import CommunityCard from './ui/CommunityCard';

interface CommunitiesViewProps {
  onCommunityClick: (communityId: string) => void;
}

const CommunitiesView: React.FC<CommunitiesViewProps> = ({ onCommunityClick }) => {
  const { token, isAuthenticated } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'discover' | 'my'>('discover');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    isPublic: true,
  });

  useEffect(() => {
    loadCommunities();
  }, [token, search]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'my') {
      loadMyCommunities();
    }
  }, [activeTab, token]);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const data = await getCommunities(1, 50, search || undefined, token || undefined);
      setCommunities(data.communities);
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyCommunities = async () => {
    if (!token) return;

    try {
      const data = await getMyCommunities(token);
      setMyCommunities(data.communities);
    } catch (error) {
      console.error('Error loading my communities:', error);
    }
  };

  const handleCreate = async () => {
    if (!token || !newCommunity.name.trim()) return;

    setCreating(true);
    try {
      const created = await createCommunity(
        newCommunity.name,
        newCommunity.description || undefined,
        newCommunity.isPublic,
        token
      );
      setShowCreateModal(false);
      setNewCommunity({ name: '', description: '', isPublic: true });
      onCommunityClick(created.id);
    } catch (error) {
      console.error('Error creating community:', error);
    } finally {
      setCreating(false);
    }
  };

  const displayedCommunities = activeTab === 'my' ? myCommunities : communities;

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 pb-20 overflow-y-auto transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-br from-oaxaca-purple to-oaxaca-pink p-6 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-2xl">Comunidades</h1>
            <p className="text-white/70 text-sm">
              Conecta con personas con intereses similares
            </p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
            >
              <Plus size={24} />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar comunidades..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/20 text-white placeholder-white/50 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>

        {/* Tabs */}
        {isAuthenticated && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'discover'
                  ? 'bg-white text-oaxaca-purple'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Descubrir
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'my'
                  ? 'bg-white text-oaxaca-purple'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Mis comunidades
            </button>
          </div>
        )}
      </div>

      {/* Communities List */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-oaxaca-pink" size={32} />
          </div>
        ) : displayedCommunities.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === 'my'
                ? 'Aun no te has unido a ninguna comunidad'
                : search
                ? 'No se encontraron comunidades'
                : 'No hay comunidades disponibles'}
            </p>
            {isAuthenticated && activeTab === 'discover' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-oaxaca-pink text-white rounded-full font-medium"
              >
                Crear la primera
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                onClick={() => onCommunityClick(community.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Nueva comunidad
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newCommunity.name}
                  onChange={(e) =>
                    setNewCommunity({ ...newCommunity, name: e.target.value })
                  }
                  placeholder="Nombre de la comunidad"
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-oaxaca-pink text-gray-900 dark:text-gray-100"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripcion (opcional)
                </label>
                <textarea
                  value={newCommunity.description}
                  onChange={(e) =>
                    setNewCommunity({ ...newCommunity, description: e.target.value })
                  }
                  placeholder="De que se trata esta comunidad?"
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-oaxaca-pink text-gray-900 dark:text-gray-100 resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibilidad
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNewCommunity({ ...newCommunity, isPublic: true })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-colors ${
                      newCommunity.isPublic
                        ? 'border-oaxaca-pink bg-oaxaca-pink/10 text-oaxaca-pink'
                        : 'border-gray-200 dark:border-gray-600 text-gray-500'
                    }`}
                  >
                    <Globe size={18} />
                    Publica
                  </button>
                  <button
                    onClick={() => setNewCommunity({ ...newCommunity, isPublic: false })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-colors ${
                      !newCommunity.isPublic
                        ? 'border-oaxaca-pink bg-oaxaca-pink/10 text-oaxaca-pink'
                        : 'border-gray-200 dark:border-gray-600 text-gray-500'
                    }`}
                  >
                    <Lock size={18} />
                    Privada
                  </button>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={creating || !newCommunity.name.trim()}
                className="w-full py-3 bg-oaxaca-pink text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <Loader2 className="animate-spin mx-auto" size={20} />
                ) : (
                  'Crear comunidad'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunitiesView;
