import { Group, Chat, MessagesResponse, DirectMessagesResponse, Message, DirectMessage, UserMe } from './types';
/**
 * Custom error class for API errors with additional context
 */
export declare class GroupMeAPIError extends Error {
    statusCode?: number;
    endpoint?: string;
    originalError: unknown;
    constructor(message: string, originalError?: unknown, endpoint?: string, statusCode?: number);
}
/**
 * Get all groups for the authenticated user
 */
export declare function getGroups(token: string): Promise<Group[]>;
/**
 * Get a specific group by ID
 */
export declare function getGroup(token: string, groupId: string): Promise<Group>;
/**
 * Get direct message chats with pagination
 */
export declare function getChats(token: string, page?: number, perPage?: number): Promise<Chat[]>;
/**
 * Get messages from a group with pagination support
 */
export declare function getMessages(token: string, groupId: string, opts?: {
    before_id?: string;
    after_id?: string;
    limit?: number;
}): Promise<MessagesResponse>;
/**
 * Send a message to a group
 */
export declare function sendMessage(token: string, groupId: string, text: string): Promise<Message>;
/**
 * Send a reply to a specific message in a group
 */
export declare function sendReply(token: string, groupId: string, text: string, replyToMessageId: string): Promise<Message>;
/**
 * Get direct messages with a specific user
 */
export declare function getDirectMessages(token: string, otherUserId: string, opts?: {
    before_id?: string;
    after_id?: string;
}): Promise<DirectMessagesResponse>;
/**
 * Send a direct message to a user
 */
export declare function sendDirectMessage(token: string, recipientId: string, text: string): Promise<DirectMessage>;
/**
 * Get current user information
 */
export declare function getCurrentUser(token: string): Promise<UserMe>;
/**
 * Helper to handle API errors consistently in commands
 */
export declare function handleAPIError(error: unknown): never;
//# sourceMappingURL=api.d.ts.map