import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  RotateCw,
  TicketCheck,
} from "lucide-react";
import { label, name, type User } from "../types";
export function Logo() {
  return (
    <span className="brand">
      <span className="brand-icon">
        <TicketCheck size={23} />
      </span>
      TicketFlow<span className="brand-dot">.</span>
    </span>
  );
}
export function Avatar({
  user,
  small = false,
}: {
  user: User;
  small?: boolean;
}) {
  return (
    <span className={`avatar ${small ? "small" : ""}`} title={name(user)}>
      {name(user).slice(0, 2).toUpperCase()}
    </span>
  );
}
export function Badge({ value }: { value: string }) {
  return (
    <span className={`badge ${value.toLowerCase()}`}>
      <span />
      {label(value)}
    </span>
  );
}
export function ErrorBox({
  error,
  retry,
}: {
  error: Error | null;
  retry?: () => void;
}) {
  return error ? (
    <div className="error" role="alert">
      {error.message}
      {retry && (
        <button className="text-button" onClick={retry}>
          <RotateCw size={14} /> Try again
        </button>
      )}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" /> Loading your workspace…
    </div>
  );
}
export function Empty({
  title = "No tickets here yet",
  detail = "Create a ticket to start the conversation.",
  action,
}: {
  title?: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Inbox size={28} />
      </span>
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  );
}
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </header>
  );
}
export function Pagination({
  page,
  total,
  lastPage,
  onPage,
}: {
  page: number;
  total: number;
  lastPage: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="pagination">
      <span>
        {total} results · Page {page} of {Math.max(1, lastPage)}
      </span>
      <div>
        <button
          className="icon-button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft size={17} />
        </button>
        <button
          className="icon-button"
          aria-label="Next page"
          disabled={page >= lastPage}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
export function Field({
  label: text,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{text}</span>
      {children}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
