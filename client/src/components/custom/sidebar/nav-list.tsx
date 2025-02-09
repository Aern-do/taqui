import { useGroups } from "@/lib/hooks";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
} from "../../ui/sidebar";

import { DropdownMenu, DropdownMenuTrigger } from "../../ui/dropdown-menu";

import { Ellipsis, Hash } from "lucide-react";
import { Group } from "@/lib/api/group";
import { useGroupStore } from "@/lib/store";
import { NavListAction } from "./nav-list-action";
import { NavListItem } from "./nav-list-item";

export default function NavList() {
    const { data, isLoading } = useGroups();
    const groups = isLoading ? [] : data!;

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Groups</SidebarGroupLabel>
            <NavListAction />

            <SidebarGroupContent>
                <SidebarMenu>
                    {groups.map((group) => (
                        <NavListItem key={group.id} group={group} />
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
