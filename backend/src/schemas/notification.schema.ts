import { z } from 'zod';

export const notificationIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const markReadBodySchema = z.object({
  notificationIds: z.array(z.string().cuid()).min(1),
});

export type NotificationIdParams = z.infer<typeof notificationIdParamsSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type MarkReadBody = z.infer<typeof markReadBodySchema>;
