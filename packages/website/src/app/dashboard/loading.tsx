export default function DashboardLoading() {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-6xl px-6 py-12"
      aria-busy="true"
    >
      <h1 className="font-display text-3xl text-cerulean">Your workspace</h1>
      <p role="status" className="mt-3 text-sm text-ink-soft">
        Loading your links and analytics…
      </p>
      <div
        aria-hidden="true"
        className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="ink-card h-28 bg-paper-raised" />
        ))}
      </div>
    </main>
  );
}
