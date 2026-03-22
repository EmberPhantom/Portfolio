export default function WorkLoading() {
  return (
    <div className="pt-32 pb-32 px-6 md:px-12 max-w-7xl mx-auto w-full">
      <div className="mb-32">
        <div className="h-24 w-64 bg-white/5 rounded-2xl animate-pulse mb-6" />
        <div className="h-6 w-96 bg-white/5 rounded-full animate-pulse" />
      </div>

      <div className="flex flex-col gap-32 md:gap-48">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-24 opacity-50`}>
            <div className="w-full md:w-1/2 h-[400px] md:h-[600px] bg-white/5 rounded-3xl animate-pulse" />
            <div className={`w-full md:w-1/2 flex flex-col ${i % 2 === 0 ? 'items-start' : 'items-start md:items-end'}`}>
              <div className="h-8 w-24 bg-white/5 rounded-full animate-pulse mb-6" />
              <div className="h-16 w-full max-w-md bg-white/5 rounded-xl animate-pulse mb-6" />
              <div className="h-12 w-48 bg-white/5 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
