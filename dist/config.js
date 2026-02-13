"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigPath = getConfigPath;
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.getToken = getToken;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const CONFIG_DIR = path.join(os.homedir(), '.config', 'groupme');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
function getConfigPath() {
    return CONFIG_FILE;
}
function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            return null;
        }
        const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
        const config = JSON.parse(data);
        if (!config.token) {
            return null;
        }
        return config;
    }
    catch {
        return null;
    }
}
function saveConfig(config) {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}
function getToken(cliToken) {
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
    throw new Error('No API token found. Set it via:\n' +
        '  1. --token flag\n' +
        '  2. GROUPME_TOKEN environment variable\n' +
        '  3. Config file at ~/.config/groupme/config.json\n' +
        '     Run: groupme config --token YOUR_TOKEN');
}
//# sourceMappingURL=config.js.map