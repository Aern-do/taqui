import { SubmitHandler, useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Messages } from "@/lib/api/message";
import { useGroupStore } from "@/lib/store";
import { useSelectedGroup } from "@/hooks/api";
import { useMutationWithErrorHandling } from "@/hooks/use-mutation";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface MessageInputData {
    content: string;
}

const MAX_CHARS = 1000;

export default function MessageInput() {
    const { selectedGroupId } = useGroupStore();
    const { data, isLoading } = useSelectedGroup();
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const form = useForm<MessageInputData>({
        defaultValues: {
            content: "",
        },
    });

    const { handleSubmit, register, reset, setError, watch } = form;
    const content = watch("content");

    const handleError = useErrorHandler({
        setError,
    });

    const { mutateAsync } = useMutationWithErrorHandling({
        mutationFn: Messages.create,
        onError: handleError,
    });

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [content]);

    if (isLoading) return;

    const onSubmit: SubmitHandler<MessageInputData> = async (data) => {
        if (data.content.length > MAX_CHARS) return;
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
                <div className="relative">
                    <Textarea
                        {...register("content", {
                            maxLength: MAX_CHARS,
                        })}
                        ref={(e) => {
                            const { ref } = register("content");
                            if (typeof ref === "function") {
                                ref(e);
                            }
                            textareaRef.current = e;
                        }}
                        placeholder={`Message #${data?.name}`}
                        autoComplete="off"
                        rows={1}
                        className="max-h-[200px] min-h-[40px] resize-none pr-16"
                    />
                    <span
                        className={cn(
                            "absolute bottom-2 right-2 text-sm text-gray-400",
                            content?.length > MAX_CHARS && "text-destructive",
                        )}
                    >
                        {content?.length || 0}/{MAX_CHARS}
                    </span>
                </div>
            </form>
        </Form>
    );
}
