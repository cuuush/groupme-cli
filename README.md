# GroupMe CLI

A command-line interface for GroupMe messaging, built with TypeScript.

## Features

- List groups and direct message conversations
- Read messages from groups with pagination
- Send messages to groups
- Send direct messages to users
- Config file support for storing API token

## Installation

### From source

```bash
git clone https://github.com/cuuush/groupme-cli
cd groupme-cli
npm install
npm run build
npm link  # Makes 'groupme' command available globally
```

### Via npx (after publishing)

```bash
npx groupme-cli <command>
```

## Setup

### 1. Get your GroupMe API Token

1. Go to [dev.groupme.com](https://dev.groupme.com/)
2. Log in with your GroupMe account
3. Click "Access Token" to get your personal access token

### 2. Configure the CLI

```bash
groupme config --token YOUR_ACCESS_TOKEN
```

This saves your token to `~/.config/groupme/config.json`.

Alternatively, you can:
- Use the `--token` flag with each command
- Set the `GROUPME_TOKEN` environment variable

## Usage

### View current user

```bash
groupme me
```

### List groups

```bash
groupme groups
groupme groups --json  # Output as JSON
```

### List direct message conversations

```bash
groupme chats
groupme chats --page 2 --per-page 10
```

### Read messages from a group

```bash
# Get latest 20 messages
groupme read --group GROUP_ID

# Get more messages
groupme read --group GROUP_ID --limit 50

# Pagination (load older messages)
groupme read --group GROUP_ID --before MESSAGE_ID

# Output as JSON
groupme read --group GROUP_ID --json
```

### Send message to a group

```bash
groupme send --group GROUP_ID --message "Hello, world!"
```

### Read direct messages

```bash
groupme dm-read --user USER_ID
groupme dm-read --user USER_ID --before MESSAGE_ID  # Pagination
```

### Send direct message

```bash
groupme dm --user USER_ID --message "Hello!"
```

### Check config status

```bash
groupme config --show
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `config` | Configure CLI (save API token) |
| `me` | Show current user info |
| `groups` | List groups you belong to |
| `chats` | List direct message conversations |
| `read` | Read messages from a group |
| `send` | Send a message to a group |
| `dm-read` | Read direct messages with a user |
| `dm` | Send a direct message to a user |

## Global Options

All commands support these options:
- `--token <token>` - Override configured API token
- `--json` - Output results as JSON (where applicable)
- `--help` - Show help for command

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Run the CLI
npm start -- <command>
# or
node dist/index.js <command>
```

## Project Structure

```
groupme-cli/
├── src/
│   ├── index.ts        # CLI entry point
│   ├── api.ts          # GroupMe API wrapper
│   ├── config.ts       # Configuration management
│   ├── types.ts        # TypeScript type definitions
│   └── commands/       # Command implementations
│       ├── index.ts
│       ├── config.ts
│       ├── groups.ts
│       └── messages.ts
├── dist/               # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## License

ISC
