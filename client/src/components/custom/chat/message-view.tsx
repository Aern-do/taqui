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

function formatMoment(date: Moment): string {
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

    const isEditing = selectedMessage === message.id;

    return (
        <ContextMenu>
            <ContextMenuTrigger
                className={cn(
                    "hover:bg-accent/50z flex w-full px-4",
                    showHeader ? "mt-4" : "mt-1",
                    isEditing && "bg-accent/50",
                )}
            >
                <div className="mr-3 w-[40px]">
                    {showHeader && <AvatarView user={user} />}
                </div>

                <div className="flex-1">
                    {showHeader && (
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">
                                {user.username}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {formatMoment(createdAt)}
                            </span>
                        </div>
                    )}

                    {isEditing ? (
                        <EditMessageView message={message} />
                    ) : (
                        <div className="whitespace-pre-wrap break-words">
                            {message.content}
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
