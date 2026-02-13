export interface GroupMeConfig {
    token: string;
}
export interface User {
    id: string;
    user_id: string;
    nickname: string;
    muted: boolean;
    image_url: string | null;
    autokicked: boolean;
    app_installed: boolean;
    guid: string;
}
export interface GroupMember {
    user_id: string;
    nickname: string;
    image_url: string | null;
    id: string;
    muted: boolean;
    autokicked: boolean;
    roles: string[];
    name: string;
}
export interface Group {
    id: string;
    group_id: string;
    name: string;
    phone_number: string;
    type: string;
    description: string;
    image_url: string | null;
    creator_user_id: string;
    created_at: number;
    updated_at: number;
    muted_until: number | null;
    office_mode: boolean;
    share_url: string | null;
    share_qr_code_url: string | null;
    members: GroupMember[];
    messages: {
        count: number;
        last_message_id: string;
        last_message_created_at: number;
        preview: {
            nickname: string;
            text: string;
            image_url: string | null;
            attachments: Attachment[];
        };
    };
    max_members: number;
}
export interface Attachment {
    type: 'image' | 'location' | 'split' | 'emoji' | 'mentions' | 'reply';
    url?: string;
    name?: string;
    lat?: string;
    lng?: string;
    token?: string;
    placeholder?: string;
    charmap?: number[][];
    user_ids?: string[];
    loci?: number[][];
    reply_id?: string;
}
export interface Message {
    id: string;
    source_guid: string;
    created_at: number;
    user_id: string;
    group_id: string;
    name: string;
    avatar_url: string | null;
    text: string | null;
    system: boolean;
    favorited_by: string[];
    attachments: Attachment[];
    sender_type: 'user' | 'bot' | 'system';
    sender_id: string;
}
export interface MessagesResponse {
    count: number;
    messages: Message[];
}
export interface Chat {
    created_at: number;
    updated_at: number;
    messages_count: number;
    last_message: {
        attachments: Attachment[];
        avatar_url: string | null;
        conversation_id: string;
        created_at: number;
        favorited_by: string[];
        id: string;
        name: string;
        recipient_id: string;
        sender_id: string;
        sender_type: string;
        source_guid: string;
        text: string | null;
        user_id: string;
    };
    other_user: {
        avatar_url: string | null;
        id: string;
        name: string;
    };
}
export interface DirectMessage {
    id: string;
    source_guid: string;
    recipient_id: string;
    user_id: string;
    created_at: number;
    name: string;
    avatar_url: string | null;
    text: string | null;
    favorited_by: string[];
    attachments: Attachment[];
    sender_id: string;
    sender_type: string;
    conversation_id: string;
}
export interface DirectMessagesResponse {
    count: number;
    direct_messages: DirectMessage[];
}
export interface UserMe {
    id: string;
    user_id: string;
    phone_number: string;
    image_url: string | null;
    name: string;
    created_at: number;
    updated_at: number;
    email: string;
    sms: boolean;
}
export type GroupMeCallback<T> = (err: Error | null, result: T) => void;
export interface GroupMeStatelessAPI {
    Groups: {
        index(token: string, callback: GroupMeCallback<Group[]>): void;
        former(token: string, callback: GroupMeCallback<Group[]>): void;
        show(token: string, groupId: string, callback: GroupMeCallback<Group>): void;
        create(token: string, opts: {
            name: string;
            description?: string;
            image_url?: string;
            share?: boolean;
        }, callback: GroupMeCallback<Group>): void;
        update(token: string, groupId: string, opts: {
            name?: string;
            description?: string;
            image_url?: string;
            share?: boolean;
        }, callback: GroupMeCallback<Group>): void;
        destroy(token: string, groupId: string, callback: GroupMeCallback<number>): void;
    };
    Members: {
        add(token: string, groupId: string, opts: {
            members: {
                nickname: string;
                user_id?: string;
                phone_number?: string;
                email?: string;
                guid?: string;
            }[];
        }, callback: GroupMeCallback<{
            results_id: string;
        }>): void;
        results(token: string, groupId: string, resultsId: string, callback: GroupMeCallback<{
            members: GroupMember[];
        }>): void;
        remove(token: string, groupId: string, memberId: string, callback: GroupMeCallback<number>): void;
    };
    Messages: {
        index(token: string, groupId: string, opts: {
            before_id?: string;
            after_id?: string;
            limit?: number;
        } | null, callback: GroupMeCallback<MessagesResponse>): void;
        create(token: string, groupId: string, opts: {
            message: {
                text: string;
                attachments?: Attachment[];
            };
        }, callback: GroupMeCallback<{
            message: Message;
        }>): void;
    };
    Chats: {
        index(token: string, opts: {
            page?: number;
            per_page?: number;
        } | null, callback: GroupMeCallback<Chat[]>): void;
    };
    DirectMessages: {
        index(token: string, opts: {
            other_user_id: string;
            before_id?: string;
            after_id?: string;
        }, callback: GroupMeCallback<DirectMessagesResponse>): void;
        create(token: string, opts: {
            direct_message: {
                recipient_id: string;
                text: string;
                attachments?: Attachment[];
            };
        }, callback: GroupMeCallback<{
            direct_message: DirectMessage;
        }>): void;
    };
    Likes: {
        create(token: string, groupId: string, messageId: string, callback: GroupMeCallback<number>): void;
        destroy(token: string, groupId: string, messageId: string, callback: GroupMeCallback<number>): void;
    };
    Bots: {
        create(token: string, name: string, groupId: string, opts: {
            avatar_url?: string;
            callback_url?: string;
        } | null, callback: GroupMeCallback<{
            bot: {
                bot_id: string;
                group_id: string;
                name: string;
                avatar_url: string | null;
                callback_url: string | null;
            };
        }>): void;
        post(token: string, botId: string, text: string, opts: {
            picture_url?: string;
        } | null, callback: GroupMeCallback<number>): void;
        index(token: string, callback: GroupMeCallback<{
            bot_id: string;
            group_id: string;
            name: string;
            avatar_url: string | null;
            callback_url: string | null;
        }[]>): void;
        destroy(token: string, botId: string, callback: GroupMeCallback<number>): void;
    };
    Users: {
        me(token: string, callback: GroupMeCallback<UserMe>): void;
    };
    Polls: {
        index(token: string, groupId: string, continuationToken: string | null, callback: GroupMeCallback<unknown>): void;
        create(token: string, groupId: string, opts: {
            subject: string;
            options: string[];
            expiration?: number;
        }, callback: GroupMeCallback<unknown>): void;
    };
}
//# sourceMappingURL=types.d.ts.map