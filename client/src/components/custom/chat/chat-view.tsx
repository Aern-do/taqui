import { useEvents, useMessages } from "@/hooks/api";
import MessageInput from "./message-input";
import MessageView from "./message-view";
import { useChatStore, useTypingStore } from "@/lib/store";
import { useEffect, useMemo, useRef } from "react";
import { Groups } from "@/lib/api/group";
import GroupHeader from "./group-header";
import { Message } from "@/lib/api/message";
import TypingIndicator from "./typing-indicator";
import { useMe } from "@/lib/hooks";

interface GroupedMessage {
    message: Message;
    showHeader: boolean;
}

export default function ChatView() {
    const groupStore = useChatStore();
    const { users } = useTypingStore();

    const endRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<HTMLDivElement>(null);

    const { data: messages, isLoading: isMessagesLoading } = useMessages(
        groupStore.selectedGroup!!,
    );
    const { data: me, isLoading: isMeLoading } = useMe();

    useEvents(Groups.getUpdatesPath(groupStore.selectedGroup!!), [
        groupStore.selectedGroup,
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

    if (isMessagesLoading || isMeLoading) return;

    return (
        <div className="space-b-4 flex min-w-0 max-w-full flex-1 flex-col">
            <GroupHeader />

            <div
                ref={messagesRef}
                className="flex h-px min-w-0 flex-auto flex-col overflow-y-auto pb-4"
            >
                {groupedMessages.map(({ message, showHeader }) => (
                    <MessageView
                        key={message.id}
                        message={message}
                        showHeader={showHeader}
                    />
                ))}
                <div ref={endRef} />
            </div>

            <MessageInput />
            <TypingIndicator users={users.filter((user) => user.id != me?.id)} />
        </div>
    );
}
