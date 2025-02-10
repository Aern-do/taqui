import { QueryClient } from "@tanstack/react-query";
import { Message } from "./message";
import { BASE_URL } from "./axios";
import { match } from "ts-pattern";

export const EVENT_SOURCE_NAME = "taqui";

export type BaseEvent<Name extends string, Data> = { event: Name; data: Data };

export type NewMessageEvent = BaseEvent<"newMessage", Message>;
export type Event = NewMessageEvent;

export class UpdatesEventSource extends EventSource {
    constructor(
        url: string,
        private queryClient: QueryClient,
    ) {
        super(`${BASE_URL}${url}`, { withCredentials: true });

        this.addEventListener(EVENT_SOURCE_NAME, this.handleEvent.bind(this));
    }

    private handleEvent(raw: MessageEvent) {
        const data = JSON.parse(raw.data) as Event;

        match(data).with({ event: "newMessage" }, ({ data }) =>
            this.handleNewMessage(data),
        ).exhaustive;
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
}
