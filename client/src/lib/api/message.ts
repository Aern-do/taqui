import { instance } from "./axios";

export interface Message {
    readonly id: string;
    readonly userId: string;
    readonly groupId: string;
    readonly content: string;

    readonly createdAt: string;
    readonly updatedAt?: string;
}

export interface FetchMessagesParams {
    limit: number;
    before?: string;
}

export interface CreateMessageRequest {
    groupId: string;
    content: string;
}

export interface EditMessageRequest {
    groupId: string;
    messageId: string;
    content: string;
}

export class Messages {
    private static getBasePath(groupId: string): string {
        return `/groups/${groupId}/messages`;
    }

    static async fetchAll(
        groupId: string,
        params: FetchMessagesParams,
    ): Promise<Message[]> {
        const { data } = await instance.get<Message[]>(
            `${Messages.getBasePath(groupId)}`,
            {
                params: {
                    before: params?.before,
                    limit: params.limit,
                },
            },
        );

        return data;
    }

    static async create(request: CreateMessageRequest): Promise<Message> {
        const { data } = await instance.post<Message>(
            `${Messages.getBasePath(request.groupId)}`,
            request,
        );

        return data;
    }

    static async edit(request: EditMessageRequest): Promise<Message> {
        const { data } = await instance.patch<Message>(
            `${Messages.getBasePath(request.groupId)}/${request.messageId}`,
            request
        );

        return data;
    }
}
