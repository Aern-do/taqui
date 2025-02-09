import { instance } from "./axios";

export interface Invite {
    readonly id: string;
    readonly code: string;
    readonly uses: number;

    readonly userId: string;
    readonly groupId: string;
    readonly createdAt: string;
}

export class Invites {
    private static getGroupBasePath(groupId: string): string {
        return `/groups/${groupId}/invites`;
    }

    private static basePath = "/invites";

    public static async fetchAll(groupId: string): Promise<Invite[]> {
        const { data } = await instance.get<Invite[]>(
            Invites.getGroupBasePath(groupId),
        );

        return data;
    }

    public static async create(groupId: string): Promise<Invite> {
        const { data } = await instance.post<Invite>(
            Invites.getGroupBasePath(groupId),
        );

        return data;
    }

    public static async accept(code: string): Promise<void> {
        await instance.post(`${Invites.basePath}/${code}`);
    }
}
