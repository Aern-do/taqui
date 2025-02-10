import { SubmitHandler, useForm } from "react-hook-form";
import { Input } from "../../ui/input";
import { Form } from "@/components/ui/form";
import { Messages } from "@/lib/api/message";
import { useGroupStore } from "@/lib/store";
import { useSelectedGroup } from "@/hooks/api";
import { useMutationWithErrorHandling } from "@/hooks/use-mutation";
import { useErrorHandler } from "@/hooks/use-error-handler";

interface MessageInputData {
    content: string;
}

export default function MessageInput() {
    const { selectedGroupId } = useGroupStore();
    const { data, isLoading } = useSelectedGroup();

    const form = useForm<MessageInputData>();
    const { handleSubmit, register, reset, setError } = form;

    const handleError = useErrorHandler({
        setError,
    });

    const { mutateAsync } = useMutationWithErrorHandling({
        mutationFn: Messages.create,
        onError: handleError,
    });

    if (isLoading) return;

    const onSubmit: SubmitHandler<MessageInputData> = async (data) => {
        reset();

        await mutateAsync({
            groupId: selectedGroupId!!,
            content: data.content,
        });
    };

    return (
        <Form {...form}>
            <form
                className="px-4"
                onSubmit={handleSubmit(onSubmit)}
                autoComplete="off"
            >
                <Input
                    {...register("content")}
                    placeholder={`Message #${data?.name}`}
                    autoComplete="off"
                />
            </form>
        </Form>
    );
}
