import { FastifyPluginAsync } from 'fastify';
import { SocialService } from '../services/social.service.js';
import {
  followParamsSchema,
  paginationQuerySchema,
  FollowParams,
  PaginationQuery,
} from '../schemas/social.schema.js';

const socialRoutes: FastifyPluginAsync = async (fastify) => {
  const socialService = new SocialService(fastify.prisma);

  // Follow a user
  fastify.post<{ Params: FollowParams }>(
    '/users/:userId/follow',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: followParamsSchema,
      },
    },
    async (request, reply) => {
      const { userId: followingId } = request.params;
      const followerId = request.user.userId;

      try {
        const follow = await socialService.follow(followerId, followingId);
        return reply.status(201).send({
          success: true,
          data: follow,
        });
      } catch (error) {
        if ((error as Error).message === 'Cannot follow yourself') {
          return reply.status(400).send({
            success: false,
            error: 'No puedes seguirte a ti mismo',
          });
        }
        if ((error as Error).message === 'User not found') {
          return reply.status(404).send({
            success: false,
            error: 'Usuario no encontrado',
          });
        }
        // Unique constraint violation (already following)
        if ((error as any).code === 'P2002') {
          return reply.status(409).send({
            success: false,
            error: 'Ya sigues a este usuario',
          });
        }
        throw error;
      }
    }
  );

  // Unfollow a user
  fastify.delete<{ Params: FollowParams }>(
    '/users/:userId/follow',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: followParamsSchema,
      },
    },
    async (request, reply) => {
      const { userId: followingId } = request.params;
      const followerId = request.user.userId;

      try {
        await socialService.unfollow(followerId, followingId);
        return reply.status(200).send({
          success: true,
          message: 'Dejaste de seguir al usuario',
        });
      } catch (error) {
        // Not found
        if ((error as any).code === 'P2025') {
          return reply.status(404).send({
            success: false,
            error: 'No sigues a este usuario',
          });
        }
        throw error;
      }
    }
  );

  // Check if following a user
  fastify.get<{ Params: FollowParams }>(
    '/users/:userId/is-following',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: followParamsSchema,
      },
    },
    async (request, reply) => {
      const { userId: followingId } = request.params;
      const followerId = request.user.userId;

      const isFollowing = await socialService.isFollowing(followerId, followingId);
      return reply.send({
        success: true,
        data: { isFollowing },
      });
    }
  );

  // Get user's followers
  fastify.get<{ Params: FollowParams; Querystring: PaginationQuery }>(
    '/users/:userId/followers',
    {
      schema: {
        params: followParamsSchema,
        querystring: paginationQuerySchema,
      },
    },
    async (request, reply) => {
      const { userId } = request.params;
      const pagination = request.query;
      const currentUserId = request.user?.userId;

      const result = await socialService.getFollowers(userId, pagination, currentUserId);
      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // Get users that a user is following
  fastify.get<{ Params: FollowParams; Querystring: PaginationQuery }>(
    '/users/:userId/following',
    {
      schema: {
        params: followParamsSchema,
        querystring: paginationQuerySchema,
      },
    },
    async (request, reply) => {
      const { userId } = request.params;
      const pagination = request.query;
      const currentUserId = request.user?.userId;

      const result = await socialService.getFollowing(userId, pagination, currentUserId);
      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // Get user's public profile
  fastify.get<{ Params: FollowParams }>(
    '/users/:userId/profile',
    {
      schema: {
        params: followParamsSchema,
      },
    },
    async (request, reply) => {
      const { userId } = request.params;
      const currentUserId = request.user?.userId;

      try {
        const profile = await socialService.getPublicProfile(userId, currentUserId);
        return reply.send({
          success: true,
          data: profile,
        });
      } catch (error) {
        if ((error as Error).message === 'User not found') {
          return reply.status(404).send({
            success: false,
            error: 'Usuario no encontrado',
          });
        }
        throw error;
      }
    }
  );

  // Get user's stories
  fastify.get<{ Params: FollowParams; Querystring: PaginationQuery }>(
    '/users/:userId/stories',
    {
      schema: {
        params: followParamsSchema,
        querystring: paginationQuerySchema,
      },
    },
    async (request, reply) => {
      const { userId } = request.params;
      const pagination = request.query;
      const currentUserId = request.user?.userId;

      const result = await socialService.getUserStories(userId, pagination, currentUserId);
      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // Get personalized feed (stories from users you follow)
  fastify.get<{ Querystring: PaginationQuery }>(
    '/feed',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: paginationQuerySchema,
      },
    },
    async (request, reply) => {
      const userId = request.user.userId;
      const pagination = request.query;

      const result = await socialService.getFeed(userId, pagination);
      return reply.send({
        success: true,
        data: result,
      });
    }
  );
};

export default socialRoutes;
