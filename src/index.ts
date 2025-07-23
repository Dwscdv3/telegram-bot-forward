import { Composer, Context, Telegraf, TelegramError } from 'telegraf';
import config from './config.js';
import queue from './util/queue.js';
import ErrorHandlerMiddleware from './middleware/error-handler.js';
import ReactionForwardingWhitelistMiddleware from './middleware/reaction-forwarding-whitelist.js';
import MediaGroupIndexerMiddleware from './middleware/media-group-indexer.js';
import AutoForwardingMiddleware, { _sendMediaGroupTimer } from './middleware/auto-forwarding.js';
import ReactionForwardingMiddleware from './middleware/reaction-forwarding.js';
import adminCommands from './command/admin.js';

const autoForwardingChatIds = new Set(Object.keys(config.forward).map(parseInt));

const bot = new Telegraf(config.token);
const { compose, on, branch, optional, admin } = Composer;

bot.use(
    ErrorHandlerMiddleware,
    branch(isCommand,
        adminCommands,
        compose([
            optional(isAutoForwardingChats,
                AutoForwardingMiddleware),
            ReactionForwardingWhitelistMiddleware,
            MediaGroupIndexerMiddleware,
            on('message_reaction', admin(ReactionForwardingMiddleware as any)),
        ]),
    ),
);

queue.doNotRetry(_doNotRetry);
queue.catch(_catch);
bot.catch(_catch);

bot.launch();

console.log('Bot is now online.');

function isCommand(ctx: Context) {
    return Boolean(ctx.text?.startsWith('/'));
}
function isAutoForwardingChats(ctx: Context) {
    return autoForwardingChatIds.has(ctx.chat?.id as number);
}

function _doNotRetry(reason: any) {
    return reason instanceof TelegramError && reason.code == 400;
}
function _catch(err: unknown, ctx?: Context) {
    if (err instanceof TelegramError) {
        if (err.code == 400) {
            console.error(err);
            return;
        }
    }
    process.exitCode = 1;
    if (ctx?.update) {
        console.error('Unhandled error while processing', ctx.update);
    }
    throw err;
}

function onExit() {
    clearInterval(queue._timer);
    clearInterval(_sendMediaGroupTimer);
}

process.once('SIGINT', () => {
    onExit();
    bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
    onExit();
    bot.stop('SIGTERM');
});
