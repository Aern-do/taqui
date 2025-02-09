import { instance } from "./axios";

export interface Message {
    readonly id: string;
    readonly userId: string;
    readonly groupId: string;
    readonly createdAt: string;
    readonly content: string;
}

export interface FetchMessagesParams {
    limit: number;
    before?: string;
}

export interface CreateMessageRequest {
    groupId: string;
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

    static async create(
        request: CreateMessageRequest,
    ): Promise<Message> {
        console.log(request);
        const { data } = await instance.post<Message>(
            `${Messages.getBasePath(request.groupId)}`,
            request,
        );

        return data;
    }
}
