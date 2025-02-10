import { LogIn, Plus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarGroupAction } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import CreateGroupDialog from "./create-group-dialog";
import JoinGroupDialog from "./join-group-dialog";

export function NavListAction() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <SidebarGroupAction title="Group Actions">
                        <Button variant="ghost" size="icon">
                            <Plus />
                        </Button>
                    </SidebarGroupAction>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsJoinDialogOpen(true)}>
                        <LogIn className="mr-2 h-4 w-4" />
                        <span>Join Group</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Create Group</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CreateGroupDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />

            <JoinGroupDialog
                open={isJoinDialogOpen}
                onOpenChange={setIsJoinDialogOpen}
            />
        </>
    );
}
