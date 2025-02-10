import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DialogProps } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Group } from "@/lib/api/group";
import { useInvites } from "@/hooks/api";
import InviteView from "../invite-view";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Invites } from "@/lib/api/invite";

export type InvitesDialogProps = DialogProps & {
    group: Group;
};

export function InvitesDialog({ group, ...props }: InvitesDialogProps) {
    const queryClient = useQueryClient();

    const { data: invites, isLoading } = useInvites(group.id);
    const { mutateAsync } = useMutation({
        mutationFn: Invites.create,
        onSuccess: (invite) =>
            queryClient.invalidateQueries({
                queryKey: ["invites", invite.groupId],
            }),
    });

    if (isLoading) return;

    const handleClick = async () => {
        await mutateAsync(group.id);
    };

    return (
        <Dialog {...props}>
            <DialogContent className="flex max-h-[80vh] flex-col">
                <DialogHeader>
                    <DialogTitle>Invites</DialogTitle>
                    <DialogDescription>
                        Create, view, and delete invitations to your group
                    </DialogDescription>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col space-y-4">
                    <Button onClick={handleClick} className="w-full">
                        Create New Invite
                    </Button>

                    <div className="flex flex-col space-y-2 overflow-y-auto">
                        {invites?.map((invite) => (
                            <InviteView key={invite.id} invite={invite} />
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
