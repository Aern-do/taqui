import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { me, User } from "./api/axios";
import { Group, Groups } from "./api/group";

export function useMe(): UseQueryResult<User> {
    return useQuery<User>({
        queryKey: ["me"],
        queryFn: me,
    });
}

export function useGroups(): UseQueryResult<Group[]> {
    return useQuery<Group[]>({
        queryKey: ["groups"],
        queryFn: Groups.fetchAll
    })
}