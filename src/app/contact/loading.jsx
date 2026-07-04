export default function ContactLoading() {
  return (
    <div className="pt-24 px-6 md:px-12 w-full max-w-3xl mx-auto min-h-screen animate-pulse">
      <div className="mb-12">
        <div className="h-12 w-48 bg-muted/20 rounded-xl mb-4" />
        <div className="h-4 w-72 bg-muted/20 rounded-md" />
      </div>
      <div className="space-y-6 bg-surface/20 border border-muted/10 p-8 rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="h-4 w-12 bg-muted/20 rounded-md" />
            <div className="h-12 w-full bg-muted/20 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-12 bg-muted/20 rounded-md" />
            <div className="h-12 w-full bg-muted/20 rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-12 bg-muted/20 rounded-md" />
          <div className="h-12 w-full bg-muted/20 rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-muted/20 rounded-md" />
          <div className="h-32 w-full bg-muted/20 rounded-xl" />
        </div>
        <div className="h-12 w-36 bg-muted/20 rounded-full" />
      </div>
    </div>
  );
}
