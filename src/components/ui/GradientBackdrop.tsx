export default function GradientBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f5f6fb]"
    >
      <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl animate-blob" />
      <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-cyan-200/50 blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-teal-200/50 blur-3xl animate-blob animation-delay-4000" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(30,27,75,0.05)_1px,transparent_0)] bg-[size:28px_28px]" />
    </div>
  );
}
