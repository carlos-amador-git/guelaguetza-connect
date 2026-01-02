import { FastifyPluginAsync } from 'fastify';
import { AnalyticsService } from '../services/analytics.service.js';

const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  const analyticsService = new AnalyticsService(fastify.prisma);

  // Get my analytics
  fastify.get(
    '/my-stats',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const userId = request.user.id;
      const analytics = await analyticsService.getUserAnalytics(userId);
      return { success: true, data: analytics };
    }
  );

  // Get story stats
  fastify.get<{ Params: { id: string } }>(
    '/story/:id/stats',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = request.user.id;
      const { id: storyId } = request.params;

      const stats = await analyticsService.getStoryStats(storyId, userId);

      if (!stats) {
        return reply.status(404).send({ error: 'Historia no encontrada' });
      }

      return { success: true, data: stats };
    }
  );

  // Get trends
  fastify.get<{ Querystring: { days?: string } }>(
    '/trends',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const userId = request.user.id;
      const days = parseInt(request.query.days || '7', 10);
      const validDays = [7, 14, 30].includes(days) ? days : 7;

      const trends = await analyticsService.getTrends(userId, validDays);
      return { success: true, data: trends };
    }
  );

  // Get recent activity
  fastify.get<{ Querystring: { page?: string; limit?: string } }>(
    '/activity',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const userId = request.user.id;
      const page = parseInt(request.query.page || '1', 10);
      const limit = Math.min(parseInt(request.query.limit || '20', 10), 50);

      const result = await analyticsService.getRecentActivity(userId, page, limit);
      return { success: true, data: result };
    }
  );
};

export default analyticsRoutes;
