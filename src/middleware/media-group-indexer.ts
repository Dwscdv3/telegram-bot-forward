import { Context } from 'telegraf';
import storage from '../storage.js';

export default async function MediaGroupIndexerMiddleware(
    ctx: Context,
    next: () => Promise<void>,
) {
    if (ctx.chat?.id &&
        ctx.msg &&
        ctx.msgId &&
        'media_group_id' in ctx.msg &&
        ctx.msg.media_group_id) {

        const chatId = ctx.chat.id;
        const mediaGroupId = ctx.msg.media_group_id;

        storage.chats[chatId] ??= {};
        storage.chats[chatId].mediaGroups ??= {};
        storage.chats[chatId].mediaGroupIndex ??= {};
        storage.chats[chatId].mediaGroups[mediaGroupId] ??= [];

        storage.chats[chatId].mediaGroups[mediaGroupId].push(ctx.msgId);
        storage.chats[chatId].mediaGroupIndex[ctx.msgId] = mediaGroupId;
    }

    await next();
}
