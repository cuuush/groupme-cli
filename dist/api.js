"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupMeAPIError = void 0;
exports.getGroups = getGroups;
exports.getGroup = getGroup;
exports.getChats = getChats;
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.sendReply = sendReply;
exports.getDirectMessages = getDirectMessages;
exports.sendDirectMessage = sendDirectMessage;
exports.getCurrentUser = getCurrentUser;
exports.handleAPIError = handleAPIError;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const groupme = require('groupme');
const API = groupme.Stateless;
/**
 * Custom error class for API errors with additional context
 */
class GroupMeAPIError extends Error {
    constructor(message, originalError, endpoint, statusCode) {
        super(message);
        this.name = 'GroupMeAPIError';
        this.originalError = originalError;
        this.endpoint = endpoint;
        this.statusCode = statusCode;
    }
}
exports.GroupMeAPIError = GroupMeAPIError;
/**
 * Validate API response and throw structured error if invalid
 */
function validateResponse(response, endpoint) {
    if (response === null || response === undefined) {
        throw new GroupMeAPIError(`Empty response from ${endpoint}`, null, endpoint, 500);
    }
    return response;
}
/**
 * Extract error message from various error types
 */
function extractErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (error && typeof error === 'object') {
        // Check for common API error structures
        const err = error;
        if (err.message)
            return String(err.message);
        if (err.error)
            return String(err.error);
        if (err.description)
            return String(err.description);
        if (err.errors && Array.isArray(err.errors))
            return err.errors.join(', ');
    }
    return 'Unknown error occurred';
}
// Promisify API calls with better error handling
function promisify(fn, endpoint) {
    return new Promise((resolve, reject) => {
        fn((err, result) => {
            if (err) {
                const message = extractErrorMessage(err);
                // Detect specific error types
                if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('invalid token')) {
                    reject(new GroupMeAPIError('Authentication failed: Invalid or expired API token. Run "groupme config --token YOUR_TOKEN" to update.', err, endpoint, 401));
                }
                else if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('404')) {
                    reject(new GroupMeAPIError(`Resource not found: ${endpoint}`, err, endpoint, 404));
                }
                else if (message.toLowerCase().includes('rate limit')) {
                    reject(new GroupMeAPIError('Rate limit exceeded. Please wait a moment before trying again.', err, endpoint, 429));
                }
                else {
                    reject(new GroupMeAPIError(`API Error: ${message}`, err, endpoint));
                }
            }
            else {
                try {
                    resolve(validateResponse(result, endpoint));
                }
                catch (validationErr) {
                    reject(validationErr);
                }
            }
        });
    });
}
/**
 * Get all groups for the authenticated user
 */
async function getGroups(token) {
    try {
        return await promisify((cb) => API.Groups.index(token, cb), 'Groups.index');
    }
    catch (error) {
        if (error instanceof GroupMeAPIError)
            throw error;
        throw new GroupMeAPIError('Failed to fetch groups', error, 'Groups.index');
    }
}
/**
 * Get a specific group by ID
 */
async function getGroup(token, groupId) {
    try {
        return await promisify((cb) => API.Groups.show(token, groupId, cb), 'Groups.show');
    }
    catch (error) {
        if (error instanceof GroupMeAPIError)
            throw error;
        throw new GroupMeAPIError(`Failed to fetch group ${groupId}`, error, 'Groups.show');
    }
}
/**
 * Get direct message chats with pagination
 */
async function getChats(token, page, perPage) {
    const opts = page !== undefined || perPage !== undefined
        ? { page, per_page: perPage }
        : null;
    try {
        return await promisify((cb) => API.Chats.index(token, opts, cb), 'Chats.index');
    }
    catch (error) {
        if (error instanceof GroupMeAPIError)
            throw error;
        throw new GroupMeAPIError('Failed to fetch chats', error, 'Chats.index');
    }
}
/**
 * Get messages from a group with pagination support
 */
async function getMessages(token, groupId, opts) {
    try {
        return await promisify((cb) => API.Messages.index(token, groupId, opts || null, cb), 'Messages.index');
    }
    catch (error) {
        if (error instanceof GroupMeAPIError)
            throw error;
        throw new GroupMeAPIError(`Failed to fetch messages from group ${groupId}`, error, 'Messages.index');
    }
}
/**
 * Send a message to a group
 */
async function sendMessage(token, groupId, text) {
    if (!text || text.trim().length === 0) {
        throw new GroupMeAPIError('Message text cannot be empty', null, 'Messages.create');
    }
    // GroupMe has a limit of 1000 characters per message
    if (text.length > 1000) {
        throw new GroupMeAPIError('Message exceeds maximum length of 1000 characters', null, 'Messages.create');
    }
    try {
        const result = await promisify((cb) => API.Messages.create(token, groupId, { message: { text } }, cb), 'Messages.create');
        if (!result.message) {
            throw new GroupMeAPIError('Failed to send message: no message returned from API', null, 'Messages.create');
        }
        return result.message;
    }
    catch (error) {
        if (error instanceof GroupMeAPIError)
            throw error;
        throw new GroupMeAPIError('Failed to send message', error, 'Messages.create');
    }
}
/**
 * Send a reply to a specific message in a group
 */
async function sendReply(token, groupId, text, replyToMessageId) {
    if (!text || text.trim().length === 0) {
        throw new GroupMeAPIError('Message text cannot be empty', null, 'Messages.create');
    }
    if (text.length > 1000) {
        throw new GroupMeAPIError('Message exceeds maximum length of 1000 characters', null, 'Messages.create');
    }
    if (!replyToMessageId || replyToMessageId.trim().length === 0) {
        throw new GroupMeAPIError('Reply-to message ID cannot be empty', null, 'Messages.create');
    }
    try {
        // GroupMe uses a special reply attachment format
        const result = await promisify((cb) => API.Messages.create(token, groupId, {
            message: {
                text,
                attachments: [{
                        type: 'reply',
                        reply_id: replyToMessageId
                    }]
            }
        }, cb), 'Messages.create');
        if (!result.message) {
            throw new GroupMeAPIError('Failed to send reply: no message returned from API', null, 'Messages.create');
        }
        return result.message;
    }
    catch (error) {
        if (error instanceof GroupMeAPIError)
            throw error;
        throw new GroupMeAPIError('Failed to send reply', error, 'Messages.create');
    }
}
/**
 * Get direct messages with a specific user
 */
async function getDirectMessages(token, otherUserId, opts) {
    try {
        return await promisify((cb) => API.DirectMessages.index(token, { other_user_id: otherUserId, ...opts }, cb), 'DirectMessages.index');
    }
    catch (error) {
        if (error instanceof GroupMeAPIError)
            throw error;
        throw new GroupMeAPIError(`Failed to fetch direct messages with user ${otherUserId}`, error, 'DirectMessages.index');
    }
}
/**
 * Send a direct message to a user
 */
async function sendDirectMessage(token, recipientId, text) {
    if (!text || text.trim().length === 0) {
        throw new GroupMeAPIError('Message text cannot be empty', null, 'DirectMessages.create');
    }
    if (text.length > 1000) {
        throw new GroupMeAPIError('Message exceeds maximum length of 1000 characters', null, 'DirectMessages.create');
    }
    try {
        const result = await promisify((cb) => API.DirectMessages.create(token, { direct_message: { recipient_id: recipientId, text } }, cb), 'DirectMessages.create');
        if (!result.direct_message) {
            throw new GroupMeAPIError('Failed to send direct message: no message returned from API', null, 'DirectMessages.create');
        }
        return result.direct_message;
    }
    catch (error) {
        if (error instanceof GroupMeAPIError)
            throw error;
        throw new GroupMeAPIError('Failed to send direct message', error, 'DirectMessages.create');
    }
}
/**
 * Get current user information
 */
async function getCurrentUser(token) {
    try {
        return await promisify((cb) => API.Users.me(token, cb), 'Users.me');
    }
    catch (error) {
        if (error instanceof GroupMeAPIError)
            throw error;
        throw new GroupMeAPIError('Failed to fetch user information', error, 'Users.me');
    }
}
/**
 * Helper to handle API errors consistently in commands
 */
function handleAPIError(error) {
    if (error instanceof GroupMeAPIError) {
        console.error(`Error: ${error.message}`);
        if (error.statusCode) {
            console.error(`Status: ${error.statusCode}`);
        }
    }
    else if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
    }
    else {
        console.error('Error: An unknown error occurred');
    }
    process.exit(1);
}
//# sourceMappingURL=api.js.map