import { PrismaClient, NotificationType, Notification, Prisma } from '@prisma/client';
import { WebSocket, RawData } from 'ws';

interface PaginationInput {
  page: number;
  limit: number;
}

interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: unknown;
  read: boolean;
  createdAt: Date;
}

// Store active WebSocket connections
const activeConnections = new Map<string, WebSocket>();

export class NotificationService {
  constructor(private prisma: PrismaClient) {}

  // Register WebSocket connection for user
  registerConnection(userId: string, ws: WebSocket): void {
    // Close existing connection if any
    const existing = activeConnections.get(userId);
    if (existing && existing.readyState === WebSocket.OPEN) {
      existing.close();
    }
    activeConnections.set(userId, ws);
  }

  // Unregister WebSocket connection
  unregisterConnection(userId: string): void {
    activeConnections.delete(userId);
  }

  // Send notification via WebSocket
  sendRealtime(userId: string, notification: NotificationResponse): void {
    const ws = activeConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'notification',
        data: notification,
      }));
    }
  }

  // Create and send notification
  async create(userId: string, data: NotificationData): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data,
      },
    });

    // Send real-time notification
    this.sendRealtime(userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      read: notification.read,
      createdAt: notification.createdAt,
    });

    return notification;
  }

  // Notify new follower
  async notifyNewFollower(followerId: string, followingId: string): Promise<void> {
    const follower = await this.prisma.user.findUnique({
      where: { id: followerId },
      select: { nombre: true, avatar: true },
    });

    if (!follower) return;

    await this.create(followingId, {
      type: 'NEW_FOLLOWER',
      title: 'Nuevo seguidor',
      body: `${follower.nombre} comenzó a seguirte`,
      data: { userId: followerId, avatar: follower.avatar },
    });
  }

  // Notify like on story
  async notifyLike(likerId: string, storyId: string): Promise<void> {
    const [liker, story] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: likerId },
        select: { nombre: true, avatar: true },
      }),
      this.prisma.story.findUnique({
        where: { id: storyId },
        select: { userId: true, description: true },
      }),
    ]);

    if (!liker || !story || story.userId === likerId) return;

    await this.create(story.userId, {
      type: 'LIKE',
      title: 'Nueva reacción',
      body: `A ${liker.nombre} le gustó tu historia`,
      data: { userId: likerId, storyId, avatar: liker.avatar },
    });
  }

  // Notify comment on story
  async notifyComment(commenterId: string, storyId: string, commentText: string): Promise<void> {
    const [commenter, story] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: commenterId },
        select: { nombre: true, avatar: true },
      }),
      this.prisma.story.findUnique({
        where: { id: storyId },
        select: { userId: true },
      }),
    ]);

    if (!commenter || !story || story.userId === commenterId) return;

    await this.create(story.userId, {
      type: 'COMMENT',
      title: 'Nuevo comentario',
      body: `${commenter.nombre}: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
      data: { userId: commenterId, storyId, avatar: commenter.avatar },
    });
  }

  // Notify badge unlocked
  async notifyBadgeUnlocked(userId: string, badgeName: string, badgeIcon: string): Promise<void> {
    await this.create(userId, {
      type: 'BADGE_UNLOCKED',
      title: 'Nuevo logro desbloqueado',
      body: `Obtuviste el badge "${badgeName}"`,
      data: { badgeName, badgeIcon },
    });
  }

  // Notify level up
  async notifyLevelUp(userId: string, newLevel: number): Promise<void> {
    await this.create(userId, {
      type: 'LEVEL_UP',
      title: 'Subiste de nivel',
      body: `Ahora eres nivel ${newLevel}`,
      data: { level: newLevel },
    });
  }

  // Get user notifications
  async getNotifications(
    userId: string,
    pagination: PaginationInput
  ): Promise<{ notifications: NotificationResponse[]; total: number; unreadCount: number }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        read: n.read,
        createdAt: n.createdAt,
      })),
      total,
      unreadCount,
    };
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  // Mark notifications as read
  async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId, // Ensure user owns these notifications
      },
      data: { read: true },
    });
  }

  // Mark all as read
  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  // Delete notification
  async delete(userId: string, notificationId: string): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }
}
