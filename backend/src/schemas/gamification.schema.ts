import { z } from 'zod';

export const userIdParamsSchema = z.object({
  userId: z.string().cuid(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// XP values for different actions
export const XP_VALUES = {
  CREATE_STORY: 50,
  RECEIVE_LIKE: 5,
  RECEIVE_COMMENT: 10,
  NEW_FOLLOWER: 15,
  DAILY_CHECK_IN: 10,
  UNLOCK_BADGE: 25,
} as const;

// Level thresholds
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2100,   // Level 7
  2800,   // Level 8
  3600,   // Level 9
  4500,   // Level 10
  5500,   // Level 11
  6600,   // Level 12
  7800,   // Level 13
  9100,   // Level 14
  10500,  // Level 15
] as const;

export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getXpForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (level - LEVEL_THRESHOLDS.length + 1) * 1500;
  }
  return LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
}
