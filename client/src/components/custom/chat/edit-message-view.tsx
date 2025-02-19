import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useMutationWithErrorHandling } from "@/hooks/use-mutation";
import { Message, Messages } from "@/lib/api/message";
import { useChatStore } from "@/lib/store";
import { SubmitHandler, useForm } from "react-hook-form";

interface EditMessageData {
    content: string;
}

export default function EditMessageView({ message }: { message: Message }) {
    const { unselectMessage } = useChatStore();
    const form = useForm<EditMessageData>();
    const { handleSubmit, setError, control } = form;

    const handleError = useErrorHandler({
        setError,
    });
    const { mutateAsync } = useMutationWithErrorHandling({
        mutationFn: Messages.edit,
        onError: handleError,
    });

    const onSubmit: SubmitHandler<EditMessageData> = async (data) => {
        unselectMessage();

        await mutateAsync({
            messageId: message.id,
            groupId: message.groupId,
            content: data.content,
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormField
                    control={control}
                    name="content"
                    render={({ field }) => (
                        <Input
                            {...field}
                            autoFocus
                            defaultValue={message.content}
                            className="mt-1"
                        />
                    )}
                />
            </form>
        </Form>
    );
}
