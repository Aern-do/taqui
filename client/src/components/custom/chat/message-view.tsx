import { useUser } from "@/hooks/api";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Message } from "@/lib/api/message";
import moment from "moment";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";

export default function MessageView({ message }: { message: Message }) {
    const { data, isLoading } = useUser(message.userId);
    if (isLoading) return;

    const fallback = data?.username.slice(0, 1);

    const offset = moment().utcOffset();
    const createdAt = moment(message.createdAt).add(offset, "minutes");

    return (
        <ContextMenu>
            <ContextMenuTrigger className="flex px-2 w-full items-center space-x-2 hover:bg-white/5">
                <Avatar>
                    <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                        <h1 className="font-semibold">{data?.username}</h1>
                        <p className="text-sm text-muted-foreground">
                            Today at {createdAt.format("hh:mm a")}
                        </p>
                    </div>

                    <p>{message.content}</p>
                </div>
            </ContextMenuTrigger>
            
            <ContextMenuContent>
                <ContextMenuItem>Edit</ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
