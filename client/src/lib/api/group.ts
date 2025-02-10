import { instance } from "./axios";
import { User } from "./users";

export interface Member {
    readonly userId: string;
    readonly groupId: string;
    readonly joinedAt: string;
}

export interface Group {
    readonly id: string;
    readonly ownerId: string;
    readonly name: string;
}

export interface CreateGroupRequest {
    name: string;
}

export class Groups {
    private static readonly BASE_PATH = "/groups";

    static getUpdatesPath(id: string): string {
        return `${Groups.BASE_PATH}/${id}/updates`;
    }

    static async fetchMembers(id: string): Promise<User[]> {
        const { data } = await instance.get<User[]>(`${Groups.BASE_PATH}/${id}/members`);
        return data
    }

    static async fetchAll(): Promise<Group[]> {
        const { data } = await instance.get<Group[]>(Groups.BASE_PATH);
        return data;
    }

    static async fetch(id: string): Promise<Group> {
        const { data } = await instance.get<Group>(`${Groups.BASE_PATH}/${id}`);
        return data;
    }

    static async create(request: CreateGroupRequest): Promise<Group> {
        const { data } = await instance.post<Group>(Groups.BASE_PATH, request);
        return data;
    }
}
