import { Command } from 'commander';
import { saveConfig, loadConfig, getConfigPath, getToken } from '../config';
import { getCurrentUser } from '../api';

export function createConfigCommand(): Command {
  const cmd = new Command('config')
    .description('Configure the CLI (save API token)')
    .option('-t, --token <token>', 'API token to save')
    .option('--show', 'Show current config file path and status')
    .action(async (options) => {
      try {
        if (options.show) {
          const configPath = getConfigPath();
          const config = loadConfig();
          console.log(`\nConfig file: ${configPath}`);
          if (config?.token) {
            console.log(`Token: ${config.token.substring(0, 8)}...${config.token.substring(config.token.length - 4)}`);
            // Validate token by making an API call
            try {
              const user = await getCurrentUser(config.token);
              console.log(`Logged in as: ${user.name} (${user.email})`);
            } catch {
              console.log('Token status: Invalid or expired');
            }
          } else {
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
        const user = await getCurrentUser(options.token);

        saveConfig({ token: options.token });
        console.log(`\nToken saved successfully!`);
        console.log(`Logged in as: ${user.name} (${user.email})`);
        console.log(`Config saved to: ${getConfigPath()}`);
        console.log('');
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return cmd;
}

export function createMeCommand(): Command {
  const cmd = new Command('me')
    .description('Show current user info')
    .option('-j, --json', 'Output as JSON')
    .option('-t, --token <token>', 'API token (overrides config)')
    .action(async (options) => {
      try {
        const token = getToken(options.token);
        const user = await getCurrentUser(token);

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
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  return cmd;
}
