import { Context } from 'telegraf';

export default async function ErrorHandlerMiddleware(ctx: Context, next: () => Promise<void>) {
    try {
        await next();
    } catch (ex) {
        console.error(ex);
    }
}
