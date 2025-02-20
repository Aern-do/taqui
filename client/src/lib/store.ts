import { create } from "zustand";
import { User } from "./api/users";

interface ChatStore {
    selectedGroup: string | null;
    selectedMessage: string | null;

    selectGroup: (group: string) => void;
    selectMessage: (message: string) => void;
    unselectMessage: () => void;
}

export const useChatStore = create<ChatStore>()((set) => ({
    selectedMessage: null,
    selectedGroup: null,

    selectGroup: (group) => {
        set({ selectedGroup: group });
    },
    selectMessage: (message) => {
        set({ selectedMessage: message });
    },
    unselectMessage: () => {
        set({ selectedMessage: null });
    },
}));

export interface TypingStore {
    users: User[];

    add: (user: User) => void;
    remove: (user: User) => void;
}

export const useTypingStore = create<TypingStore>()((set) => ({
    users: [],

    add: (user) =>
        set((state) => ({
            users: state.users.some((u) => u.id === user.id)
                ? state.users
                : [...state.users, user],
        })),

    remove: (user) => {
        set((state) => ({
            users: state.users.filter((u) => u.id != user.id),
        }));
    },
}));
