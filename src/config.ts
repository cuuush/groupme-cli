import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { GroupMeConfig } from './types';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'groupme');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function loadConfig(): GroupMeConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data) as GroupMeConfig;
    if (!config.token) {
      return null;
    }
    return config;
  } catch {
    return null;
  }
}

export function saveConfig(config: GroupMeConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function getToken(cliToken?: string): string {
  // CLI token takes precedence
  if (cliToken) {
    return cliToken;
  }

  // Environment variable
  const envToken = process.env.GROUPME_TOKEN;
  if (envToken) {
    return envToken;
  }

  // Config file
  const config = loadConfig();
  if (config?.token) {
    return config.token;
  }

  throw new Error(
    'No API token found. Set it via:\n' +
    '  1. --token flag\n' +
    '  2. GROUPME_TOKEN environment variable\n' +
    '  3. Config file at ~/.config/groupme/config.json\n' +
    '     Run: groupme config --token YOUR_TOKEN'
  );
}
