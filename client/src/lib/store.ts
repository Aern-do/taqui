import { create } from "zustand";

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
