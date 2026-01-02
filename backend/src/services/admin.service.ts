import { PrismaClient, UserRole, Prisma } from '@prisma/client';

export interface DashboardStats {
  totalUsers: number;
  totalStories: number;
  totalComments: number;
  totalLikes: number;
  totalCommunities: number;
  totalEvents: number;
  newUsersToday: number;
  newStoriesToday: number;
  activeUsersToday: number;
}

export interface AdminUser {
  id: string;
  email: string;
  nombre: string;
  apellido: string | null;
  avatar: string | null;
  role: UserRole;
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
  storiesCount: number;
  followersCount: number;
}

export interface ReportedContent {
  id: string;
  type: 'story' | 'comment';
  content: string;
  mediaUrl?: string;
  authorId: string;
  authorName: string;
  reportCount: number;
  createdAt: string;
}

export class AdminService {
  constructor(private prisma: PrismaClient) {}

  // Get dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalStories,
      totalComments,
      totalLikes,
      totalCommunities,
      totalEvents,
      newUsersToday,
      newStoriesToday,
      activeUsersToday,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.story.count(),
      this.prisma.comment.count(),
      this.prisma.like.count(),
      this.prisma.community.count(),
      this.prisma.event.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.story.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.activityLog.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: today } },
      }).then((groups) => groups.length),
    ]);

    return {
      totalUsers,
      totalStories,
      totalComments,
      totalLikes,
      totalCommunities,
      totalEvents,
      newUsersToday,
      newStoriesToday,
      activeUsersToday,
    };
  }

  // Get users with pagination and filters
  async getUsers(
    page: number = 1,
    limit: number = 20,
    filters: {
      search?: string;
      role?: UserRole;
      banned?: boolean;
    } = {}
  ): Promise<{ users: AdminUser[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = {};

    if (filters.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.banned !== undefined) {
      where.bannedAt = filters.banned ? { not: null } : null;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { stories: true, followers: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        avatar: user.avatar,
        role: user.role,
        bannedAt: user.bannedAt?.toISOString() || null,
        bannedReason: user.bannedReason,
        createdAt: user.createdAt.toISOString(),
        storiesCount: user._count.stories,
        followersCount: user._count.followers,
      })),
      total,
    };
  }

  // Change user role
  async changeUserRole(userId: string, newRole: UserRole): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
  }

  // Ban user
  async banUser(userId: string, reason: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        bannedAt: new Date(),
        bannedReason: reason,
      },
    });
  }

  // Unban user
  async unbanUser(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        bannedAt: null,
        bannedReason: null,
      },
    });
  }

  // Get content (stories) for moderation
  async getContent(
    page: number = 1,
    limit: number = 20,
    type: 'all' | 'recent' = 'recent'
  ): Promise<{ content: Array<{ id: string; description: string; mediaUrl: string; mediaType: string; authorId: string; authorName: string; likesCount: number; commentsCount: number; createdAt: string }>; total: number }> {
    const skip = (page - 1) * limit;
    const today = new Date();
    today.setDate(today.getDate() - 7); // Last 7 days for recent

    const where = type === 'recent' ? { createdAt: { gte: today } } : {};

    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, nombre: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      this.prisma.story.count({ where }),
    ]);

    return {
      content: stories.map((story) => ({
        id: story.id,
        description: story.description,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        authorId: story.user.id,
        authorName: story.user.nombre,
        likesCount: story._count.likes,
        commentsCount: story._count.comments,
        createdAt: story.createdAt.toISOString(),
      })),
      total,
    };
  }

  // Delete content (story)
  async deleteContent(storyId: string): Promise<void> {
    await this.prisma.story.delete({
      where: { id: storyId },
    });
  }

  // Get system reports/metrics
  async getReports(
    days: number = 30
  ): Promise<{
    userGrowth: Array<{ date: string; count: number }>;
    storyGrowth: Array<{ date: string; count: number }>;
    topCreators: Array<{ id: string; nombre: string; storiesCount: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get daily user signups
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    // Get daily stories
    const stories = await this.prisma.story.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    // Get top creators
    const topCreators = await this.prisma.user.findMany({
      orderBy: { stories: { _count: 'desc' } },
      take: 10,
      select: {
        id: true,
        nombre: true,
        _count: { select: { stories: true } },
      },
    });

    // Group by date
    const groupByDate = (items: Array<{ createdAt: Date }>): Array<{ date: string; count: number }> => {
      const groups: Record<string, number> = {};

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        groups[date.toISOString().split('T')[0]] = 0;
      }

      for (const item of items) {
        const dateStr = item.createdAt.toISOString().split('T')[0];
        if (groups[dateStr] !== undefined) {
          groups[dateStr]++;
        }
      }

      return Object.entries(groups).map(([date, count]) => ({ date, count }));
    };

    return {
      userGrowth: groupByDate(users),
      storyGrowth: groupByDate(stories),
      topCreators: topCreators.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        storiesCount: u._count.stories,
      })),
    };
  }
}
