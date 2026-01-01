import { FastifyPluginAsync } from 'fastify';
import { NotificationService } from '../services/notification.service.js';
import {
  notificationIdParamsSchema,
  paginationQuerySchema,
  markReadBodySchema,
  NotificationIdParams,
  PaginationQuery,
  MarkReadBody,
} from '../schemas/notification.schema.js';

const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  const notificationService = new NotificationService(fastify.prisma);

  // WebSocket connection for real-time notifications
  fastify.get(
    '/ws',
    { websocket: true },
    async (socket, request) => {
      // Try to authenticate from query param
      const token = (request.query as { token?: string }).token;

      if (!token) {
        socket.close(4001, 'Token required');
        return;
      }

      try {
        const decoded = fastify.jwt.verify<{ userId: string }>(token);
        const userId = decoded.userId;

        // Register connection
        notificationService.registerConnection(userId, socket);

        // Send unread count on connect
        const unreadCount = await notificationService.getUnreadCount(userId);
        socket.send(JSON.stringify({
          type: 'connected',
          data: { unreadCount },
        }));

        // Handle disconnect
        socket.on('close', () => {
          notificationService.unregisterConnection(userId);
        });

        // Handle incoming messages (for future features like marking as read)
        socket.on('message', async (message: Buffer) => {
          try {
            const data = JSON.parse(message.toString());

            if (data.type === 'markRead' && data.notificationIds) {
              await notificationService.markAsRead(userId, data.notificationIds);
            }
          } catch {
            // Ignore malformed messages
          }
        });
      } catch {
        socket.close(4002, 'Invalid token');
      }
    }
  );

  // Get user's notifications
  fastify.get<{ Querystring: PaginationQuery }>(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: paginationQuerySchema,
      },
    },
    async (request, reply) => {
      const userId = request.user.userId;
      const pagination = request.query;

      const result = await notificationService.getNotifications(userId, pagination);
      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // Get unread count
  fastify.get(
    '/unread-count',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.userId;
      const count = await notificationService.getUnreadCount(userId);

      return reply.send({
        success: true,
        data: { count },
      });
    }
  );

  // Mark notifications as read
  fastify.post<{ Body: MarkReadBody }>(
    '/mark-read',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: markReadBodySchema,
      },
    },
    async (request, reply) => {
      const userId = request.user.userId;
      const { notificationIds } = request.body;

      await notificationService.markAsRead(userId, notificationIds);
      return reply.send({
        success: true,
        message: 'Notificaciones marcadas como leídas',
      });
    }
  );

  // Mark all as read
  fastify.post(
    '/mark-all-read',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.userId;

      await notificationService.markAllAsRead(userId);
      return reply.send({
        success: true,
        message: 'Todas las notificaciones marcadas como leídas',
      });
    }
  );

  // Delete a notification
  fastify.delete<{ Params: NotificationIdParams }>(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: notificationIdParamsSchema,
      },
    },
    async (request, reply) => {
      const userId = request.user.userId;
      const { id } = request.params;

      await notificationService.delete(userId, id);
      return reply.send({
        success: true,
        message: 'Notificación eliminada',
      });
    }
  );
};

export default notificationsRoutes;
