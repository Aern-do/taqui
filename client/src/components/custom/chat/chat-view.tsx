import { useEvents, useMessages } from "@/hooks/api";
import MessageInput from "./message-input";
import MessageView from "./message-view";
import { useGroupStore } from "@/lib/store";
import { useEffect, useMemo, useRef } from "react";
import { Groups } from "@/lib/api/group";
import GroupHeader from "./group-header";
import { Message } from "@/lib/api/message";

interface GroupedMessage {
    message: Message;
    showHeader: boolean;
}

export default function ChatView() {
    const groupStore = useGroupStore();
    const endRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<HTMLDivElement>(null);

    const { data: messages, isLoading: isMessagesLoading } = useMessages(
        groupStore.selectedGroupId!!,
    );

    useEvents(Groups.getUpdatesPath(groupStore.selectedGroupId!!), [
        groupStore.selectedGroupId,
    ]);

    useEffect(() => {
        if (!messagesRef.current) return;

        const observer = new ResizeObserver(() => {
            endRef.current?.scrollIntoView({ behavior: "auto" });
        });

        observer.observe(messagesRef.current);
        return () => observer.disconnect();
    }, [messages]);

    const groupedMessages = useMemo(() => {
        if (!messages) return [] as GroupedMessage[];

        const TEN_MINUTES_MS = 10 * 60 * 1000;

        return messages.reduce<GroupedMessage[]>((groups, message, index) => {
            const currentTime = new Date(message.createdAt).getTime();
            const previousMessage = messages[index - 1];

            const showHeader =
                !previousMessage ||
                previousMessage.userId !== message.userId ||
                currentTime - new Date(previousMessage.createdAt).getTime() >
                    TEN_MINUTES_MS;

            groups.push({ message, showHeader });
            return groups;
        }, []);
    }, [messages]);

    if (isMessagesLoading) return;

    return (
        <div className="space-b-4 flex min-w-0 max-w-full flex-1 flex-col pb-4">
            <GroupHeader />

            <div
                ref={messagesRef}
                className="flex h-px min-w-0 flex-auto flex-col overflow-y-auto pb-4"
            >
                {groupedMessages.map(({ message, showHeader }, index) => (
                    <div
                        key={message.id}
                        className={`${
                            showHeader ? "mt-4" : "mt-1"
                        } ${index === 0 ? "mt-0" : ""}`}
                    >
                        <MessageView
                            message={message}
                            showHeader={showHeader}
                        />
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            <MessageInput />
        </div>
    );
}
