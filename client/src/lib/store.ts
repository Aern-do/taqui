import { Nullable } from "./utils";
import { create } from "zustand";

interface GroupStore {
    selectedGroupId: Nullable<string>;
    selectGroup: (groupId: string) => void;
}

export const useGroupStore = create<GroupStore>()((set) => ({
    selectedGroupId: null,
    selectGroup: (groupId) => {
        set({ selectedGroupId: groupId });
    },
}));
