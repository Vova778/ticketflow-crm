export const statuses = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_CLIENT",
  "RESOLVED",
  "CLOSED",
] as const;
export const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const roles = ["ADMIN", "MANAGER", "USER"] as const;
export type Role = (typeof roles)[number];
export type Status = (typeof statuses)[number];
export type Priority = (typeof priorities)[number];
export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}
export interface Comment {
  id: number;
  content: string;
  author: User;
  createdAt: string;
}
export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  createdBy: User;
  assignedTo: User | null;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
  _count?: { comments: number };
}
export interface Page<T> {
  items: T[];
  meta: { total: number; page: number; perPage: number; lastPage: number };
}
export interface Statistics {
  total: number;
  byStatus: Record<Status, number>;
  byPriority: Record<Priority, number>;
  assignedToMe: number;
  unassigned: number;
}
export const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());
export const name = (user: User) =>
  [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
export const date = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
export const canEditText = (user: User, ticket: Ticket) =>
  user.role === "ADMIN" ||
  (user.role === "USER" &&
    ticket.createdBy.id === user.id &&
    ticket.status === "OPEN");
