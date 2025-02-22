import { instance } from "./axios";
import { User } from "./users";

export interface LoginRequest {
    username: string;
    password: string;
    token: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    token: string;
}

export class Auth {
    private static BASE_URL = "/auth";

    public static async me(): Promise<User> {
        const { data } = await instance.get<User>(
            `${Auth.BASE_URL}/me`,
        );

        return data;
    }

    public static async login(request: LoginRequest): Promise<User> {
        const { data: user } = await instance.post<User>(`${Auth.BASE_URL}/login`, request);

        return user;
    }

    public static async register(request: RegisterRequest): Promise<User> {
        const { data: user } = await instance.post<User>(`${Auth.BASE_URL}/register`, request);

        return user;
    }

    public static async logout(): Promise<void> {
        await instance.post(`${Auth.BASE_URL}/logout`)
    }
}
