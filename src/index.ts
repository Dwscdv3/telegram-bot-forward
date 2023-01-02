import { Context, Telegraf, TelegramError } from 'telegraf';
import config from './config.js';
import queue from './util/queue.js';
import ErrorHandlerMiddleware from './middleware/error-handler.js';
import ForwardMiddleware, { _sendMediaGroupTimer } from './middleware/forward.js';

const bot = new Telegraf(config.token);

bot.use(ErrorHandlerMiddleware);
bot.on('channel_post', ForwardMiddleware);

queue.doNotRetry(_doNotRetry);
queue.catch(_catch);
bot.catch(_catch);

bot.launch();

console.log('Bot is now online.');

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
