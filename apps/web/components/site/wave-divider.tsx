import { cn } from "@/lib/utils";

type WaveDividerProps = {
  /** Background color above the wave crest (the section the wave rises out of). */
  from: string;
  /** Wave fill color (the section the wave flows into). */
  to: string;
  className?: string;
};

const WAVE_PATH =
  "M0,96L60,90.7C120,85,240,75,360,80C480,85,600,107,720,112C840,117,960,107,1080,90.7C1200,75,1320,53,1380,42.7L1440,32L1440,160L1380,160C1320,160,1200,160,1080,160C960,160,840,160,720,160C600,160,480,160,360,160C240,160,120,160,60,160L0,160Z";

export function WaveDivider({ from, to, className }: WaveDividerProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none w-full leading-[0]", className)}
      style={{ backgroundColor: from }}
    >
      <svg
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        className="block h-12 w-full md:h-20"
      >
        <path fill={to} d={WAVE_PATH} />
      </svg>
    </div>
  );
}
