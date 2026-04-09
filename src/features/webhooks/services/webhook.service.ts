import crypto from 'crypto';
import prisma from '@/lib/prisma';

export const webhookService = {
  async create(orgId: string, data: { url: string; events: string[] }) {
    const secret = crypto.randomBytes(32).toString('hex');

    return prisma.webhook.create({
      data: {
        orgId,
        url: data.url,
        secret,
        events: data.events,
      },
    });
  },

  async list(orgId: string) {
    return prisma.webhook.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async get(orgId: string, webhookId: string) {
    return prisma.webhook.findFirst({
      where: { id: webhookId, orgId },
    });
  },

  async update(orgId: string, webhookId: string, data: { url?: string; events?: string[]; isActive?: boolean }) {
    const webhook = await prisma.webhook.findFirst({ where: { id: webhookId, orgId } });
    if (!webhook) return null;

    return prisma.webhook.update({
      where: { id: webhookId },
      data,
    });
  },

  async delete(orgId: string, webhookId: string) {
    const webhook = await prisma.webhook.findFirst({ where: { id: webhookId, orgId } });
    if (!webhook) return null;

    return prisma.webhook.delete({ where: { id: webhookId } });
  },

  /**
   * Fire webhooks for an event. Runs async — does not block the caller.
   */
  async fire(orgId: string, event: string, payload: Record<string, unknown>) {
    const webhooks = await prisma.webhook.findMany({
      where: { orgId, isActive: true, events: { has: event } },
    });

    for (const webhook of webhooks) {
      const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
      const signature = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex');

      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
        },
        body,
        signal: AbortSignal.timeout(10000),
      })
        .then(async (res) => {
          if (res.ok) {
            await prisma.webhook.update({
              where: { id: webhook.id },
              data: { lastFiredAt: new Date(), failCount: 0 },
            });
          } else {
            await incrementFailCount(webhook.id, webhook.failCount);
          }
        })
        .catch(async () => {
          await incrementFailCount(webhook.id, webhook.failCount);
        });
    }
  },
};

async function incrementFailCount(webhookId: string, currentCount: number) {
  const newCount = currentCount + 1;
  await prisma.webhook.update({
    where: { id: webhookId },
    data: {
      failCount: newCount,
      // Auto-disable after 10 consecutive failures
      ...(newCount >= 10 ? { isActive: false } : {}),
    },
  });
}
