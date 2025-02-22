import axios, { HttpStatusCode } from "axios";

export const BASE_URL = import.meta.env.VITE_BASE_URL ?? "/api";

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