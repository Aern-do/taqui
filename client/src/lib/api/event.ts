import { QueryClient } from "@tanstack/react-query";
import { Message } from "./message";
import { BASE_URL } from "./axios";
import { match } from "ts-pattern";
import { User } from "./users";
import { TypingStore } from "../store";

export const EVENT_SOURCE_NAME = "taqui";

export type BaseEvent<Name extends string, Data> = { event: Name; data: Data };

export interface DeleteMessageEvent {
    groupId: string;
    messageId: string;
}

export interface StartTypingEvent {
    groupId: string;
    user: User;
}

export interface EndTypingEvent {
    groupId: string;
    user: User;
}

export type Event =
    | BaseEvent<"newMessage", Message>
    | BaseEvent<"editMessage", Message>
    | BaseEvent<"deleteMessage", DeleteMessageEvent>
    | BaseEvent<"startTyping", StartTypingEvent>
    | BaseEvent<"endTyping", EndTypingEvent>;

export class UpdatesEventSource extends EventSource {
    constructor(
        url: string,
        private queryClient: QueryClient,
        private typing: TypingStore,
    ) {
        super(`${BASE_URL}${url}`, { withCredentials: true });

        this.addEventListener(EVENT_SOURCE_NAME, this.handleEvent.bind(this));
    }

    private handleEvent(raw: MessageEvent) {
        const data = JSON.parse(raw.data) as Event;

        match(data)
            .with({ event: "deleteMessage" }, ({ data }) =>
                this.handleDeleteMessage(data),
            )
            .with({ event: "editMessage" }, ({ data }) =>
                this.handleEditMessage(data),
            )
            .with({ event: "newMessage" }, ({ data }) =>
                this.handleNewMessage(data),
            )
            .with({ event: "startTyping" }, ({ data }) => {
                this.handleStartTyping(data);
            })
            .with({ event: "endTyping" }, ({ data }) => {
                this.handleEndTyping(data);
            }).exhaustive;
    }

    private handleNewMessage(message: Message) {
        const messages =
            this.queryClient.getQueryData<Message[]>([
                "messages",
                message.groupId,
            ]) ?? [];

        this.queryClient.setQueryData(
            ["messages", message.groupId],
            [...messages, message],
        );
    }

    private handleEditMessage(newMessage: Message) {
        const messages =
            this.queryClient.getQueryData<Message[]>([
                "messages",
                newMessage.groupId,
            ]) ?? [];

        this.queryClient.setQueryData(
            ["messages", newMessage.groupId],
            messages.map((message) =>
                message.id == newMessage.id ? newMessage : message,
            ),
        );
    }

    private handleDeleteMessage(event: DeleteMessageEvent) {
        const messages =
            this.queryClient.getQueryData<Message[]>([
                "messages",
                event.groupId,
            ]) ?? [];

        this.queryClient.setQueryData(
            ["messages", event.groupId],
            messages.filter((message) => message.id != event.messageId),
        );
    }

    private handleStartTyping(event: StartTypingEvent) {
        this.typing.add(event.user);
    }

    private handleEndTyping(event: EndTypingEvent) {
        this.typing.remove(event.user);
    }
}
