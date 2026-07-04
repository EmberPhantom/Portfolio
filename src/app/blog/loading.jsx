export default function BlogLoading() {
  return (
    <div className="pt-24 px-6 md:px-12 w-full max-w-5xl mx-auto min-h-screen animate-pulse">
      <div className="mb-12 text-center">
        <div className="h-12 w-48 bg-muted/20 rounded-xl mb-4 mx-auto" />
        <div className="h-4 w-72 bg-muted/20 rounded-md mx-auto" />
      </div>
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-b border-muted/10 pb-8 flex flex-col md:flex-row gap-6 justify-between">
            <div className="flex-1 space-y-4">
              <div className="h-4 w-24 bg-muted/20 rounded-md" />
              <div className="h-8 w-3/4 bg-muted/20 rounded-lg" />
              <div className="h-4 w-full bg-muted/20 rounded-md" />
              <div className="h-4 w-5/6 bg-muted/20 rounded-md" />
            </div>
            <div className="w-full md:w-48 h-32 bg-muted/10 rounded-2xl border border-muted/20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
