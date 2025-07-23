import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';

const StoragePath = 'storage.json'

const storage: {
    chats: {
        [chatId: number]: {
            reactionForwardingEnabled?: boolean;
            mediaGroups?: { [mediaGroupId: string]: number[] };
            mediaGroupIndex?: { [messageId: number]: string };
        }
    };
    reactionAssociations: { [reaction: string]: number[] }
} = existsSync(StoragePath)
        ? JSON.parse(await readFile(StoragePath, 'utf-8'))
        : {};

storage.chats ??= {};
storage.reactionAssociations ??= {}

setInterval(save, 60000);

export async function save() {
    await writeFile(StoragePath, JSON.stringify(storage));
}

export default storage;
