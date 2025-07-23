import { Composer } from 'telegraf';
import config from '../config.js';
import storage from '../storage.js';

const { command, acl } = Composer;

const adminCommands = new Composer();

adminCommands.use(acl(config.admins,
    command('enable_reaction_forwarding', async ctx => {
        storage.chats[ctx.chat.id] ??= {};
        storage.chats[ctx.chat.id].reactionForwardingEnabled = true;
        await ctx.reply('Enabled reaction forwarding for this chat.');
    }),
    command('disable_reaction_forwarding', async ctx => {
        storage.chats[ctx.chat.id] ??= {};
        storage.chats[ctx.chat.id].reactionForwardingEnabled = false;
        await ctx.reply('Disabled reaction forwarding for this chat.');
    }),
    command('assoc_reaction_forwarding_emoji', async ctx => {
        const ValidEmojis = [
            '❤', '👍', '👎', '🔥', '🥰', '👏', '😁', '🤔', '🤯', '😱',
            '🤬', '😢', '🎉', '🤩', '🤮', '💩', '🙏', '👌', '🕊', '🤡',
            '🥱', '🥴', '😍', '🐳', '❤‍🔥', '🌚', '🌭', '💯', '🤣', '⚡',
            '🍌', '🏆', '💔', '🤨', '😐', '🍓', '🍾', '💋', '🖕', '😈',
            '😴', '😭', '🤓', '👻', '👨‍💻', '👀', '🎃', '🙈', '😇', '😨',
            '🤝', '✍', '🤗', '🫡', '🎅', '🎄', '☃', '💅', '🤪', '🗿',
            '🆒', '💘', '🙉', '🦄', '😘', '💊', '🙊', '😎', '👾', '🤷‍♂',
            '🤷', '🤷‍♀', '😡',
        ];
        const emojis = ValidEmojis.filter(emoji => ctx.text.includes(emoji));
        const customEmojis = ctx.entities()
            .filter(entity => entity.type == 'custom_emoji')
            .map(entity => entity.custom_emoji_id);
        for (const emoji of [...emojis, ...customEmojis]) {
            storage.reactionAssociations[emoji] ??= [];
            storage.reactionAssociations[emoji].push(ctx.chat.id);
        }
        const associatedEmojis = Object.keys(storage.reactionAssociations)
            .filter(key => storage.reactionAssociations[key]?.includes(ctx.chat.id));
        await ctx.reply(`Done. This chat is currently associated with:
(bots without TON collectible usernames can't send custom emojis)
${associatedEmojis.join('\n')}`);
    }),
    command('clear_reaction_forwarding_emoji', async ctx => {
        for (const chats of Object.values(storage.reactionAssociations)) {
            removeAll(chats, ctx.chat.id);
        }
        await ctx.reply('Done. This chat is no longer associated with any reaction emojis.')
    }),
));

function removeAll<T>(array: T[], element: T) {
    for (let i = array.length - 1; i >= 0; i--) {
        if (array[i] === element) {
            array.splice(i, 1);
        }
    }
}

export default adminCommands;
