import { useUser } from "@/hooks/api";
import { Message } from "@/lib/api/message";
import moment, { Moment } from "moment";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import AvatarView from "../avatar-view";
import { useChatStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import EditMessageView from "./edit-message-view";
import { useMe } from "@/lib/hooks";

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
                    "hover:bg-accent/50 flex w-full px-4",
                    showHeader ? "mt-4" : "mt-1",
                    isEditing && "bg-accent/50",
                )}
            >
                <div className="mr-3 w-[40px] h-full flex items-center">
                    {showHeader && <AvatarView user={user} />}
                </div>

                <div className="flex-1">
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
                        <div className="flex space-x-2 whitespace-pre-wrap break-words">
                            <span>{message.content}</span>

                            {message.updatedAt && (
                                <i className="text-muted-foreground font-light">
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
                        Edit
                    </ContextMenuItem>
                </ContextMenuContent>
            )}
        </ContextMenu>
    );
}
