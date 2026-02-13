"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConfigCommand = createConfigCommand;
exports.createMeCommand = createMeCommand;
const commander_1 = require("commander");
const config_1 = require("../config");
const api_1 = require("../api");
function createConfigCommand() {
    const cmd = new commander_1.Command('config')
        .description('Configure the CLI (save API token)')
        .option('-t, --token <token>', 'API token to save')
        .option('--show', 'Show current config file path and status')
        .action(async (options) => {
        try {
            if (options.show) {
                const configPath = (0, config_1.getConfigPath)();
                const config = (0, config_1.loadConfig)();
                console.log(`\nConfig file: ${configPath}`);
                if (config?.token) {
                    console.log(`Token: ${config.token.substring(0, 8)}...${config.token.substring(config.token.length - 4)}`);
                    // Validate token by making an API call
                    try {
                        const user = await (0, api_1.getCurrentUser)(config.token);
                        console.log(`Logged in as: ${user.name} (${user.email})`);
                    }
                    catch {
                        console.log('Token status: Invalid or expired');
                    }
                }
                else {
                    console.log('Token: Not configured');
                }
                console.log('');
                return;
            }
            if (!options.token) {
                console.error('Error: --token is required when configuring');
                console.error('Usage: groupme config --token YOUR_TOKEN');
                console.error('       groupme config --show');
                process.exit(1);
            }
            // Validate the token before saving
            console.log('Validating token...');
            const user = await (0, api_1.getCurrentUser)(options.token);
            (0, config_1.saveConfig)({ token: options.token });
            console.log(`\nToken saved successfully!`);
            console.log(`Logged in as: ${user.name} (${user.email})`);
            console.log(`Config saved to: ${(0, config_1.getConfigPath)()}`);
            console.log('');
        }
        catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
    return cmd;
}
function createMeCommand() {
    const cmd = new commander_1.Command('me')
        .description('Show current user info')
        .option('-j, --json', 'Output as JSON')
        .option('-t, --token <token>', 'API token (overrides config)')
        .action(async (options) => {
        try {
            const token = (0, config_1.getToken)(options.token);
            const user = await (0, api_1.getCurrentUser)(token);
            if (options.json) {
                console.log(JSON.stringify(user, null, 2));
                return;
            }
            console.log('\nCurrent User:');
            console.log(`  Name: ${user.name}`);
            console.log(`  ID: ${user.id}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Phone: ${user.phone_number}`);
            if (user.image_url) {
                console.log(`  Avatar: ${user.image_url}`);
            }
            console.log('');
        }
        catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
    return cmd;
}
//# sourceMappingURL=config.js.map