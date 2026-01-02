import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthUser } from '../plugins/auth.js';

// Middleware to require admin role
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = request.user as AuthUser;

  if (!user || user.role !== 'ADMIN') {
    return reply.status(403).send({
      error: 'Acceso denegado. Se requieren permisos de administrador.',
    });
  }
}

// Middleware to require moderator or admin role
export async function requireModerator(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = request.user as AuthUser;

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    return reply.status(403).send({
      error: 'Acceso denegado. Se requieren permisos de moderador.',
    });
  }
}

// Check if user is banned
export async function checkBanned(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = request.user as AuthUser;

  if (user?.bannedAt) {
    return reply.status(403).send({
      error: 'Tu cuenta ha sido suspendida.',
    });
  }
}
