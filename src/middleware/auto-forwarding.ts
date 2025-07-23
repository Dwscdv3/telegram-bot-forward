import { Context } from 'telegraf';
import config from '../config.js';
import { enqueue } from '../util/queue.js';

const pendingMediaGroups: { [media_group_id: string]: PendingMediaGroup } = {};

export default async function AutoForwardingMiddleware(
    ctx: Context,
    next: () => Promise<void>,
) {
    if (!ctx.chat) return;
    if (!ctx.msgId) return;

    const destinations = config.forward[ctx.chat.id] ?? [];
    if ('media_group_id' in ctx.msg && ctx.msg.media_group_id) {
        pendingMediaGroups[ctx.msg.media_group_id] ??= {
            time: Date.now(),
            ctx: ctx as Context,
            msgIds: [],
            destinations,
        };
        pendingMediaGroups[ctx.msg.media_group_id].msgIds.push(ctx.msgId);
    } else {
        for (const dest of destinations) {
            await enqueue(() => ctx.forwardMessage(dest));
        }
    }

    await next();
}

export const _sendMediaGroupTimer = setInterval(async () => {
    for (const [id, { time, ctx, msgIds: messageIds, destinations }]
        of Object.entries(pendingMediaGroups)) {
        if (Date.now() - time > 2000) {
            delete pendingMediaGroups[id];
            for (const dest of destinations) {
                await enqueue(() => ctx.forwardMessages(dest, messageIds));
            }
        }
    }
}, 100);

type PendingMediaGroup = {
    time: number;
    ctx: Context;
    msgIds: number[];
    destinations: number[];
};
