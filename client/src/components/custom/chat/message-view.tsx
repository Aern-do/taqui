import { useUser } from "@/hooks/api";
import { Message } from "@/lib/api/message";
import moment from "moment";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import AvatarView from "../avatar-view";

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
            <ContextMenuTrigger className="flex px-4 w-full hover:bg-white/5">
                <div className="w-[40px] min-w-[40px] mr-3">
                    {showHeader && <AvatarView user={user} />}
                </div>
                
                <div className="flex flex-col flex-1">
                    {showHeader && (
                        <div className="flex items-center space-x-2">
                            <h1 className="font-semibold">{user.username}</h1>
                            <p className="text-sm text-muted-foreground">
                                Today at {createdAt.format("hh:mm a")}
                            </p>
                        </div>
                    )}
                    
                    <p>{message.content}</p>
                </div>
            </ContextMenuTrigger>
            
            <ContextMenuContent>
                <ContextMenuItem>Edit</ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
