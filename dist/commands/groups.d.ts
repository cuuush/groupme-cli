import { Command } from 'commander';
import { Group } from '../types';
export declare function createGroupsCommand(): Command;
export declare function createChatsCommand(): Command;
/**
 * Helper function to find a group by name or ID
 * Used by other commands that need to resolve group references
 */
export declare function resolveGroup(token: string, identifier: string): Promise<{
    group: Group;
    exact: boolean;
}>;
//# sourceMappingURL=groups.d.ts.map