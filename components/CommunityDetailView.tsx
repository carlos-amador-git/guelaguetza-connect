import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Lock,
  Globe,
  Send,
  Loader2,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getCommunity,
  getCommunityPosts,
  joinCommunity,
  leaveCommunity,
  createPost,
  deletePost,
  Community,
  CommunityPost,
  timeAgo,
} from '../services/communities';

interface CommunityDetailViewProps {
  communityId: string;
  onBack: () => void;
  onUserProfile?: (userId: string) => void;
}

const CommunityDetailView: React.FC<CommunityDetailViewProps> = ({
  communityId,
  onBack,
  onUserProfile,
}) => {
  const { token, user, isAuthenticated } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [joining, setJoining] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);

  useEffect(() => {
    loadCommunity();
    loadPosts();
  }, [communityId, token]);

  const loadCommunity = async () => {
    try {
      const data = await getCommunity(communityId, token || undefined);
      setCommunity(data);
    } catch (error) {
      console.error('Error loading community:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const data = await getCommunityPosts(communityId);
      setPosts(data.posts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleJoinLeave = async () => {
    if (!token || !community) return;

    setJoining(true);
    try {
      if (community.isMember) {
        await leaveCommunity(communityId, token);
        setCommunity({
          ...community,
          isMember: false,
          memberRole: undefined,
          membersCount: community.membersCount - 1,
        });
      } else {
        await joinCommunity(communityId, token);
        setCommunity({
          ...community,
          isMember: true,
          memberRole: 'MEMBER',
          membersCount: community.membersCount + 1,
        });
      }
    } catch (error) {
      console.error('Error joining/leaving:', error);
    } finally {
      setJoining(false);
    }
  };

  const handlePost = async () => {
    if (!token || !newPost.trim()) return;

    setPosting(true);
    try {
      const post = await createPost(communityId, newPost, null, token);
      setPosts([post, ...posts]);
      setNewPost('');
      if (community) {
        setCommunity({ ...community, postsCount: community.postsCount + 1 });
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!token) return;

    try {
      await deletePost(communityId, postId, token);
      setPosts(posts.filter((p) => p.id !== postId));
      if (community) {
        setCommunity({ ...community, postsCount: community.postsCount - 1 });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
    setShowPostMenu(null);
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-oaxaca-pink" size={32} />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <p className="text-gray-500">Comunidad no encontrada</p>
        <button onClick={onBack} className="mt-4 text-oaxaca-pink font-medium">
          Volver
        </button>
      </div>
    );
  }

  const canPost = community.isMember;
  const isAdminOrMod =
    community.memberRole === 'ADMIN' || community.memberRole === 'MODERATOR';

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 pb-20 flex flex-col transition-colors">
      {/* Header */}
      <div className="relative">
        {/* Cover */}
        <div
          className={`h-32 ${
            community.coverUrl
              ? ''
              : 'bg-gradient-to-br from-oaxaca-purple to-oaxaca-pink'
          }`}
        >
          {community.coverUrl && (
            <img
              src={community.coverUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          <button
            onClick={onBack}
            className="absolute top-4 left-4 p-2 bg-black/30 text-white rounded-full hover:bg-black/50"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Community Info */}
        <div className="px-4 -mt-8 relative">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg bg-gradient-to-br from-oaxaca-purple to-oaxaca-pink">
              {community.imageUrl ? (
                <img
                  src={community.imageUrl}
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                  {community.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {community.name}
                </h1>
                {community.isPublic ? (
                  <Globe size={16} className="text-gray-400" />
                ) : (
                  <Lock size={16} className="text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {community.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              {community.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Users size={16} />
              {community.membersCount} miembros
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <MessageSquare size={16} />
              {community.postsCount} posts
            </span>
          </div>

          {/* Join/Leave Button */}
          {isAuthenticated && (
            <button
              onClick={handleJoinLeave}
              disabled={joining}
              className={`mt-4 w-full py-2.5 rounded-lg font-medium transition-colors ${
                community.isMember
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  : 'bg-oaxaca-pink text-white hover:bg-oaxaca-pink/90'
              }`}
            >
              {joining ? (
                <Loader2 className="animate-spin mx-auto" size={20} />
              ) : community.isMember ? (
                'Salir de la comunidad'
              ) : (
                'Unirse a la comunidad'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Posts Section */}
      <div className="flex-1 overflow-y-auto mt-4 px-4">
        {/* New Post Input */}
        {canPost && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-4">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Comparte algo con la comunidad..."
              className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none focus:outline-none"
              rows={3}
              maxLength={2000}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handlePost}
                disabled={posting || !newPost.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-oaxaca-pink text-white rounded-lg font-medium disabled:opacity-50"
              >
                {posting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Send size={16} />
                )}
                Publicar
              </button>
            </div>
          </div>
        )}

        {/* Posts List */}
        {loadingPosts ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-oaxaca-pink" size={24} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
            <p>Aun no hay posts en esta comunidad</p>
            {canPost && <p className="text-sm mt-1">Se el primero en publicar!</p>}
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onUserProfile?.(post.author.id)}
                    className="flex-shrink-0"
                  >
                    {post.author.avatar ? (
                      <img
                        src={post.author.avatar}
                        alt={post.author.nombre}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-oaxaca-yellow rounded-full flex items-center justify-center">
                        <span className="text-oaxaca-purple font-bold">
                          {post.author.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUserProfile?.(post.author.id)}
                        className="font-medium text-gray-900 dark:text-gray-100 hover:underline"
                      >
                        {post.author.nombre}
                      </button>
                      <span className="text-xs text-gray-400">
                        {timeAgo(post.createdAt)}
                      </span>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt=""
                        className="mt-3 rounded-lg max-h-64 object-cover"
                      />
                    )}
                  </div>

                  {/* Post Actions */}
                  {(post.author.id === user?.id || isAdminOrMod) && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowPostMenu(showPostMenu === post.id ? null : post.id)
                        }
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {showPostMenu === post.id && (
                        <div className="absolute right-0 top-6 w-32 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10">
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityDetailView;
