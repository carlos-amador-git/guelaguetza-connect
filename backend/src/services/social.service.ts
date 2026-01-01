import { PrismaClient, Follow, User } from '@prisma/client';

interface PaginationInput {
  page: number;
  limit: number;
}

interface UserProfile {
  id: string;
  nombre: string;
  apellido: string | null;
  avatar: string | null;
  bio: string | null;
  region: string | null;
  isPublic: boolean;
  followersCount: number;
  followingCount: number;
  storiesCount: number;
  isFollowing?: boolean;
  createdAt: Date;
}

interface UserListItem {
  id: string;
  nombre: string;
  apellido: string | null;
  avatar: string | null;
  bio: string | null;
  isFollowing?: boolean;
}

interface PaginatedUsers {
  users: UserListItem[];
  total: number;
  hasMore: boolean;
}

export class SocialService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Follow a user
   */
  async follow(followerId: string, followingId: string): Promise<Follow> {
    // Can't follow yourself
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if user exists
    const userToFollow = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!userToFollow) {
      throw new Error('User not found');
    }

    // Create follow relationship
    const follow = await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    return follow;
  }

  /**
   * Unfollow a user
   */
  async unfollow(followerId: string, followingId: string): Promise<void> {
    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  /**
   * Check if a user is following another
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
    return !!follow;
  }

  /**
   * Get followers of a user
   */
  async getFollowers(
    userId: string,
    pagination: PaginationInput,
    currentUserId?: string
  ): Promise<PaginatedUsers> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              avatar: true,
              bio: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { followingId: userId } }),
    ]);

    // Check if current user follows each follower
    let followingIds: Set<string> = new Set();
    if (currentUserId) {
      const following = await this.prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: followers.map((f) => f.follower.id) },
        },
        select: { followingId: true },
      });
      followingIds = new Set(following.map((f) => f.followingId));
    }

    const users: UserListItem[] = followers.map((f) => ({
      ...f.follower,
      isFollowing: followingIds.has(f.follower.id),
    }));

    return {
      users,
      total,
      hasMore: skip + limit < total,
    };
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(
    userId: string,
    pagination: PaginationInput,
    currentUserId?: string
  ): Promise<PaginatedUsers> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              avatar: true,
              bio: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);

    // Check if current user follows each user
    let followingIds: Set<string> = new Set();
    if (currentUserId) {
      const currentFollowing = await this.prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: following.map((f) => f.following.id) },
        },
        select: { followingId: true },
      });
      followingIds = new Set(currentFollowing.map((f) => f.followingId));
    }

    const users: UserListItem[] = following.map((f) => ({
      ...f.following,
      isFollowing: followingIds.has(f.following.id),
    }));

    return {
      users,
      total,
      hasMore: skip + limit < total,
    };
  }

  /**
   * Get public profile of a user
   */
  async getPublicProfile(userId: string, currentUserId?: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            stories: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      isFollowing = await this.isFollowing(currentUserId, userId);
    }

    return {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      avatar: user.avatar,
      bio: user.bio,
      region: user.region,
      isPublic: user.isPublic,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      storiesCount: user._count.stories,
      isFollowing: currentUserId ? isFollowing : undefined,
      createdAt: user.createdAt,
    };
  }

  /**
   * Get personalized feed (stories from users you follow)
   */
  async getFeed(userId: string, pagination: PaginationInput) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Get IDs of users being followed
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // Include own stories in feed
    const userIds = [...followingIds, userId];

    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        where: { userId: { in: userIds } },
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.story.count({ where: { userId: { in: userIds } } }),
    ]);

    // Check which stories the user has liked
    const likedStories = await this.prisma.like.findMany({
      where: {
        userId,
        storyId: { in: stories.map((s) => s.id) },
      },
      select: { storyId: true },
    });
    const likedIds = new Set(likedStories.map((l) => l.storyId));

    return {
      stories: stories.map((story) => ({
        id: story.id,
        description: story.description,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        thumbnailUrl: story.thumbnailUrl,
        duration: story.duration,
        location: story.location,
        views: story.views,
        createdAt: story.createdAt,
        user: story.user,
        _count: story._count,
        isLiked: likedIds.has(story.id),
      })),
      total,
      hasMore: skip + limit < total,
    };
  }

  /**
   * Get stories by a specific user
   */
  async getUserStories(userId: string, pagination: PaginationInput, currentUserId?: string) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.story.count({ where: { userId } }),
    ]);

    // Check which stories the current user has liked
    let likedIds = new Set<string>();
    if (currentUserId) {
      const likedStories = await this.prisma.like.findMany({
        where: {
          userId: currentUserId,
          storyId: { in: stories.map((s) => s.id) },
        },
        select: { storyId: true },
      });
      likedIds = new Set(likedStories.map((l) => l.storyId));
    }

    return {
      stories: stories.map((story) => ({
        id: story.id,
        description: story.description,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        thumbnailUrl: story.thumbnailUrl,
        duration: story.duration,
        location: story.location,
        views: story.views,
        createdAt: story.createdAt,
        user: story.user,
        _count: story._count,
        isLiked: likedIds.has(story.id),
      })),
      total,
      hasMore: skip + limit < total,
    };
  }
}
