import { 
  GroupMeStatelessAPI, 
  Group, 
  Chat, 
  MessagesResponse, 
  DirectMessagesResponse, 
  Message, 
  DirectMessage, 
  UserMe, 
  Attachment 
} from './types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const groupme = require('groupme');
const API: GroupMeStatelessAPI = groupme.Stateless;

/**
 * Custom error class for API errors with additional context
 */
export class GroupMeAPIError extends Error {
  public statusCode?: number;
  public endpoint?: string;
  public originalError: unknown;

  constructor(message: string, originalError?: unknown, endpoint?: string, statusCode?: number) {
    super(message);
    this.name = 'GroupMeAPIError';
    this.originalError = originalError;
    this.endpoint = endpoint;
    this.statusCode = statusCode;
  }
}

/**
 * Validate API response and throw structured error if invalid
 */
function validateResponse<T>(response: T, endpoint: string): T {
  if (response === null || response === undefined) {
    throw new GroupMeAPIError(
      `Empty response from ${endpoint}`,
      null,
      endpoint,
      500
    );
  }
  return response;
}

/**
 * Extract error message from various error types
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    // Check for common API error structures
    const err = error as Record<string, unknown>;
    if (err.message) return String(err.message);
    if (err.error) return String(err.error);
    if (err.description) return String(err.description);
    if (err.errors && Array.isArray(err.errors)) return err.errors.join(', ');
  }
  return 'Unknown error occurred';
}

// Promisify API calls with better error handling
function promisify<T>(fn: (callback: (err: Error | null, result: T) => void) => void, endpoint: string): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((err, result) => {
      if (err) {
        const message = extractErrorMessage(err);
        
        // Detect specific error types
        if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('invalid token')) {
          reject(new GroupMeAPIError(
            'Authentication failed: Invalid or expired API token. Run "groupme config --token YOUR_TOKEN" to update.',
            err,
            endpoint,
            401
          ));
        } else if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('404')) {
          reject(new GroupMeAPIError(
            `Resource not found: ${endpoint}`,
            err,
            endpoint,
            404
          ));
        } else if (message.toLowerCase().includes('rate limit')) {
          reject(new GroupMeAPIError(
            'Rate limit exceeded. Please wait a moment before trying again.',
            err,
            endpoint,
            429
          ));
        } else {
          reject(new GroupMeAPIError(
            `API Error: ${message}`,
            err,
            endpoint
          ));
        }
      } else {
        try {
          resolve(validateResponse(result, endpoint));
        } catch (validationErr) {
          reject(validationErr);
        }
      }
    });
  });
}

/**
 * Get all groups for the authenticated user
 */
export async function getGroups(token: string): Promise<Group[]> {
  try {
    return await promisify<Group[]>((cb) => API.Groups.index(token, cb), 'Groups.index');
  } catch (error) {
    if (error instanceof GroupMeAPIError) throw error;
    throw new GroupMeAPIError(
      'Failed to fetch groups',
      error,
      'Groups.index'
    );
  }
}

/**
 * Get a specific group by ID
 */
export async function getGroup(token: string, groupId: string): Promise<Group> {
  try {
    return await promisify<Group>((cb) => API.Groups.show(token, groupId, cb), 'Groups.show');
  } catch (error) {
    if (error instanceof GroupMeAPIError) throw error;
    throw new GroupMeAPIError(
      `Failed to fetch group ${groupId}`,
      error,
      'Groups.show'
    );
  }
}

/**
 * Get direct message chats with pagination
 */
export async function getChats(token: string, page?: number, perPage?: number): Promise<Chat[]> {
  const opts = page !== undefined || perPage !== undefined
    ? { page, per_page: perPage }
    : null;
  
  try {
    return await promisify<Chat[]>((cb) => API.Chats.index(token, opts, cb), 'Chats.index');
  } catch (error) {
    if (error instanceof GroupMeAPIError) throw error;
    throw new GroupMeAPIError(
      'Failed to fetch chats',
      error,
      'Chats.index'
    );
  }
}

/**
 * Get messages from a group with pagination support
 */
export async function getMessages(
  token: string,
  groupId: string,
  opts?: { before_id?: string; after_id?: string; limit?: number }
): Promise<MessagesResponse> {
  try {
    return await promisify<MessagesResponse>(
      (cb) => API.Messages.index(token, groupId, opts || null, cb), 
      'Messages.index'
    );
  } catch (error) {
    if (error instanceof GroupMeAPIError) throw error;
    throw new GroupMeAPIError(
      `Failed to fetch messages from group ${groupId}`,
      error,
      'Messages.index'
    );
  }
}

/**
 * Send a message to a group
 */
export async function sendMessage(
  token: string,
  groupId: string,
  text: string
): Promise<Message> {
  if (!text || text.trim().length === 0) {
    throw new GroupMeAPIError(
      'Message text cannot be empty',
      null,
      'Messages.create'
    );
  }

  // GroupMe has a limit of 1000 characters per message
  if (text.length > 1000) {
    throw new GroupMeAPIError(
      'Message exceeds maximum length of 1000 characters',
      null,
      'Messages.create'
    );
  }

  try {
    const result = await promisify<{ message: Message }>((cb) =>
      API.Messages.create(token, groupId, { message: { text } }, cb),
      'Messages.create'
    );
    
    if (!result.message) {
      throw new GroupMeAPIError(
        'Failed to send message: no message returned from API',
        null,
        'Messages.create'
      );
    }
    
    return result.message;
  } catch (error) {
    if (error instanceof GroupMeAPIError) throw error;
    throw new GroupMeAPIError(
      'Failed to send message',
      error,
      'Messages.create'
    );
  }
}

/**
 * Send a reply to a specific message in a group
 */
export async function sendReply(
  token: string,
  groupId: string,
  text: string,
  replyToMessageId: string
): Promise<Message> {
  if (!text || text.trim().length === 0) {
    throw new GroupMeAPIError(
      'Message text cannot be empty',
      null,
      'Messages.create'
    );
  }

  if (text.length > 1000) {
    throw new GroupMeAPIError(
      'Message exceeds maximum length of 1000 characters',
      null,
      'Messages.create'
    );
  }

  if (!replyToMessageId || replyToMessageId.trim().length === 0) {
    throw new GroupMeAPIError(
      'Reply-to message ID cannot be empty',
      null,
      'Messages.create'
    );
  }

  try {
    // GroupMe uses a special reply attachment format
    const result = await promisify<{ message: Message }>((cb) =>
      API.Messages.create(token, groupId, { 
        message: { 
          text,
          attachments: [{
            type: 'reply',
            reply_id: replyToMessageId
          } as unknown as Attachment]
        } 
      }, cb),
      'Messages.create'
    );
    
    if (!result.message) {
      throw new GroupMeAPIError(
        'Failed to send reply: no message returned from API',
        null,
        'Messages.create'
      );
    }
    
    return result.message;
  } catch (error) {
    if (error instanceof GroupMeAPIError) throw error;
    throw new GroupMeAPIError(
      'Failed to send reply',
      error,
      'Messages.create'
    );
  }
}

/**
 * Get direct messages with a specific user
 */
export async function getDirectMessages(
  token: string,
  otherUserId: string,
  opts?: { before_id?: string; after_id?: string }
): Promise<DirectMessagesResponse> {
  try {
    return await promisify<DirectMessagesResponse>((cb) =>
      API.DirectMessages.index(token, { other_user_id: otherUserId, ...opts }, cb),
      'DirectMessages.index'
    );
  } catch (error) {
    if (error instanceof GroupMeAPIError) throw error;
    throw new GroupMeAPIError(
      `Failed to fetch direct messages with user ${otherUserId}`,
      error,
      'DirectMessages.index'
    );
  }
}

/**
 * Send a direct message to a user
 */
export async function sendDirectMessage(
  token: string,
  recipientId: string,
  text: string
): Promise<DirectMessage> {
  if (!text || text.trim().length === 0) {
    throw new GroupMeAPIError(
      'Message text cannot be empty',
      null,
      'DirectMessages.create'
    );
  }

  if (text.length > 1000) {
    throw new GroupMeAPIError(
      'Message exceeds maximum length of 1000 characters',
      null,
      'DirectMessages.create'
    );
  }

  try {
    const result = await promisify<{ direct_message: DirectMessage }>((cb) =>
      API.DirectMessages.create(token, { direct_message: { recipient_id: recipientId, text } }, cb),
      'DirectMessages.create'
    );
    
    if (!result.direct_message) {
      throw new GroupMeAPIError(
        'Failed to send direct message: no message returned from API',
        null,
        'DirectMessages.create'
      );
    }
    
    return result.direct_message;
  } catch (error) {
    if (error instanceof GroupMeAPIError) throw error;
    throw new GroupMeAPIError(
      'Failed to send direct message',
      error,
      'DirectMessages.create'
    );
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser(token: string): Promise<UserMe> {
  try {
    return await promisify<UserMe>((cb) => API.Users.me(token, cb), 'Users.me');
  } catch (error) {
    if (error instanceof GroupMeAPIError) throw error;
    throw new GroupMeAPIError(
      'Failed to fetch user information',
      error,
      'Users.me'
    );
  }
}

/**
 * Helper to handle API errors consistently in commands
 */
export function handleAPIError(error: unknown): never {
  if (error instanceof GroupMeAPIError) {
    console.error(`Error: ${error.message}`);
    if (error.statusCode) {
      console.error(`Status: ${error.statusCode}`);
    }
  } else if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error('Error: An unknown error occurred');
  }
  process.exit(1);
}
