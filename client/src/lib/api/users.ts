import { instance } from "./axios";

export interface User {
    readonly id: string,
    readonly username: string,
    readonly createdAt: string
}

export class Users {
    private static readonly BASE_PATH = "/users";

    static async fetch(id: string): Promise<User> {
        const { data } = await instance.get(`${Users.BASE_PATH}/${id}`);
        return data;
    }
}  