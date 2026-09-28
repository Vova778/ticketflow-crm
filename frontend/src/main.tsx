import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { ApiError } from "./api";
import { Layout } from "./components/Layout";
import { ErrorBox, Loading, Empty } from "./components/ui";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { Tickets } from "./pages/Tickets";
import { TicketDetail, NewTicket } from "./pages/TicketDetail";
import { UsersPage } from "./pages/UsersPage";
import "./styles.css";
const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) =>
        !(error instanceof ApiError && error.status < 500) && count < 1,
      staleTime: 15_000,
    },
  },
});
function Protected() {
  const { user, loading, error, retry, signOut } = useAuth();
  if (loading) return <Loading />;
  if (error)
    return (
      <div className="session-error">
        <ErrorBox error={error} retry={retry} />
        <button className="button" onClick={signOut}>
          Back to sign in
        </button>
      </div>
    );
  return user ? <Layout /> : <Navigate to="/login" replace />;
}
function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage register />} />
      <Route element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tickets/new" element={<NewTicket />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="users" element={<UsersPage />} />
        <Route
          path="*"
          element={
            <Empty
              title="Page not found"
              detail="Choose a page from the workspace navigation."
            />
          }
        />
      </Route>
    </Routes>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
