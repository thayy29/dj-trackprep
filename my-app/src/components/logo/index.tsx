import { Music } from "lucide-react";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
}

export function Logo({ size = "md", showSubtitle = true }: LogoProps) {
  const sizes = {
    sm: { icon: "w-8 h-8", iconInner: "w-4 h-4", title: "text-sm", subtitle: "text-xs" },
    md: { icon: "w-10 h-10", iconInner: "w-5 h-5", title: "text-md", subtitle: "text-xs" },
    lg: { icon: "w-12 h-12", iconInner: "w-6 h-6", title: "text-lg", subtitle: "text-sm" },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <div className={`${s.icon} bg-primary rounded-lg flex items-center justify-center`}>
        <Music className={`${s.iconInner} text-white`} />
      </div>
      <div>
        <p className={`text-text-high ${s.title} font-bold`}>DJ Trackprep</p>
        {showSubtitle && (
          <p className={`text-text-low ${s.subtitle}`}>MP3 to WAV Converter</p>
        )}
      </div>
    </div>
  );
}