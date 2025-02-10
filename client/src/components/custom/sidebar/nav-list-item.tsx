import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Group } from "@/lib/api/group";
import { useGroupStore } from "@/lib/store";

import { Ellipsis, Hash, UsersRound } from "lucide-react";
import { useState } from "react";
import { InvitesDialog } from "./invites-dialog";

function NavListItemAction({ group }: { group: Group }) {
    const [isInvitesOpen, setInvitesOpen] = useState(false);

    const onInvitesClick = () => {
        setInvitesOpen(!isInvitesOpen);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuAction className="hover:group-hover:brightness-150">
                        <Ellipsis />
                    </SidebarMenuAction>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent side="right" align="start">
                    <DropdownMenuItem onClick={onInvitesClick}>
                        <UsersRound />
                        <span>Invites</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <InvitesDialog
                group={group}
                open={isInvitesOpen}
                onOpenChange={setInvitesOpen}
            />
        </>
    );
}

export function NavListItem({ group }: { group: Group }) {
    const groupStore = useGroupStore();
    const handleClick = () => {
        groupStore.selectGroup(group.id);
    };

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                onClick={handleClick}
                isActive={groupStore.selectedGroupId == group.id}
            >
                <Hash />
                <span>{group.name}</span>
            </SidebarMenuButton>

            <NavListItemAction group={group} />
        </SidebarMenuItem>
    );
}
