import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6">
      <p className="font-display text-2xl font-semibold text-ink">404</p>
      <p className="mt-2 text-muted">This page isn’t here yet.</p>
      <Link
        to="/"
        className="mt-8 text-sm font-medium text-accent underline-offset-4 hover:underline"
      >
        Back home
      </Link>
    </div>
  );
}
