import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { verifyToken } from "./api/axios";
import { redirect } from "@tanstack/react-router";

export type Nullable<T> = T | null;

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export async function authenticate() {
    if (!(await verifyToken())) {
        throw redirect({
            to: "/login",
        });
    }
}
