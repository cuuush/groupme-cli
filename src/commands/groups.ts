import { Command } from 'commander';
import { getToken } from '../config';
import { getGroups, getChats, GroupMeAPIError, handleAPIError } from '../api';
import { Group, Chat } from '../types';
import { findMatches, fuzzySearch, findBestMatch, SearchResult } from '../utils/search';

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

function formatGroup(group: Group, highlightMatches?: string[]): void {
  console.log(`\n  ${group.name}`);
  console.log(`  ID: ${group.id}`);
  console.log(`  Members: ${group.members.length}`);
  console.log(`  Messages: ${group.messages.count}`);
  if (group.description) {
    console.log(`  Description: ${group.description}`);
  }
  if (group.messages.preview?.text) {
    const preview = group.messages.preview.text.substring(0, 50);
    console.log(`  Last message: "${preview}${group.messages.preview.text.length > 50 ? '...' : ''}" - ${group.messages.preview.nickname}`);
  }
  if (highlightMatches && highlightMatches.length > 0) {
    console.log(`  Match: ${highlightMatches.join(', ')}`);
  }
}

function formatChat(chat: Chat): void {
  console.log(`\n  ${chat.other_user.name}`);
  console.log(`  User ID: ${chat.other_user.id}`);
  console.log(`  Messages: ${chat.messages_count}`);
  console.log(`  Last updated: ${formatDate(chat.updated_at)}`);
  if (chat.last_message?.text) {
    const preview = chat.last_message.text.substring(0, 50);
    console.log(`  Last message: "${preview}${chat.last_message.text.length > 50 ? '...' : ''}" - ${chat.last_message.name}`);
  }
}

/**
 * Search result with group and match information
 */
interface GroupSearchResult {
  group: Group;
  score: number;
  matches: string[];
}

/**
 * Find groups by fuzzy matching on name and description
 */
function searchGroups(groups: Group[], query: string): GroupSearchResult[] {
  const results = fuzzySearch(
    groups,
    query,
    (group) => [group.name, group.description || ''],
    { threshold: 0.2 }
  );
  
  return results.map(r => ({
    group: r.item,
    score: r.score,
    matches: r.matches
  }));
}

/**
 * Interactive group selection when multiple matches found
 */
async function selectGroup(results: GroupSearchResult[]): Promise<Group | null> {
  if (results.length === 0) {
    return null;
  }
  
  if (results.length === 1) {
    return results[0].group;
  }

  // Display options
  console.log('\nMultiple groups matched your search:');
  results.slice(0, 10).forEach((result, index) => {
    console.log(`\n  ${index + 1}. ${result.group.name} (ID: ${result.group.id})`);
    console.log(`     Score: ${(result.score * 100).toFixed(1)}% match`);
  });

  if (results.length > 10) {
    console.log(`\n  ... and ${results.length - 10} more`);
  }

  console.log('\n  0. Cancel');
  
  // For non-interactive use, return the best match
  // In interactive mode, would prompt user
  console.log('\nSelecting best match automatically. Use --exact to force exact match.');
  return results[0].group;
}

export function createGroupsCommand(): Command {
  const cmd = new Command('groups')
    .description('List groups you belong to')
    .option('-j, --json', 'Output as JSON')
    .option('-t, --token <token>', 'API token (overrides config)')
    .option('-s, --search <query>', 'Search/filter groups by name (supports partial/fuzzy matching)')
    .option('-e, --exact', 'Require exact match for search')
    .option('-i, --id <id>', 'Get a specific group by ID')
    .option('--sort <field>', 'Sort by: name, members, messages, updated (default: name)', 'name')
    .action(async (options) => {
      try {
        const token = getToken(options.token);
        
        // If ID specified, fetch specific group
        if (options.id) {
          const { getGroup } = await import('../api');
          const group = await getGroup(token, options.id);
          
          if (options.json) {
            console.log(JSON.stringify(group, null, 2));
            return;
          }
          
          console.log(`\nFound 1 group:`);
          formatGroup(group);
          console.log('');
          return;
        }
        
        const groups = await getGroups(token);

        let displayGroups: Group[] = groups;
        let searchResults: GroupSearchResult[] | null = null;

        // Apply search/filter if specified
        if (options.search) {
          searchResults = searchGroups(groups, options.search);
          
          if (searchResults.length === 0) {
            console.log(`\nNo groups found matching "${options.search}".`);
            console.log('Available groups:');
            groups.forEach(g => console.log(`  - ${g.name}`));
            console.log('');
            return;
          }

          if (options.exact) {
            // Require exact match
            const exactMatch = groups.find(g => 
              g.name.toLowerCase() === options.search.toLowerCase()
            );
            if (!exactMatch) {
              console.log(`\nNo exact match found for "${options.search}".`);
              console.log('Use without --exact for fuzzy matching, or choose from:');
              searchResults.slice(0, 5).forEach(r => console.log(`  - ${r.group.name}`));
              console.log('');
              return;
            }
            displayGroups = [exactMatch];
          } else {
            displayGroups = searchResults.map(r => r.group);
          }
        }

        // Apply sorting
        if (options.sort) {
          displayGroups = [...displayGroups].sort((a, b) => {
            switch (options.sort.toLowerCase()) {
              case 'name':
                return a.name.localeCompare(b.name);
              case 'members':
                return b.members.length - a.members.length;
              case 'messages':
                return b.messages.count - a.messages.count;
              case 'updated':
                return b.messages.last_message_created_at - a.messages.last_message_created_at;
              default:
                return a.name.localeCompare(b.name);
            }
          });
        }

        if (options.json) {
          console.log(JSON.stringify(displayGroups, null, 2));
          return;
        }

        const searchInfo = options.search ? ` matching "${options.search}"` : '';
        console.log(`\nFound ${displayGroups.length} groups${searchInfo}:`);
        
        displayGroups.forEach(group => {
          const result = searchResults?.find(r => r.group.id === group.id);
          formatGroup(group, result?.matches);
        });
        
        if (options.search && searchResults && searchResults.length > 0) {
          console.log(`\nBest match: ${searchResults[0].group.name} (${(searchResults[0].score * 100).toFixed(1)}% match)`);
        }
        
        console.log('');
      } catch (error) {
        handleAPIError(error);
      }
    });

  return cmd;
}

export function createChatsCommand(): Command {
  const cmd = new Command('chats')
    .description('List direct message conversations')
    .option('-p, --page <number>', 'Page number', '1')
    .option('-n, --per-page <number>', 'Results per page', '20')
    .option('-j, --json', 'Output as JSON')
    .option('-t, --token <token>', 'API token (overrides config)')
    .option('-s, --search <query>', 'Search chats by user name (supports partial/fuzzy matching)')
    .action(async (options) => {
      try {
        const token = getToken(options.token);
        const page = parseInt(options.page, 10);
        const perPage = parseInt(options.perPage, 10);
        const chats = await getChats(token, page, perPage);

        let displayChats = chats;

        // Apply search if specified
        if (options.search) {
          const results = fuzzySearch(
            chats,
            options.search,
            (chat) => chat.other_user.name,
            { threshold: 0.3 }
          );
          
          if (results.length === 0) {
            console.log(`\nNo chats found matching "${options.search}".`);
            console.log('');
            return;
          }
          
          displayChats = results.map(r => r.item);
        }

        if (options.json) {
          console.log(JSON.stringify(displayChats, null, 2));
          return;
        }

        const searchInfo = options.search ? ` matching "${options.search}"` : '';
        console.log(`\nFound ${displayChats.length} conversations${searchInfo} (page ${page}):`);
        displayChats.forEach(formatChat);
        console.log('');
      } catch (error) {
        handleAPIError(error);
      }
    });

  return cmd;
}

/**
 * Helper function to find a group by name or ID
 * Used by other commands that need to resolve group references
 */
export async function resolveGroup(
  token: string, 
  identifier: string
): Promise<{ group: Group; exact: boolean }> {
  // First, try to find by exact ID
  try {
    const { getGroup } = await import('../api');
    const group = await getGroup(token, identifier);
    return { group, exact: true };
  } catch {
    // Not found by ID, search by name
  }

  // Search by name
  const groups = await getGroups(token);
  const results = searchGroups(groups, identifier);
  
  if (results.length === 0) {
    throw new GroupMeAPIError(
      `No group found matching "${identifier}"`,
      null,
      'resolveGroup',
      404
    );
  }

  const bestMatch = results[0];
  const exact = bestMatch.score >= 0.95;
  
  if (!exact && results.length > 1) {
    console.warn(`Warning: Using "${bestMatch.group.name}" (best match). Other matches:`);
    results.slice(1, 5).forEach(r => console.warn(`  - ${r.group.name} (${(r.score * 100).toFixed(1)}%)`));
  }
  
  return { group: bestMatch.group, exact };
}
