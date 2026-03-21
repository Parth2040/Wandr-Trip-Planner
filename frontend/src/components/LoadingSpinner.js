export default function LoadingSpinner({ label = 'Loading Wandr...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="h-12 w-12 rounded-full border-4 border-wandr-100 border-t-wandr-600 animate-spin" />
      <p className="mt-3 text-slate-600">{label}</p>
    </div>
  );
}
