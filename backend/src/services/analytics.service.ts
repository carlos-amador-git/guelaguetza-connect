import { PrismaClient, Prisma } from '@prisma/client';

export interface UserAnalytics {
  totalStories: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  followersCount: number;
  followingCount: number;
  engagementRate: number;
  avgLikesPerStory: number;
  avgCommentsPerStory: number;
  topPerformingStories: StoryStats[];
}

export interface StoryStats {
  id: string;
  description: string;
  mediaUrl: string;
  mediaType: string;
  thumbnailUrl: string | null;
  views: number;
  likes: number;
  comments: number;
  engagementRate: number;
  createdAt: string;
}

export interface TrendData {
  date: string;
  likes: number;
  comments: number;
  views: number;
  followers: number;
}

export interface TrendsResponse {
  daily: TrendData[];
  totals: {
    likes: number;
    comments: number;
    views: number;
    newFollowers: number;
  };
  growth: {
    likesChange: number;
    commentsChange: number;
    viewsChange: number;
    followersChange: number;
  };
}

export type ActivityAction =
  | 'CREATE_STORY'
  | 'LIKE'
  | 'UNLIKE'
  | 'COMMENT'
  | 'FOLLOW'
  | 'UNFOLLOW'
  | 'VIEW_STORY'
  | 'JOIN_COMMUNITY'
  | 'LEAVE_COMMUNITY'
  | 'CREATE_COMMUNITY_POST'
  | 'RSVP_EVENT'
  | 'SEND_MESSAGE';

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  // Log an activity
  async logActivity(
    userId: string,
    action: ActivityAction,
    targetType?: string,
    targetId?: string,
    metadata?: Prisma.InputJsonValue
  ): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        userId,
        action,
        targetType,
        targetId,
        metadata,
      },
    });
  }

  // Get user analytics
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    const [
      stories,
      totalLikes,
      totalComments,
      followersCount,
      followingCount,
    ] = await Promise.all([
      this.prisma.story.findMany({
        where: { userId },
        include: {
          _count: {
            select: { likes: true, comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.like.count({
        where: { story: { userId } },
      }),
      this.prisma.comment.count({
        where: { story: { userId } },
      }),
      this.prisma.follow.count({
        where: { followingId: userId },
      }),
      this.prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    const totalStories = stories.length;
    const totalViews = stories.reduce((sum, s) => sum + s.views, 0);

    // Calculate engagement rate (likes + comments / views * 100)
    const engagementRate =
      totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

    const avgLikesPerStory = totalStories > 0 ? totalLikes / totalStories : 0;
    const avgCommentsPerStory = totalStories > 0 ? totalComments / totalStories : 0;

    // Top 5 performing stories by engagement
    const topPerformingStories: StoryStats[] = stories
      .map((story) => {
        const likes = story._count.likes;
        const comments = story._count.comments;
        const storyEngagement =
          story.views > 0 ? ((likes + comments) / story.views) * 100 : 0;

        return {
          id: story.id,
          description: story.description.slice(0, 100),
          mediaUrl: story.mediaUrl,
          mediaType: story.mediaType,
          thumbnailUrl: story.thumbnailUrl,
          views: story.views,
          likes,
          comments,
          engagementRate: Math.round(storyEngagement * 100) / 100,
          createdAt: story.createdAt.toISOString(),
        };
      })
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 5);

    return {
      totalStories,
      totalLikes,
      totalComments,
      totalViews,
      followersCount,
      followingCount,
      engagementRate: Math.round(engagementRate * 100) / 100,
      avgLikesPerStory: Math.round(avgLikesPerStory * 100) / 100,
      avgCommentsPerStory: Math.round(avgCommentsPerStory * 100) / 100,
      topPerformingStories,
    };
  }

  // Get story stats
  async getStoryStats(storyId: string, userId: string): Promise<StoryStats | null> {
    const story = await this.prisma.story.findFirst({
      where: { id: storyId, userId },
      include: {
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    if (!story) return null;

    const likes = story._count.likes;
    const comments = story._count.comments;
    const engagementRate =
      story.views > 0 ? ((likes + comments) / story.views) * 100 : 0;

    return {
      id: story.id,
      description: story.description,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      thumbnailUrl: story.thumbnailUrl,
      views: story.views,
      likes,
      comments,
      engagementRate: Math.round(engagementRate * 100) / 100,
      createdAt: story.createdAt.toISOString(),
    };
  }

  // Get trends for last N days
  async getTrends(userId: string, days: number = 7): Promise<TrendsResponse> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    // Get user's story IDs for filtering
    const userStoryIds = (
      await this.prisma.story.findMany({
        where: { userId },
        select: { id: true },
      })
    ).map((s) => s.id);

    // Get current period data
    const [likes, comments, followers, activityLogs] = await Promise.all([
      this.prisma.like.findMany({
        where: {
          storyId: { in: userStoryIds },
          createdAt: { gte: startDate },
        },
        select: { createdAt: true },
      }),
      this.prisma.comment.findMany({
        where: {
          storyId: { in: userStoryIds },
          createdAt: { gte: startDate },
        },
        select: { createdAt: true },
      }),
      this.prisma.follow.findMany({
        where: {
          followingId: userId,
          createdAt: { gte: startDate },
        },
        select: { createdAt: true },
      }),
      this.prisma.activityLog.findMany({
        where: {
          targetType: 'STORY',
          targetId: { in: userStoryIds },
          action: 'VIEW_STORY',
          createdAt: { gte: startDate },
        },
        select: { createdAt: true },
      }),
    ]);

    // Get previous period data for comparison
    const [prevLikes, prevComments, prevFollowers] = await Promise.all([
      this.prisma.like.count({
        where: {
          storyId: { in: userStoryIds },
          createdAt: { gte: previousStartDate, lt: startDate },
        },
      }),
      this.prisma.comment.count({
        where: {
          storyId: { in: userStoryIds },
          createdAt: { gte: previousStartDate, lt: startDate },
        },
      }),
      this.prisma.follow.count({
        where: {
          followingId: userId,
          createdAt: { gte: previousStartDate, lt: startDate },
        },
      }),
    ]);

    // Group by day
    const daily: TrendData[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dateStr = date.toISOString().split('T')[0];

      daily.push({
        date: dateStr,
        likes: likes.filter(
          (l) => l.createdAt >= date && l.createdAt < nextDate
        ).length,
        comments: comments.filter(
          (c) => c.createdAt >= date && c.createdAt < nextDate
        ).length,
        views: activityLogs.filter(
          (a) => a.createdAt >= date && a.createdAt < nextDate
        ).length,
        followers: followers.filter(
          (f) => f.createdAt >= date && f.createdAt < nextDate
        ).length,
      });
    }

    const totals = {
      likes: likes.length,
      comments: comments.length,
      views: activityLogs.length,
      newFollowers: followers.length,
    };

    // Calculate growth percentages
    const calcGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const growth = {
      likesChange: calcGrowth(totals.likes, prevLikes),
      commentsChange: calcGrowth(totals.comments, prevComments),
      viewsChange: 0, // No previous view data in this implementation
      followersChange: calcGrowth(totals.newFollowers, prevFollowers),
    };

    return { daily, totals, growth };
  }

  // Get recent activity for a user
  async getRecentActivity(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ activities: Array<{ id: string; action: string; targetType: string | null; targetId: string | null; createdAt: string }>; total: number }> {
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          createdAt: true,
        },
      }),
      this.prisma.activityLog.count({ where: { userId } }),
    ]);

    return {
      activities: activities.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
      total,
    };
  }
}
