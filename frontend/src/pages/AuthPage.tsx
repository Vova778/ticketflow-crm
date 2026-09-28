import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Check, Layers } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import { loginSchema, registerSchema } from "../schemas";
import { ErrorBox, Field, Loading, Logo } from "../components/ui";
interface Credentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}
export function AuthPage({
  register: isRegister = false,
}: {
  register?: boolean;
}) {
  const { user, signIn, loading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Credentials>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
  });
  const mutation = useMutation({
    mutationFn: (body: Credentials) =>
      api<{ accessToken: string }>(
        isRegister ? "/auth/register" : "/auth/login",
        { method: "POST", body, public: true },
      ),
    onSuccess: (result) => signIn(result.accessToken),
  });
  if (loading) return <Loading />;
  if (user) return <Navigate to="/" replace />;
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Logo />
        <div className="auth-copy">
          <div className="eyebrow light">LESS FRICTION. MORE RESOLUTION.</div>
          <h1>
            Great support
            <br />
            starts with
            <br />
            <em>a clear view.</em>
          </h1>
          <p>
            Every request, every conversation, every next step. One thoughtful
            workspace for your team.
          </p>
          <div className="story-points">
            {[
              "A home for every customer request",
              "The right people, on the right tickets",
              "Progress you can see at a glance",
            ].map((text) => (
              <div key={text}>
                <Check size={17} />
                {text}
              </div>
            ))}
          </div>
        </div>
        <div className="auth-bottom">
          <Layers size={18} /> TicketFlow CRM{" "}
          <span>Made for teams that care.</span>
        </div>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form">
          <div className="eyebrow">YOUR SUPPORT WORKSPACE</div>
          <h2>{isRegister ? "Make yourself at home." : "Welcome back."}</h2>
          <p>
            {isRegister
              ? "Create an account to submit and follow your requests."
              : "Sign in to pick up where you left off."}
          </p>
          <form
            onSubmit={handleSubmit((body) => mutation.mutate(body))}
            noValidate
          >
            {isRegister && (
              <div className="form-row">
                <Field label="First name" error={errors.firstName?.message}>
                  <input autoComplete="given-name" {...register("firstName")} />
                </Field>
                <Field label="Last name" error={errors.lastName?.message}>
                  <input autoComplete="family-name" {...register("lastName")} />
                </Field>
              </div>
            )}
            <Field label="Email address" error={errors.email?.message}>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register("email")}
              />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <input
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder="At least 8 characters"
                {...register("password")}
              />
            </Field>
            <ErrorBox error={mutation.error} />
            <button
              className="button primary wide"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? "Please wait…"
                : isRegister
                  ? "Create account"
                  : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "New to TicketFlow?"}{" "}
            <Link to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
        <div className="auth-footnote">
          A focused space for better customer support.
        </div>
      </section>
    </div>
  );
}
