import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { MessageSquare, Plus, Search, SlidersHorizontal } from "lucide-react";
import { api, queryString } from "../api";
import { useAuth } from "../auth";
import {
  date,
  label,
  name,
  priorities,
  statuses,
  type Page,
  type Ticket,
  type User,
} from "../types";
import {
  Avatar,
  Badge,
  Empty,
  ErrorBox,
  Loading,
  PageHeader,
  Pagination,
} from "../components/ui";
export function Tickets() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const search = params.get("search") ?? "",
    status = params.get("status") ?? "",
    priority = params.get("priority") ?? "",
    assignedToId = params.get("assignedToId") ?? "";
  const change = (key: string, value: string) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  const query = queryString({
    page,
    perPage: 10,
    search,
    status,
    priority,
    assignedToId,
  });
  const tickets = useQuery({
    queryKey: ["tickets", query],
    queryFn: ({ signal }) => api<Page<Ticket>>(`/tickets?${query}`, { signal }),
  });
  const managers = useQuery({
    queryKey: ["managers"],
    queryFn: ({ signal }) => api<User[]>("/users/managers", { signal }),
    enabled: user?.role !== "USER",
  });
  return (
    <>
      <PageHeader
        eyebrow="CONVERSATIONS, ORGANIZED"
        title="Tickets"
        subtitle="Every request has a place. Give each one a clear next step."
        action={
          <Link to="/tickets/new" className="button primary">
            <Plus size={17} /> New ticket
          </Link>
        }
      />
      <div className="ticket-tabs">
        <button
          className={!status ? "active" : ""}
          onClick={() => change("status", "")}
        >
          All tickets
        </button>
        <button
          className={status === "OPEN" ? "active" : ""}
          onClick={() => change("status", "OPEN")}
        >
          Open
        </button>
        <button
          className={status === "IN_PROGRESS" ? "active" : ""}
          onClick={() => change("status", "IN_PROGRESS")}
        >
          In progress
        </button>
        <button
          className={status === "RESOLVED" ? "active" : ""}
          onClick={() => change("status", "RESOLVED")}
        >
          Resolved
        </button>
      </div>
      <section className="panel">
        <div className="filters">
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="Search tickets"
              placeholder="Search tickets…"
              value={search}
              onChange={(event) => change("search", event.target.value)}
            />
          </div>
          <SlidersHorizontal size={17} className="muted" />
          <select
            aria-label="Filter status"
            value={status}
            onChange={(event) => change("status", event.target.value)}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter priority"
            value={priority}
            onChange={(event) => change("priority", event.target.value)}
          >
            <option value="">All priorities</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {label(p)}
              </option>
            ))}
          </select>
          {user?.role !== "USER" && (
            <select
              aria-label="Filter assignee"
              value={assignedToId}
              onChange={(event) => change("assignedToId", event.target.value)}
            >
              <option value="">All assignees</option>
              {managers.data?.map((m) => (
                <option key={m.id} value={m.id}>
                  {name(m)}
                </option>
              ))}
            </select>
          )}
          {(search || status || priority || assignedToId) && (
            <button className="text-button" onClick={() => setParams({})}>
              Clear filters
            </button>
          )}
        </div>
        <ErrorBox
          error={tickets.error}
          retry={() => {
            void tickets.refetch();
          }}
        />
        {tickets.isPending ? (
          <Loading />
        ) : tickets.data?.items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Created</th>
                  <th>
                    <MessageSquare size={15} />
                    <span className="sr-only">Comments</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.data.items.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="ticket-cell">
                      <Link to={`/tickets/${ticket.id}`}>
                        <small>TF-{String(ticket.id).padStart(4, "0")}</small>
                        <strong>{ticket.title}</strong>
                      </Link>
                    </td>
                    <td>
                      <Badge value={ticket.status} />
                    </td>
                    <td>
                      <Badge value={ticket.priority} />
                    </td>
                    <td>
                      {ticket.assignedTo ? (
                        <span className="inline-user">
                          <Avatar user={ticket.assignedTo} small />
                          {name(ticket.assignedTo)}
                        </span>
                      ) : (
                        <span className="muted">Unassigned</span>
                      )}
                    </td>
                    <td className="nowrap muted">{date(ticket.createdAt)}</td>
                    <td className="muted">{ticket._count?.comments ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !tickets.error && (
            <Empty
              title="Nothing here just yet"
              detail={
                search || status || priority || assignedToId
                  ? "Try changing your filters to find what you need."
                  : "Create your first ticket and start a conversation."
              }
            />
          )
        )}{" "}
        {tickets.data && (
          <Pagination
            {...tickets.data.meta}
            onPage={(value) => change("page", String(value))}
          />
        )}
      </section>
    </>
  );
}
