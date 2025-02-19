import { useUser } from "@/hooks/api";
import { Message, Messages } from "@/lib/api/message";
import moment, { Moment } from "moment";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuItemIcon,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import AvatarView from "../avatar-view";
import { useChatStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import EditMessageView from "./edit-message-view";
import { useMe } from "@/lib/hooks";
import { Pencil, Trash } from "lucide-react";
import { useMutationWithErrorHandling } from "@/hooks/use-mutation";
import { useErrorHandler } from "@/hooks/use-error-handler";

function formatDate(date: Moment): string {
    const now = moment();
    if (date.isSame(now, "day")) {
        return `Today at ${date.format("h:mm A")}`;
    } else if (date.isSame(now.subtract(1, "day"), "day")) {
        return `Yesterday at ${date.format("h:mm A")}`;
    } else if (date.isSame(now, "year")) {
        return date.format("MMM D [at] h:mm A");
    }
    return date.format("MMM D, YYYY [at] h:mm A");
}

function formatEditDate(editDate: Moment): string {
    const now = moment();
    if (editDate.isSame(now, "day")) {
        return `Edited today at ${editDate.format("h:mm A")}`;
    } else if (editDate.isSame(now.subtract(1, "day"), "day")) {
        return `Edited yesterday at ${editDate.format("h:mm A")}`;
    } else if (editDate.isSame(now, "year")) {
        return `Edited on ${editDate.format("MMM D [at] h:mm A")}`;
    }
    return `Edited on ${editDate.format("MMM D, YYYY [at] h:mm A")}`;
}

export default function MessageView({
    message,
    showHeader,
}: {
    message: Message;
    showHeader: boolean;
}) {
    const { selectMessage, selectedMessage } = useChatStore();
    const { data: user, isLoading: isLoadingUser } = useUser(message.userId);
    const { data: me, isLoading: isLoadingMe } = useMe();

    const handleError = useErrorHandler();
    const { mutateAsync } = useMutationWithErrorHandling({
        mutationFn: Messages.delete,
        onError: handleError,
    });

    const handleDelete = async () => {
        await mutateAsync({
            groupId: message.groupId,
            messageId: message.id,
        });
    };

    if ([isLoadingUser, isLoadingMe].some(Boolean) || !user || !me) return;

    const createdAt = moment(message.createdAt).add(
        moment().utcOffset(),
        "minutes",
    );
    const updatedAt = moment(message.updatedAt);

    const isEditing = selectedMessage === message.id;

    return (
        <ContextMenu>
            <ContextMenuTrigger
                className={cn(
                    "flex w-full min-w-0 px-4 hover:bg-accent/50",
                    showHeader ? "mt-4" : "mt-1",
                    isEditing && "bg-accent/50",
                )}
            >
                <div className="mr-3 flex h-full w-[40px] items-center">
                    {showHeader && <AvatarView user={user} />}
                </div>

                <div className="flex min-w-0 max-w-full flex-1 flex-col">
                    {showHeader && (
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">
                                {user.username}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {formatDate(createdAt)}
                            </span>
                        </div>
                    )}
                    {isEditing ? (
                        <EditMessageView message={message} />
                    ) : (
                        <div className="min-w-0 max-w-full space-x-2 whitespace-pre-wrap break-words">
                            <span className="min-w-0">{message.content}</span>

                            {message.updatedAt && (
                                <i className="font-light text-muted-foreground">
                                    ({formatEditDate(updatedAt)})
                                </i>
                            )}
                        </div>
                    )}
                </div>
            </ContextMenuTrigger>

            {message.userId == me.id && (
                <ContextMenuContent>
                    <ContextMenuItem onClick={() => selectMessage(message.id)}>
                        <ContextMenuItemIcon icon={Pencil} />
                        Edit
                    </ContextMenuItem>

                    <ContextMenuItem onClick={handleDelete}>
                        <ContextMenuItemIcon icon={Trash} />
                        Delete
                    </ContextMenuItem>
                </ContextMenuContent>
            )}
        </ContextMenu>
    );
}
