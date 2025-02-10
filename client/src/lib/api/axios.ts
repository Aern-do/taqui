import axios, { HttpStatusCode } from "axios";

export const BASE_URL = "/api";

export const instance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export async function verifyToken(): Promise<boolean> {
    const response = await instance.get("/auth/me", {
        validateStatus: () => true,
    });

    return response.status == HttpStatusCode.Ok;
}

export interface User {
    id: string,
    username: string,
    createdAt: string
}

export async function me(): Promise<User> {
    const response = await instance.get("/auth/me");
    return response.data;
}

export interface LoginBody {
    username: string;
    password: string;
}

export async function login(body: LoginBody) {
    await instance.post<LoginBody>("/auth/login", body)
}

export interface RegisterBody {
    username: string;
    password: string;
}

export async function register(body: RegisterBody) {
    await instance.post<LoginBody>("/auth/register", body)
}

export async function logout() {
    await instance.post("/auth/logout");
}