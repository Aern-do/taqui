import { UpdatesEventSource } from "@/lib/api/event";
import { Group, Groups } from "@/lib/api/group";
import { Invite, Invites } from "@/lib/api/invite";
import { Message, Messages } from "@/lib/api/message";
import { User, Users } from "@/lib/api/users";
import { useGroupStore } from "@/lib/store";
import {
    useQuery,
    useQueryClient,
    UseQueryResult,
} from "@tanstack/react-query";
import { DependencyList, useEffect } from "react";

export function useSelectedGroup(): UseQueryResult<Group> {
    const groupStore = useGroupStore();

    return useQuery({
        queryKey: ["groups", groupStore.selectedGroupId!!],
        queryFn: ({ queryKey: [_key, id] }) => Groups.fetch(id),
    });
}

export function useMessages(id?: string): UseQueryResult<Message[]> {
    return useQuery({
        queryKey: ["messages", id],
        queryFn: ({ queryKey: [_key, id] }) =>
            id ? Messages.fetchAll(id, { limit: 50 }) : [],
    });
}

export function useUser(id: string): UseQueryResult<User> {
    return useQuery({
        queryKey: ["users", id],
        queryFn: ({ queryKey: [_key, id] }) => Users.fetch(id),
    });
}

export function useInvites(groupId: string): UseQueryResult<Invite[]> {
    return useQuery({
        queryKey: ["invites", groupId],
        queryFn: ({ queryKey: [_key, groupId] }) => Invites.fetchAll(groupId),
    });
}

export function useEvents(url: string, dependencies: DependencyList) {
    const client = useQueryClient();

    useEffect(() => {
        const source = new UpdatesEventSource(url, client);

        return () => source.close();
    }, dependencies);
}
