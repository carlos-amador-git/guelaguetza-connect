import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  saveSubscription,
  removeSubscription,
  sendNotificationToAll,
  sendNotificationToUser,
  getVapidPublicKey,
} from '../services/push.service.js';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

const sendNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  url: z.string().optional(),
  userId: z.string().optional(),
});

export default async function pushRoutes(app: FastifyInstance) {
  // Get VAPID public key
  app.get('/vapid-key', async (_request: FastifyRequest, reply: FastifyReply) => {
    const key = getVapidPublicKey();
    if (!key) {
      return reply.status(500).send({ error: 'VAPID keys not configured' });
    }
    return { publicKey: key };
  });

  // Subscribe to push notifications
  app.post('/subscribe', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = subscriptionSchema.parse(request.body);

    // Try to get user ID from token if authenticated
    let userId: string | undefined;
    try {
      const auth = request.headers.authorization;
      if (auth?.startsWith('Bearer ')) {
        const token = auth.slice(7);
        const decoded = app.jwt.decode(token) as { id: string } | null;
        userId = decoded?.id;
      }
    } catch {
      // Ignore auth errors, allow anonymous subscriptions
    }

    await saveSubscription(app.prisma, body, userId);

    return reply.status(201).send({ message: 'Subscription saved' });
  });

  // Unsubscribe from push notifications
  app.post('/unsubscribe', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = z.object({ endpoint: z.string().url() }).parse(request.body);

    await removeSubscription(app.prisma, body.endpoint);

    return { message: 'Subscription removed' };
  });

  // Send notification (admin only - in production, add proper auth)
  app.post('/send', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = sendNotificationSchema.parse(request.body);

    let result;
    if (body.userId) {
      result = await sendNotificationToUser(app.prisma, body.userId, {
        title: body.title,
        body: body.body,
        url: body.url,
      });
    } else {
      result = await sendNotificationToAll(app.prisma, {
        title: body.title,
        body: body.body,
        url: body.url,
      });
    }

    return {
      message: 'Notifications sent',
      success: result.success,
      failed: result.failed,
    };
  });
}
