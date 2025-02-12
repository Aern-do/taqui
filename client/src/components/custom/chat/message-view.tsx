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

function formatMoment(date: Moment): string {
    const now = moment();
    if (date.isSame(now, "day")) {
        return `Today at ${date.format("h:mm A")}`;
    } else if (date.isSame(now.subtract(1, "day"), "day")) {
        return `Yesterday at ${date.format("h:mm A")}`;
    } else if (date.isSame(now, "year")) {
        return date.format("MMM D [at] h:mm A");
    } else {
        return date.format("MMM D, YYYY [at] h:mm A");
    }
}

export default function MessageView({
    message,
    showHeader,
}: {
    message: Message;
    showHeader: boolean;
}) {
    const { data: user, isLoading } = useUser(message.userId);
    const offset = moment().utcOffset();
    const createdAt = moment(message.createdAt).add(offset, "minutes");

    if (isLoading || !user) return null;

    return (
        <ContextMenu>
            <ContextMenuTrigger className="flex items-center w-full min-w-0 max-w-full px-4 hover:bg-white/5">
                <div className="mr-3 w-[40px] min-w-[40px]">
                    {showHeader && <AvatarView user={user} />}
                </div>

                <div className="flex min-w-0 max-w-full flex-1 flex-col">
                    {showHeader && (
                        <div className="flex items-center space-x-2">
                            <h1 className="font-semibold">{user.username}</h1>
                            <p className="text-sm text-muted-foreground">
                                {formatMoment(createdAt)}
                            </p>
                        </div>
                    )}
                    <div className="min-w-0 max-w-full whitespace-pre-wrap break-words">
                        {message.content}
                    </div>
                </div>
            </ContextMenuTrigger>

            <ContextMenuContent>
                <ContextMenuItem>Edit</ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
