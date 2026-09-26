import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import clsx from "clsx";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/format";
import type { ContactMessage } from "@/lib/types";
import { PageLoader } from "@/components/ui";
import { AdminPageHeader } from "./AdminLayout";

export function AdminMessagesPage() {
  const queryClient = useQueryClient();
  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContactMessage[];
    },
  });

  const setRead = useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      const { error } = await supabase.from("contact_messages").update({ is_read }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });

  return (
    <>
      <AdminPageHeader title="Messages" subtitle="Inquiries submitted through the contact form." />
      {isLoading ? (
        <PageLoader />
      ) : !messages?.length ? (
        <div className="card p-12 text-center text-slate-500">No messages yet.</div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={clsx("card p-5", !m.is_read && "border-l-4 border-l-gold-400")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={clsx("text-navy-900", !m.is_read ? "font-semibold" : "font-medium")}>
                    {m.name} <span className="font-normal text-slate-500">· {m.subject ?? "General"}</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    <a href={`mailto:${m.email}`} className="hover:text-navy-700">{m.email}</a>
                    {m.phone && <> · <a href={`tel:${m.phone}`} className="hover:text-navy-700">{m.phone}</a></>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="mr-2 text-xs text-slate-400">{formatDateTime(m.created_at)}</span>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-navy-900"
                    onClick={() => setRead.mutate({ id: m.id, is_read: !m.is_read })}
                    title={m.is_read ? "Mark unread" : "Mark read"}
                  >
                    {m.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => confirm("Delete this message?") && remove.mutate(m.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm whitespace-pre-line text-slate-700">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
