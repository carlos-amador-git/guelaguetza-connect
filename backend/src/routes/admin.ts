import { FastifyPluginAsync } from 'fastify';
import { AdminService } from '../services/admin.service.js';
import { requireAdmin, requireModerator } from '../middleware/admin.js';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const changeRoleSchema = z.object({
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
});

const banUserSchema = z.object({
  reason: z.string().min(1).max(500),
});

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const adminService = new AdminService(fastify.prisma);

  // Get dashboard stats
  fastify.get(
    '/dashboard',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async () => {
      const stats = await adminService.getDashboardStats();
      return { success: true, data: stats };
    }
  );

  // Get users list
  fastify.get<{
    Querystring: {
      page?: string;
      limit?: string;
      search?: string;
      role?: string;
      banned?: string;
    };
  }>(
    '/users',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request) => {
      const page = parseInt(request.query.page || '1', 10);
      const limit = Math.min(parseInt(request.query.limit || '20', 10), 100);
      const { search, role, banned } = request.query;

      const result = await adminService.getUsers(page, limit, {
        search,
        role: role as UserRole | undefined,
        banned: banned ? banned === 'true' : undefined,
      });

      return { success: true, data: result };
    }
  );

  // Change user role
  fastify.put<{ Params: { id: string }; Body: { role: string } }>(
    '/users/:id/role',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const { id: userId } = request.params;

      const parsed = changeRoleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Rol inválido' });
      }

      // Prevent self-demotion
      if (userId === request.user.id) {
        return reply.status(400).send({ error: 'No puedes cambiar tu propio rol' });
      }

      await adminService.changeUserRole(userId, parsed.data.role as UserRole);
      return { success: true, message: 'Rol actualizado' };
    }
  );

  // Ban user
  fastify.put<{ Params: { id: string }; Body: { reason: string } }>(
    '/users/:id/ban',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request, reply) => {
      const { id: userId } = request.params;

      const parsed = banUserSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Razón requerida' });
      }

      // Prevent self-ban
      if (userId === request.user.id) {
        return reply.status(400).send({ error: 'No puedes banearte a ti mismo' });
      }

      await adminService.banUser(userId, parsed.data.reason);
      return { success: true, message: 'Usuario baneado' };
    }
  );

  // Unban user
  fastify.delete<{ Params: { id: string } }>(
    '/users/:id/ban',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request) => {
      const { id: userId } = request.params;
      await adminService.unbanUser(userId);
      return { success: true, message: 'Usuario desbaneado' };
    }
  );

  // Get content for moderation
  fastify.get<{ Querystring: { page?: string; limit?: string; type?: string } }>(
    '/content',
    { preHandler: [fastify.authenticate, requireModerator] },
    async (request) => {
      const page = parseInt(request.query.page || '1', 10);
      const limit = Math.min(parseInt(request.query.limit || '20', 10), 50);
      const type = (request.query.type || 'recent') as 'all' | 'recent';

      const result = await adminService.getContent(page, limit, type);
      return { success: true, data: result };
    }
  );

  // Delete content (moderate)
  fastify.delete<{ Params: { id: string } }>(
    '/content/:id',
    { preHandler: [fastify.authenticate, requireModerator] },
    async (request) => {
      const { id: storyId } = request.params;
      await adminService.deleteContent(storyId);
      return { success: true, message: 'Contenido eliminado' };
    }
  );

  // Get reports/metrics
  fastify.get<{ Querystring: { days?: string } }>(
    '/reports',
    { preHandler: [fastify.authenticate, requireAdmin] },
    async (request) => {
      const days = parseInt(request.query.days || '30', 10);
      const validDays = [7, 14, 30, 60, 90].includes(days) ? days : 30;

      const reports = await adminService.getReports(validDays);
      return { success: true, data: reports };
    }
  );
};

export default adminRoutes;
