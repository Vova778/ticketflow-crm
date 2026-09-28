import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  Clock3,
  Plus,
  Ticket as TicketIcon,
  UsersRound,
} from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import {
  statuses,
  label,
  type Page,
  type Statistics,
  type Ticket,
} from "../types";
import { Badge, Empty, ErrorBox, Loading, PageHeader } from "../components/ui";
export function Dashboard() {
  const { user } = useAuth();
  const stats = useQuery({
    queryKey: ["statistics"],
    queryFn: ({ signal }) =>
      api<Statistics>("/dashboard/statistics", { signal }),
  });
  const recent = useQuery({
    queryKey: ["tickets", "recent"],
    queryFn: ({ signal }) =>
      api<Page<Ticket>>("/tickets?perPage=5", { signal }),
  });
  if (!user) return null;
  const data = stats.data;
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE OVERVIEW"
        title={`Good to see you, ${user.firstName || "there"}.`}
        subtitle="A little perspective on your support day. Here's where things stand."
        action={
          <Link className="button primary" to="/tickets/new">
            <Plus size={17} /> New ticket
          </Link>
        }
      />
      <ErrorBox
        error={stats.error}
        retry={() => {
          void stats.refetch();
        }}
      />
      {stats.isPending ? (
        <Loading />
      ) : (
        data && (
          <>
            <div className="stats-grid">
              {[
                {
                  title: "Total tickets",
                  value: data.total,
                  note: "Across your workspace",
                  icon: TicketIcon,
                  color: "purple",
                },
                {
                  title: "In progress",
                  value: data.byStatus.IN_PROGRESS,
                  note: "Moving toward a resolution",
                  icon: Clock3,
                  color: "blue",
                },
                {
                  title: "Resolved",
                  value: data.byStatus.RESOLVED + data.byStatus.CLOSED,
                  note: "Conversations brought to a close",
                  icon: CheckCheck,
                  color: "green",
                },
                {
                  title: "Unassigned",
                  value: data.unassigned,
                  note: "Ready for a helping hand",
                  icon: UsersRound,
                  color: "amber",
                },
              ].map((card) => (
                <div className="stat-card" key={card.title}>
                  <div>
                    <span>{card.title}</span>
                    <span className={`stat-icon ${card.color}`}>
                      <card.icon size={18} />
                    </span>
                  </div>
                  <strong>{card.value}</strong>
                  <small>{card.note}</small>
                </div>
              ))}
            </div>
            <div className="dashboard-grid">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Ticket activity</h2>
                    <p>A snapshot of every stage.</p>
                  </div>
                  <span className="subtle-chip">{data.total} total</span>
                </div>
                <div className="status-chart">
                  {statuses.map((status) => (
                    <Link
                      to={`/tickets?status=${status}`}
                      className="chart-row"
                      key={status}
                    >
                      <span>
                        <span
                          className={`status-dot ${status.toLowerCase()}`}
                        />
                        {label(status)}
                      </span>
                      <div className="bar-track">
                        <div
                          className={`bar ${status.toLowerCase()}`}
                          style={{
                            width: `${data.total ? (data.byStatus[status] / data.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <strong>{data.byStatus[status]}</strong>
                    </Link>
                  ))}
                </div>
              </section>
              <section className="focus-card">
                <div className="focus-icon">
                  <TicketIcon size={25} />
                </div>
                <div className="eyebrow light">ROOM TO MAKE A DIFFERENCE</div>
                <h2>
                  {user.role === "USER"
                    ? "Your voice matters."
                    : "One ticket at a time."}
                </h2>
                <p>
                  {user.role === "USER"
                    ? "Need a hand? Share the details and keep the conversation going with your support team."
                    : `You have ${data.assignedToMe} tickets assigned to you. A clear next step can make someone's day.`}
                </p>
                <Link to="/tickets">
                  Open your ticket workspace <ArrowRight size={17} />
                </Link>
              </section>
            </div>
          </>
        )
      )}
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent tickets</h2>
            <p>The latest conversations in your workspace.</p>
          </div>
          <Link className="text-link" to="/tickets">
            View all tickets <ArrowUpRight size={16} />
          </Link>
        </div>
        <ErrorBox
          error={recent.error}
          retry={() => {
            void recent.refetch();
          }}
        />
        {recent.isPending ? (
          <Loading />
        ) : recent.data?.items.length ? (
          <div className="recent-list">
            {recent.data.items.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="recent-ticket"
              >
                <span className="ticket-glyph">
                  <TicketIcon size={18} />
                </span>
                <div>
                  <small>TF-{String(ticket.id).padStart(4, "0")}</small>
                  <strong>{ticket.title}</strong>
                </div>
                <Badge value={ticket.priority} />
                <Badge value={ticket.status} />
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </section>
    </>
  );
}
