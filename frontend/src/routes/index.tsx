import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Client-side redirect via component to access auth context.
    throw redirect({ to: "/auth/login" });
  },
  component: () => null,
});
