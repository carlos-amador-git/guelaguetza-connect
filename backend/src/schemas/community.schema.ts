import { z } from 'zod';

export const createCommunitySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
});

export const updateCommunitySchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  imageUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
});

export const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional().nullable(),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;

// Generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}
