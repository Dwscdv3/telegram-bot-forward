import { readFile } from 'fs/promises';
import { parse } from 'yaml';

type Config = Readonly<{
    token: string;
    forward: { [src: number]: number[] };
}>;

let config: Config = {} as Config;

await loadConfig();

async function loadConfig() {
    Object.assign(config, parse(await readFile('config.yaml', { encoding: 'utf8' })));
}

export { config, loadConfig };
export default config;
