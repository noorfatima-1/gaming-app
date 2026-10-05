import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 px-4">
      <h1 className="text-8xl font-black gradient-text mb-4">404</h1>
      <p className="text-xl text-white/60 mb-8">This page doesn't exist.</p>
      <Link
        href="/"
        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
