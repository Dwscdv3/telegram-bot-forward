import { Context } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { enqueue } from '../util/queue.js';
import storage from '../storage.js';

export default async function ReactionForwardingMiddleware(
    ctx: Context<Update.MessageReactionUpdate>,
) {
    const newReactions = ctx.messageReaction.new_reaction
        .map((reaction: any): string => reaction.emoji || reaction.custom_emoji_id)
    const oldReactions = ctx.messageReaction.old_reaction
        .map((reaction: any): string => reaction.emoji || reaction.custom_emoji_id)
    const destinations = newReactions
        .filter(emoji => !oldReactions.includes(emoji))
        .flatMap(emoji => storage.reactionAssociations[emoji]);

    const chatId = ctx.chat.id;
    const mediaGroupId = storage.chats[chatId].mediaGroupIndex?.[ctx.msgId];
    const mediaGroup = storage.chats[chatId].mediaGroups?.[mediaGroupId!];
    mediaGroup?.sort((a, b) => a - b);

    for (const dest of destinations) {
        mediaGroup
            ? await enqueue(() => ctx.forwardMessages(dest, mediaGroup))
            : await enqueue(() => ctx.forwardMessage(dest));
    }
}
