import { cn } from "@/lib/utils";

export function HorizonArt({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[2rem] border border-navy/10 bg-dune shadow-horizon", className)}>
      <div className="absolute inset-x-0 top-[-10%] h-48 rounded-full bg-gold/25 blur-3xl" />
      <div className="absolute inset-x-[15%] top-[18%] h-24 w-24 rounded-full bg-gold/70 blur-sm" />
      <div className="absolute inset-x-[-10%] bottom-[13%] h-48 rounded-[50%] bg-ember/15 blur-2xl" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy/12 to-transparent" />
      <div className="absolute bottom-0 left-[-5%] h-44 w-[72%] rounded-[55%] bg-navy/80" />
      <div className="absolute bottom-0 right-[-3%] h-36 w-[58%] rounded-[50%] bg-ember/80" />
      <div className="absolute inset-6 border border-paper/45" />
    </div>
  );
}
