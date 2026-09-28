import { describe, it, expect } from "vitest";
import {
  commentSchema,
  loginSchema,
  registerSchema,
  ticketSchema,
} from "./schemas";
import { canEditText, type User, type Ticket } from "./types";
import { queryString } from "./api";
const user = { id: 1, role: "USER" } as User;
const ticket = { createdBy: user, status: "OPEN" } as Ticket;
describe("forms and role restrictions", () => {
  it("rejects invalid credentials", () => {
    expect(
      loginSchema.safeParse({ email: "invalid", password: "short" }).success,
    ).toBe(false);
  });
  it("requires names at registration", () => {
    expect(
      registerSchema.safeParse({
        email: "a@test.test",
        password: "password123",
      }).success,
    ).toBe(false);
  });
  it("strips role injection from registration", () => {
    const data = registerSchema.parse({
      email: "a@test.test",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      role: "ADMIN",
    });
    expect(data).not.toHaveProperty("role");
  });
  it.each(["", "   ", "\n"])("rejects blank comment %j", (content) => {
    expect(commentSchema.safeParse({ content }).success).toBe(false);
  });
  it("trims comment content", () => {
    expect(commentSchema.parse({ content: " hello " }).content).toBe("hello");
  });
  it("rejects oversized comments", () => {
    expect(commentSchema.safeParse({ content: "a".repeat(5001) }).success).toBe(
      false,
    );
  });
  it("enforces ticket lengths and priority enum", () => {
    expect(
      ticketSchema.safeParse({
        title: "OK",
        description: "Short",
        priority: "INVALID",
      }).success,
    ).toBe(false);
  });
  it("allows user text edits only on own open tickets", () => {
    expect(canEditText(user, ticket)).toBe(true);
    expect(canEditText(user, { ...ticket, status: "CLOSED" })).toBe(false);
    expect(canEditText({ ...user, id: 2 }, ticket)).toBe(false);
  });
  it("allows admins but denies manager text editing", () => {
    expect(
      canEditText({ ...user, role: "ADMIN" }, { ...ticket, status: "CLOSED" }),
    ).toBe(true);
    expect(canEditText({ ...user, role: "MANAGER" }, ticket)).toBe(false);
  });
  it("encodes search and omits empty filters", () => {
    expect(
      queryString({ search: "A & B", status: "", page: 2, absent: undefined }),
    ).toBe("search=A+%26+B&page=2");
  });
});
