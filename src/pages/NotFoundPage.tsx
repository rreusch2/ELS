import { Link } from "react-router";

export function NotFoundPage({ message = "The page you're looking for doesn't exist or has moved." }: { message?: string }) {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="font-serif text-7xl font-bold text-gold-400">404</p>
        <h1 className="mt-4 font-serif text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-slate-600">{message}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="btn-primary">Go home</Link>
          <Link to="/listings" className="btn-outline">View rentals</Link>
        </div>
      </div>
    </div>
  );
}
