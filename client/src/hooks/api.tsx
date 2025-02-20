import { UpdatesEventSource } from "@/lib/api/event";
import { Group, Groups } from "@/lib/api/group";
import { Invite, Invites } from "@/lib/api/invite";
import { Message, Messages } from "@/lib/api/message";
import { User, Users } from "@/lib/api/users";
import { useChatStore, useTypingStore } from "@/lib/store";
import {
    useQuery,
    useQueryClient,
    UseQueryResult,
} from "@tanstack/react-query";
import { DependencyList, useEffect } from "react";

export function useSelectedGroup(): UseQueryResult<Group> {
    const groupStore = useChatStore();

    return useQuery({
        queryKey: ["groups", groupStore.selectedGroup!!],
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

export function useMembers(groupId: string): UseQueryResult<Invite[]> {
    return useQuery({
        queryKey: ["members", groupId],
        queryFn: ({ queryKey: [_key, groupId] }) => Groups.fetchMembers(groupId),
    });
}

export function useEvents(url: string, dependencies: DependencyList) {
    const client = useQueryClient();
    const typing = useTypingStore();

    useEffect(() => {
        const source = new UpdatesEventSource(url, client, typing);

        return () => source.close();
    }, dependencies);
}