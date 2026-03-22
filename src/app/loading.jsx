export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-forge-muted border-t-orange-500 rounded-full animate-spin" />
        <span className="text-gray-500 font-mono text-sm tracking-[0.2em] uppercase">
          Loading...
        </span>
      </div>
    </div>
  );
}
