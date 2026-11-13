import { createFileRoute, redirect } from "@tanstack/react-router";

// Compatibility redirect for existing bookmarks and external links.
export const Route = createFileRoute("/ascend")({
  beforeLoad: () => {
    throw redirect({ to: "/aroha", statusCode: 301 });
  },
});
