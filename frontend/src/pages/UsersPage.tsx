import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { Pencil, Search, X } from "lucide-react";
import { api, queryString } from "../api";
import { useAuth } from "../auth";
import { label, name, roles, type Page, type User } from "../types";
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
const userSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  role: z.enum(roles),
  isActive: z.boolean(),
});
function EditUser({ user, onClose }: { user: User; onClose: () => void }) {
  const { user: me } = useAuth();
  const client = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      role: user.role,
      isActive: user.isActive,
    },
  });
  const mutation = useMutation({
    mutationFn: (body: z.infer<typeof userSchema>) =>
      api(`/users/${user.id}`, { method: "PATCH", body }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["users"] });
      await client.invalidateQueries({ queryKey: ["managers"] });
      await client.invalidateQueries({ queryKey: ["me"] });
      onClose();
    },
  });
  return (
    <section className="panel user-editor">
      <div className="panel-heading">
        <div>
          <h2>Edit {name(user)}</h2>
          <p>{user.email}</p>
        </div>
        <button
          className="icon-button"
          aria-label="Close editor"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <form
        className="form-panel"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="form-row">
          <Field label="First name" error={errors.firstName?.message}>
            <input {...register("firstName")} />
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            <input {...register("lastName")} />
          </Field>
          <Field label="Role">
            <select {...register("role")} disabled={user.id === me?.id}>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {label(role)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            {...register("isActive")}
            disabled={user.id === me?.id}
          />{" "}
          Active account
        </label>
        {user.id === me?.id && (
          <p className="muted">
            Your own role and active status are protected.
          </p>
        )}
        <ErrorBox error={mutation.error} />
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={mutation.isPending}>
            Save changes
          </button>
        </div>
      </form>
    </section>
  );
}
export function UsersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<User | null>(null);
  const query = queryString({ search, role, page, perPage: 10 });
  const users = useQuery({
    queryKey: ["users", query],
    queryFn: ({ signal }) => api<Page<User>>(`/users?${query}`, { signal }),
    enabled: user?.role === "ADMIN",
  });
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;
  return (
    <>
      <PageHeader
        eyebrow="THE PEOPLE BEHIND THE SUPPORT"
        title="People"
        subtitle="Manage your team, account access, and workspace roles."
      />
      {editing && (
        <EditUser
          key={editing.id}
          user={editing}
          onClose={() => setEditing(null)}
        />
      )}
      <section className="panel">
        <div className="filters">
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="Search people"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            aria-label="Filter role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {label(r)}
              </option>
            ))}
          </select>
          <span className="muted">New users join through registration.</span>
        </div>
        <ErrorBox
          error={users.error}
          retry={() => {
            void users.refetch();
          }}
        />
        {users.isPending ? (
          <Loading />
        ) : users.data?.items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Role</th>
                  <th>Account status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.data.items.map((person) => (
                  <tr key={person.id}>
                    <td>
                      <div className="person-cell">
                        <Avatar user={person} />
                        <div>
                          <strong>
                            {name(person)}{" "}
                            {person.id === user.id && <small>(you)</small>}
                          </strong>
                          <small>{person.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge value={person.role} />
                    </td>
                    <td>
                      <Badge value={person.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`Edit ${person.email}`}
                        onClick={() => setEditing(person)}
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !users.error && (
            <Empty
              title="No people found"
              detail="Try a different name, email, or role."
            />
          )
        )}
        {users.data && <Pagination {...users.data.meta} onPage={setPage} />}
      </section>
    </>
  );
}
