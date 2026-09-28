import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  MessageSquare,
  Pencil,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { z } from "zod";
import { api } from "../api";
import { useAuth } from "../auth";
import { commentSchema, ticketSchema } from "../schemas";
import {
  canEditText,
  date,
  label,
  name,
  priorities,
  statuses,
  type Comment,
  type Page,
  type Ticket,
  type User,
} from "../types";
import {
  Avatar,
  Badge,
  Empty,
  ErrorBox,
  Field,
  Loading,
  PageHeader,
  Pagination,
} from "../components/ui";
type TicketInput = z.infer<typeof ticketSchema>;
function TicketForm({
  ticket,
  onDone,
}: {
  ticket?: Ticket;
  onDone: (ticket: Ticket) => void;
}) {
  const { user } = useAuth();
  const [assignee, setAssignee] = useState(
    ticket?.assignedTo?.id.toString() ?? "",
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TicketInput>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: ticket?.title ?? "",
      description: ticket?.description ?? "",
      priority: ticket?.priority ?? "MEDIUM",
    },
  });
  const managers = useQuery({
    queryKey: ["managers"],
    queryFn: ({ signal }) => api<User[]>("/users/managers", { signal }),
    enabled: user?.role === "ADMIN" && !ticket,
  });
  const mutation = useMutation({
    mutationFn: (values: TicketInput) =>
      api<Ticket>(ticket ? `/tickets/${ticket.id}` : "/tickets", {
        method: ticket ? "PATCH" : "POST",
        body:
          ticket && user?.role === "USER"
            ? { title: values.title, description: values.description }
            : {
                ...values,
                ...(!ticket && user?.role === "ADMIN" && assignee
                  ? { assignedToId: Number(assignee) }
                  : {}),
              },
      }),
    onSuccess: onDone,
  });
  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      <Field label="Title" error={errors.title?.message}>
        <input
          placeholder="A short summary of the request"
          {...register("title")}
        />
      </Field>
      <Field label="Description" error={errors.description?.message}>
        <textarea
          rows={7}
          placeholder="What happened? Include any details that could help us understand the request."
          {...register("description")}
        />
      </Field>
      {(!ticket || user?.role === "ADMIN") && (
        <Field label="Priority" error={errors.priority?.message}>
          <select {...register("priority")}>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {label(p)}
              </option>
            ))}
          </select>
        </Field>
      )}
      {!ticket && user?.role === "ADMIN" && (
        <Field label="Assign to">
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          >
            <option value="">Unassigned</option>
            {managers.data?.map((m) => (
              <option value={m.id} key={m.id}>
                {name(m)}
              </option>
            ))}
          </select>
        </Field>
      )}
      <ErrorBox error={mutation.error} />
      <div className="form-actions">
        <button className="button primary" disabled={mutation.isPending}>
          <Check size={16} />
          {mutation.isPending
            ? "Saving…"
            : ticket
              ? "Save changes"
              : "Create ticket"}
        </button>
      </div>
    </form>
  );
}
export function NewTicket() {
  const navigate = useNavigate();
  const client = useQueryClient();
  return (
    <>
      <Link className="back-link" to="/tickets">
        <ArrowLeft size={16} /> Back to tickets
      </Link>
      <PageHeader
        eyebrow="START A CONVERSATION"
        title="Create a ticket"
        subtitle="A few useful details help your team get to the right answer faster."
      />
      <div className="create-grid">
        <section className="panel form-panel">
          <TicketForm
            onDone={(ticket) => {
              void client.invalidateQueries({ queryKey: ["tickets"] });
              void client.invalidateQueries({ queryKey: ["statistics"] });
              navigate(`/tickets/${ticket.id}`);
            }}
          />
        </section>
        <aside className="tips-card">
          <MessageSquare size={24} />
          <h3>A good ticket tells a story.</h3>
          <p>
            Share what you expected, what actually happened, and any steps to
            reproduce the issue.
          </p>
          <hr />
          <p>
            You can add more context in the conversation once your ticket is
            created.
          </p>
        </aside>
      </div>
    </>
  );
}
function TicketProperties({ ticket }: { ticket: Ticket }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const managers = useQuery({
    queryKey: ["managers"],
    queryFn: ({ signal }) => api<User[]>("/users/managers", { signal }),
    enabled: user?.role === "ADMIN",
  });
  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<Ticket>(`/tickets/${ticket.id}`, { method: "PATCH", body }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["tickets"] });
      await client.invalidateQueries({ queryKey: ["statistics"] });
    },
  });
  const staff = user?.role !== "USER";
  return (
    <aside className="panel properties">
      <div className="panel-heading">
        <h2>Ticket details</h2>
      </div>
      <div className="properties-body">
        <Field label="Status">
          {staff ? (
            <select
              aria-label="Ticket status"
              disabled={mutation.isPending}
              value={ticket.status}
              onChange={(e) => mutation.mutate({ status: e.target.value })}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          ) : (
            <Badge value={ticket.status} />
          )}
        </Field>
        <Field label="Priority">
          {staff ? (
            <select
              aria-label="Ticket priority"
              disabled={mutation.isPending}
              value={ticket.priority}
              onChange={(e) => mutation.mutate({ priority: e.target.value })}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {label(p)}
                </option>
              ))}
            </select>
          ) : (
            <Badge value={ticket.priority} />
          )}
        </Field>
        <Field label="Assignee">
          {user?.role === "ADMIN" ? (
            <select
              aria-label="Ticket assignee"
              disabled={mutation.isPending}
              value={ticket.assignedTo?.id ?? ""}
              onChange={(e) =>
                mutation.mutate({
                  assignedToId: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              <option value="">Unassigned</option>
              {ticket.assignedTo &&
                !managers.data?.some((m) => m.id === ticket.assignedTo?.id) && (
                  <option value={ticket.assignedTo.id}>
                    {name(ticket.assignedTo)}
                  </option>
                )}
              {managers.data?.map((m) => (
                <option key={m.id} value={m.id}>
                  {name(m)}
                </option>
              ))}
            </select>
          ) : (
            <span className="inline-user">
              {ticket.assignedTo ? (
                <>
                  <Avatar user={ticket.assignedTo} small />
                  {name(ticket.assignedTo)}
                </>
              ) : (
                <>
                  <UserRound size={16} /> Unassigned
                </>
              )}
            </span>
          )}
        </Field>
        {user?.role === "MANAGER" && !ticket.assignedTo && (
          <button
            className="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ assignedToId: user.id })}
          >
            Assign to me
          </button>
        )}
        <ErrorBox error={mutation.error} />
        <hr />
        <div className="property">
          <span>Created by</span>
          <span className="inline-user">
            <Avatar user={ticket.createdBy} small />
            {name(ticket.createdBy)}
          </span>
        </div>
        <div className="property">
          <span>Created</span>
          <span>{date(ticket.createdAt)}</span>
        </div>
        <div className="property">
          <span>Last updated</span>
          <span>{date(ticket.updatedAt)}</span>
        </div>
      </div>
    </aside>
  );
}
function Conversation({ id }: { id: number }) {
  const [page, setPage] = useState(1);
  const client = useQueryClient();
  const comments = useQuery({
    queryKey: ["comments", id, page],
    queryFn: ({ signal }) =>
      api<Page<Comment>>(`/tickets/${id}/comments?page=${page}&perPage=10`, {
        signal,
      }),
  });
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
  });
  const mutation = useMutation({
    mutationFn: (body: z.infer<typeof commentSchema>) =>
      api(`/tickets/${id}/comments`, { method: "POST", body }),
    onSuccess: async () => {
      reset();
      setPage(Math.ceil(((comments.data?.meta.total ?? 0) + 1) / 10));
      await client.invalidateQueries({ queryKey: ["comments", id] });
      await client.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
  return (
    <section className="panel conversation">
      <div className="panel-heading">
        <h2>
          Conversation{" "}
          <span className="count">{comments.data?.meta.total ?? 0}</span>
        </h2>
        <MessageSquare size={18} />
      </div>
      <ErrorBox
        error={comments.error}
        retry={() => {
          void comments.refetch();
        }}
      />
      {comments.isPending ? (
        <Loading />
      ) : comments.data?.items.length ? (
        <div className="comments">
          {comments.data.items.map((comment) => (
            <article className="comment" key={comment.id}>
              <Avatar user={comment.author} />
              <div>
                <div className="comment-meta">
                  <strong>{name(comment.author)}</strong>
                  <span>
                    {label(comment.author.role)} · {date(comment.createdAt)}
                  </span>
                </div>
                <p>{comment.content}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="Start the conversation"
          detail="Share an update or ask a question. Everyone on this ticket can follow along."
        />
      )}
      {comments.data && comments.data.meta.lastPage > 1 && (
        <Pagination {...comments.data.meta} onPage={setPage} />
      )}
      <form
        className="comment-form"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <Field label="Add a comment" error={errors.content?.message}>
          <textarea
            rows={3}
            placeholder="Write a helpful reply…"
            {...register("content")}
          />
        </Field>
        <ErrorBox error={mutation.error} />
        <div className="form-actions">
          <span className="muted">
            Visible to everyone with access to this ticket.
          </span>
          <button className="button primary" disabled={mutation.isPending}>
            <Send size={15} />
            {mutation.isPending ? "Sending…" : "Send reply"}
          </button>
        </div>
      </form>
    </section>
  );
}
export function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ticket = useQuery({
    queryKey: ["tickets", id],
    queryFn: ({ signal }) => api<Ticket>(`/tickets/${id}`, { signal }),
  });
  const remove = useMutation({
    mutationFn: () => api(`/tickets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["tickets"] });
      void client.invalidateQueries({ queryKey: ["statistics"] });
      navigate("/tickets");
    },
  });
  if (ticket.isPending) return <Loading />;
  if (ticket.error)
    return (
      <>
        <Link className="back-link" to="/tickets">
          <ArrowLeft size={16} /> Back to tickets
        </Link>
        <ErrorBox
          error={ticket.error}
          retry={() => {
            void ticket.refetch();
          }}
        />
      </>
    );
  const data = ticket.data;
  if (!data || !user) return null;
  return (
    <>
      <Link className="back-link" to="/tickets">
        <ArrowLeft size={16} /> Back to tickets
      </Link>
      <PageHeader
        eyebrow={`TF-${String(data.id).padStart(4, "0")}`}
        title={data.title}
        subtitle={`Opened by ${name(data.createdBy)} · ${date(data.createdAt)}`}
        action={
          <div className="button-group">
            {canEditText(user, data) && (
              <button className="button" onClick={() => setEditing(!editing)}>
                <Pencil size={15} />
                {editing ? "Cancel editing" : "Edit ticket"}
              </button>
            )}
            {user.role === "ADMIN" && (
              <button
                className="icon-button danger"
                aria-label="Delete ticket"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={17} />
              </button>
            )}
          </div>
        }
      />
      {confirmDelete && (
        <section className="delete-confirm" role="alert">
          <div>
            <strong>Delete this ticket?</strong>
            <p>This permanently removes the ticket and all its comments.</p>
          </div>
          <button className="button" onClick={() => setConfirmDelete(false)}>
            Cancel
          </button>
          <button
            className="button danger"
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
          >
            Confirm deletion
          </button>
          <ErrorBox error={remove.error} />
        </section>
      )}
      <div className="detail-grid">
        <div>
          {editing ? (
            <section className="panel form-panel">
              <TicketForm
                ticket={data}
                onDone={() => {
                  setEditing(false);
                  void client.invalidateQueries({ queryKey: ["tickets"] });
                  void client.invalidateQueries({ queryKey: ["statistics"] });
                }}
              />
            </section>
          ) : (
            <section className="panel description">
              <h2>Description</h2>
              <p>{data.description}</p>
            </section>
          )}
          <Conversation id={data.id} />
        </div>
        <TicketProperties ticket={data} />
      </div>
    </>
  );
}
