import { useEvents, useMessages } from "@/hooks/api";
import MessageInput from "./message-input";
import MessageView from "./message-view";
import { useGroupStore } from "@/lib/store";
import { useEffect, useRef } from "react";
import { Groups } from "@/lib/api/group";

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

    if (isMessagesLoading) return;

    return (
        <div className="flex flex-1 flex-col space-y-4 py-4">
            <div
                ref={messagesRef}
                className="flex h-px flex-auto flex-col space-y-4 overflow-y-auto"
            >
                {messages?.map((message) => (
                    <MessageView key={message.id} message={message} />
                ))}
                <div ref={endRef} />
            </div>
            <MessageInput />
        </div>
    );
}
