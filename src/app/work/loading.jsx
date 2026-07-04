export default function WorkLoading() {
  return (
    <div className="pt-24 px-6 md:px-12 w-full max-w-7xl mx-auto min-h-screen animate-pulse">
      <div className="mb-12">
        <div className="h-12 w-48 bg-muted/20 rounded-xl mb-4" />
        <div className="h-4 w-72 bg-muted/20 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 rounded-3xl bg-muted/10 border border-muted/20 p-8 flex flex-col justify-between">
            <div>
              <div className="w-16 h-6 bg-muted/20 rounded-full mb-4" />
              <div className="h-8 w-40 bg-muted/20 rounded-lg" />
            </div>
            <div className="h-4 w-full bg-muted/20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
