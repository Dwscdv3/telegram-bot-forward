import { Context } from 'telegraf';
import { MediaGroup } from 'telegraf/typings/telegram-types.js';
import { Update, InputMedia } from 'typegram';
import config from '../config.js';
import { enqueue } from '../util/queue.js';

const pendingMediaGroups: { [media_group_id: string]: PendingMediaGroup } = {};

export default async function ForwardMiddleware(ctx: Context<Update.ChannelPostUpdate>) {
    const destinations = config.forward[ctx.chat.id] ?? [];
    if ('media_group_id' in ctx.channelPost && ctx.channelPost.media_group_id) {
        pendingMediaGroups[ctx.channelPost.media_group_id] ??= {
            time: Date.now(),
            ctx: <Context>ctx,
            chatId: ctx.chat.id,
            messageId: ctx.channelPost.message_id,
            destinations,
            media: [],
        };
        let type: 'photo' | 'video' | 'audio' | 'document';
        let media: string;
        if ('photo' in ctx.channelPost) {
            type = 'photo';
            media = ctx.channelPost.photo[ctx.channelPost.photo.length - 1].file_id;
        } else if ('video' in ctx.channelPost) {
            type = 'video';
            media = ctx.channelPost.video.file_id;
        } else if ('audio' in ctx.channelPost) {
            type = 'audio';
            media = ctx.channelPost.audio.file_id;
        } else if ('document' in ctx.channelPost) {
            type = 'document';
            media = ctx.channelPost.document.file_id;
        } else {
            throw new Error('Unexpected media type.');
        }
        pendingMediaGroups[ctx.channelPost.media_group_id].media.push({
            type,
            media,
            caption: ctx.channelPost.caption,
            caption_entities: ctx.channelPost.caption_entities,
        });
    } else {
        for (const dest of destinations) {
            enqueue(() => (<Context>ctx).forwardMessage(dest));
        }
    }
}

export const _sendMediaGroupTimer = setInterval(() => {
    for (const [id, { time, ctx, chatId, messageId, destinations, media }]
        of Object.entries(pendingMediaGroups)) {
        if (Date.now() - time > 1000) {
            delete pendingMediaGroups[id];
            for (const dest of destinations) {
                enqueue(() => ctx.telegram.sendMediaGroup(dest, media as MediaGroup));
                enqueue(() => ctx.telegram.sendMessage(dest,
                    `https://t.me/c/${-(chatId + 1e12)}/${messageId}`));
                // Fill up the queue to prevent API request flooding
                for (let i = 1; i < media.length; i++) {
                    enqueue(async () => undefined);
                }
            }
        }
    }
}, 100);

type PendingMediaGroup = {
    time: number;
    ctx: Context;
    chatId: number;
    messageId: number;
    destinations: number[];
    media: InputMedia[];
};
