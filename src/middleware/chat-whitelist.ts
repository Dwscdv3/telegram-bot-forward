import { Context } from 'telegraf';
import storage from '../storage.js';

export default async function ReactionForwardingWhitelistMiddleware(
    ctx: Context,
    next: () => Promise<void>,
) {
    if (!ctx.chat?.id) return;
    if (!storage.chats[ctx.chat.id]?.reactionForwardingEnabled) return;
    await next();
}
