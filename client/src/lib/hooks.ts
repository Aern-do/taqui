import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Group, Groups } from "./api/group";
import { Auth } from "./api/auth";
import { User } from "./api/users";

export function useMe(): UseQueryResult<User> {
    return useQuery<User>({
        queryKey: ["me"],
        queryFn: Auth.me,
    });
}

export function useGroups(): UseQueryResult<Group[]> {
    return useQuery<Group[]>({
        queryKey: ["groups"],
        queryFn: Groups.fetchAll,
    });
}
