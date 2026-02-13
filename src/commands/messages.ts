import { Command } from 'commander';
import { getToken } from '../config';
import { getMessages, sendMessage, sendReply, getDirectMessages, sendDirectMessage, handleAPIError, GroupMeAPIError } from '../api';
import { Message, DirectMessage } from '../types';
import { resolveGroup } from './groups';

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

function formatMessage(msg: Message): void {
  const date = formatDate(msg.created_at);
  const likes = msg.favorited_by.length > 0 ? ` [${msg.favorited_by.length} likes]` : '';
  const systemIndicator = msg.system ? ' [SYSTEM]' : '';
  
  console.log(`\n[${date}] ${msg.name}${likes}${systemIndicator}`);
  
  if (msg.text) {
    // Handle multi-line messages
    const lines = msg.text.split('\n');
    lines.forEach(line => {
      console.log(`  ${line}`);
    });
  } else if (!msg.system) {
    console.log('  (no text)');
  }
  
  if (msg.attachments.length > 0) {
    msg.attachments.forEach((att) => {
      if (att.type === 'image' && att.url) {
        console.log(`  📷 [Image: ${att.url}]`);
      } else if (att.type === 'location' && att.name) {
        console.log(`  📍 [Location: ${att.name}]`);
      } else if (att.type === 'mentions' && att.user_ids) {
        console.log(`  👥 [Mentions: ${att.user_ids.length} user(s)]`);
      } else if (att.type === 'split') {
        console.log(`  💸 [Split]${att.token ? ` token: ${att.token}` : ''}`);
      } else {
        console.log(`  [${att.type.toUpperCase()} attachment]`);
      }
    });
  }
}

function formatDirectMessage(msg: DirectMessage): void {
  const date = formatDate(msg.created_at);
  const likes = msg.favorited_by.length > 0 ? ` [${msg.favorited_by.length} likes]` : '';
  
  console.log(`\n[${date}] ${msg.name}${likes}`);
  
  if (msg.text) {
    const lines = msg.text.split('\n');
    lines.forEach(line => {
      console.log(`  ${line}`);
    });
  }
  
  if (msg.attachments.length > 0) {
    msg.attachments.forEach((att) => {
      if (att.type === 'image' && att.url) {
        console.log(`  📷 [Image: ${att.url}]`);
      } else if (att.type === 'location' && att.name) {
        console.log(`  📍 [Location: ${att.name}]`);
      }
    });
  }
}

/**
 * Format messages in a compact view
 */
function formatCompactMessage(msg: Message | DirectMessage): void {
  const date = new Date(msg.created_at * 1000).toLocaleTimeString();
  const text = (msg.text || '(no text)').substring(0, 60);
  const suffix = (msg.text?.length || 0) > 60 ? '...' : '';
  const likes = 'favorited_by' in msg && msg.favorited_by.length > 0 ? ` [${msg.favorited_by.length}❤️]` : '';
  
  console.log(`[${date}] ${msg.name}: ${text}${suffix}${likes}`);
}

export function createReadCommand(): Command {
  const cmd = new Command('read')
    .description('Read messages from a group')
    .requiredOption('-g, --group <id>', 'Group ID or name (supports fuzzy matching)')
    .option('-n, --limit <number>', 'Number of messages to fetch (max 100 per request)', '20')
    .option('-b, --before <id>', 'Get messages before this message ID')
    .option('-a, --after <id>', 'Get messages after this message ID')
    .option('-j, --json', 'Output as JSON')
    .option('-c, --compact', 'Compact output format (one line per message)')
    .option('-t, --token <token>', 'API token (overrides config)')
    .option('--no-reverse', 'Show newest messages first (default: oldest first)')
    .action(async (options) => {
      try {
        const token = getToken(options.token);
        const limit = Math.min(parseInt(options.limit, 10) || 20, 100);

        // Resolve group by ID or name
        let groupId: string;
        let resolvedGroupName: string | undefined;
        
        try {
          // First try to parse as ID (numeric or UUID-like)
          if (/^\d+$/.test(options.group) || /^[a-f0-9-]{36}$/i.test(options.group)) {
            groupId = options.group;
          } else {
            // Treat as name, resolve it
            const { group, exact } = await resolveGroup(token, options.group);
            groupId = group.id;
            resolvedGroupName = group.name;
            
            if (!exact) {
              console.log(`Note: Resolved "${options.group}" to "${group.name}"`);
            }
          }
        } catch (resolveError) {
          console.error(`Error: Could not find group "${options.group}"`);
          console.error('Tip: Use "groupme groups" to see available groups');
          process.exit(1);
        }

        const opts: { before_id?: string; after_id?: string; limit?: number } = {};
        if (options.before) opts.before_id = options.before;
        if (options.after) opts.after_id = options.after;
        if (limit) opts.limit = limit;

        const response = await getMessages(token, groupId, opts);

        if (options.json) {
          const output = {
            group: resolvedGroupName ? { id: groupId, name: resolvedGroupName } : { id: groupId },
            total: response.count,
            messages: response.messages,
            pagination: {
              has_more: response.messages.length === limit,
              next_before_id: response.messages.length > 0 
                ? response.messages[response.messages.length - 1].id 
                : null,
              next_after_id: response.messages.length > 0 
                ? response.messages[0].id 
                : null
            }
          };
          console.log(JSON.stringify(output, null, 2));
          return;
        }

        const header = resolvedGroupName 
          ? `\nShowing ${response.messages.length} messages from "${resolvedGroupName}" (total: ${response.count}):`
          : `\nShowing ${response.messages.length} messages (total: ${response.count}):`;
        console.log(header);

        // Determine display order
        let messages = response.messages;
        if (options.reverse !== false) {
          // Default: Display in chronological order (oldest first)
          messages = [...messages].reverse();
        }

        // Display messages
        if (options.compact) {
          messages.forEach(formatCompactMessage);
        } else {
          messages.forEach(formatMessage);
        }

        // Pagination hints
        if (response.messages.length > 0) {
          const lastMsg = response.messages[response.messages.length - 1];
          console.log(`\n${'─'.repeat(60)}`);
          console.log(`Pagination tips:`);
          console.log(`  Load older: groupme read -g "${options.group}" --before ${lastMsg.id}`);
          if (response.messages.length === limit) {
            console.log(`  Load newer: groupme read -g "${options.group}" --after ${response.messages[0].id}`);
          }
          console.log(`${'─'.repeat(60)}`);
        }
      } catch (error) {
        handleAPIError(error);
      }
    });

  return cmd;
}

export function createSendCommand(): Command {
  const cmd = new Command('send')
    .description('Send a message to a group')
    .requiredOption('-g, --group <id>', 'Group ID or name (supports fuzzy matching)')
    .requiredOption('-m, --message <text>', 'Message text')
    .option('-j, --json', 'Output as JSON')
    .option('-t, --token <token>', 'API token (overrides config)')
    .option('--confirm', 'Show confirmation before sending')
    .action(async (options) => {
      try {
        const token = getToken(options.token);
        
        // Resolve group by ID or name
        let groupId: string;
        let resolvedGroupName: string | undefined;
        
        try {
          // First try to parse as ID (numeric or UUID-like)
          if (/^\d+$/.test(options.group) || /^[a-f0-9-]{36}$/i.test(options.group)) {
            groupId = options.group;
          } else {
            // Treat as name, resolve it
            const { group, exact } = await resolveGroup(token, options.group);
            groupId = group.id;
            resolvedGroupName = group.name;
            
            if (!exact) {
              console.log(`Note: Resolved "${options.group}" to "${group.name}"`);
            }
          }
        } catch (resolveError) {
          console.error(`Error: Could not find group "${options.group}"`);
          console.error('Tip: Use "groupme groups" to see available groups');
          process.exit(1);
        }

        // Confirm if requested
        if (options.confirm) {
          const target = resolvedGroupName || groupId;
          console.log(`\nAbout to send to: ${target}`);
          console.log(`Message: ${options.message}`);
          console.log('\nUse --confirm to bypass this check or press Ctrl+C to cancel.');
        }

        const message = await sendMessage(token, groupId, options.message);

        if (options.json) {
          console.log(JSON.stringify(message, null, 2));
          return;
        }

        const target = resolvedGroupName ? `"${resolvedGroupName}"` : groupId;
        console.log(`\n✓ Message sent to ${target}!`);
        console.log(`  ID: ${message.id}`);
        console.log(`  Text: ${message.text}`);
        console.log(`  Sent at: ${formatDate(message.created_at)}`);
        console.log('');
      } catch (error) {
        handleAPIError(error);
      }
    });

  return cmd;
}

export function createDmReadCommand(): Command {
  const cmd = new Command('dm-read')
    .description('Read direct messages with a user')
    .requiredOption('-u, --user <id>', 'User ID')
    .option('-n, --limit <number>', 'Number of messages to fetch', '20')
    .option('-b, --before <id>', 'Get messages before this message ID')
    .option('-a, --after <id>', 'Get messages after this message ID')
    .option('-j, --json', 'Output as JSON')
    .option('-c, --compact', 'Compact output format')
    .option('-t, --token <token>', 'API token (overrides config)')
    .option('--no-reverse', 'Show newest messages first (default: oldest first)')
    .action(async (options) => {
      try {
        const token = getToken(options.token);
        const limit = parseInt(options.limit, 10) || 20;

        const opts: { before_id?: string; after_id?: string; limit?: number } = {};
        if (options.before) opts.before_id = options.before;
        if (options.after) opts.after_id = options.after;

        const response = await getDirectMessages(token, options.user, opts);

        if (options.json) {
          console.log(JSON.stringify({
            user_id: options.user,
            total: response.count,
            messages: response.direct_messages
          }, null, 2));
          return;
        }

        console.log(`\nShowing ${response.direct_messages.length} messages with user ${options.user} (total: ${response.count}):`);

        // Determine display order
        let messages = response.direct_messages;
        if (options.reverse !== false) {
          // Default: chronological order (oldest first)
          messages = [...messages].reverse();
        }

        // Limit for display
        if (messages.length > limit) {
          messages = messages.slice(0, limit);
        }

        if (options.compact) {
          messages.forEach(formatCompactMessage);
        } else {
          messages.forEach(formatDirectMessage);
        }

        if (response.direct_messages.length > 0) {
          const lastMsg = response.direct_messages[response.direct_messages.length - 1];
          console.log(`\n--- To load more messages, use: --before ${lastMsg.id} ---\n`);
        }
      } catch (error) {
        handleAPIError(error);
      }
    });

  return cmd;
}

export function createDmSendCommand(): Command {
  const cmd = new Command('dm')
    .description('Send a direct message to a user')
    .requiredOption('-u, --user <id>', 'Recipient user ID')
    .requiredOption('-m, --message <text>', 'Message text')
    .option('-j, --json', 'Output as JSON')
    .option('-t, --token <token>', 'API token (overrides config)')
    .action(async (options) => {
      try {
        const token = getToken(options.token);
        const message = await sendDirectMessage(token, options.user, options.message);

        if (options.json) {
          console.log(JSON.stringify(message, null, 2));
          return;
        }

        console.log('\n✓ Direct message sent successfully!');
        console.log(`  ID: ${message.id}`);
        console.log(`  To: ${message.recipient_id}`);
        console.log(`  Text: ${message.text}`);
        console.log(`  Sent at: ${formatDate(message.created_at)}`);
        console.log('');
      } catch (error) {
        handleAPIError(error);
      }
    });

  return cmd;
}

export function createReplyCommand(): Command {
  const cmd = new Command('reply')
    .description('Reply to a specific message in a group')
    .requiredOption('-g, --group <id>', 'Group ID or name (supports fuzzy matching)')
    .requiredOption('-m, --message <text>', 'Reply text')
    .requiredOption('-r, --reply-to <id>', 'Message ID to reply to')
    .option('-j, --json', 'Output as JSON')
    .option('-t, --token <token>', 'API token (overrides config)')
    .option('--confirm', 'Show confirmation before sending')
    .action(async (options) => {
      try {
        const token = getToken(options.token);
        
        // Resolve group by ID or name
        let groupId: string;
        let resolvedGroupName: string | undefined;
        
        try {
          // First try to parse as ID (numeric or UUID-like)
          if (/^\d+$/.test(options.group) || /^[a-f0-9-]{36}$/i.test(options.group)) {
            groupId = options.group;
          } else {
            // Treat as name, resolve it
            const { group, exact } = await resolveGroup(token, options.group);
            groupId = group.id;
            resolvedGroupName = group.name;
            
            if (!exact) {
              console.log(`Note: Resolved "${options.group}" to "${group.name}"`);
            }
          }
        } catch (resolveError) {
          console.error(`Error: Could not find group "${options.group}"`);
          console.error('Tip: Use "groupme groups" to see available groups');
          process.exit(1);
        }

        // Confirm if requested
        if (options.confirm) {
          const target = resolvedGroupName || groupId;
          console.log(`\nAbout to send reply to: ${target}`);
          console.log(`Replying to message: ${options.replyTo}`);
          console.log(`Message: ${options.message}`);
          console.log('\nUse --confirm to bypass this check or press Ctrl+C to cancel.');
        }

        const message = await sendReply(token, groupId, options.message, options.replyTo);

        if (options.json) {
          console.log(JSON.stringify(message, null, 2));
          return;
        }

        const target = resolvedGroupName ? `"${resolvedGroupName}"` : groupId;
        console.log(`\n✓ Reply sent to ${target}!`);
        console.log(`  ID: ${message.id}`);
        console.log(`  Text: ${message.text}`);
        console.log(`  Replying to: ${options.replyTo}`);
        console.log(`  Sent at: ${formatDate(message.created_at)}`);
        console.log('');
      } catch (error) {
        handleAPIError(error);
      }
    });

  return cmd;
}
