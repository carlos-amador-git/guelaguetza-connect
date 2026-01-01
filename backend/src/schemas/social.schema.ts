import { z } from 'zod';

export const followParamsSchema = z.object({
  userId: z.string().min(1),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const userProfileResponseSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellido: z.string().nullable(),
  avatar: z.string().nullable(),
  bio: z.string().nullable(),
  region: z.string().nullable(),
  isPublic: z.boolean(),
  followersCount: z.number(),
  followingCount: z.number(),
  storiesCount: z.number(),
  isFollowing: z.boolean().optional(),
  createdAt: z.date(),
});

export const userListItemSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellido: z.string().nullable(),
  avatar: z.string().nullable(),
  bio: z.string().nullable(),
  isFollowing: z.boolean().optional(),
});

export type FollowParams = z.infer<typeof followParamsSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;
export type UserListItem = z.infer<typeof userListItemSchema>;
