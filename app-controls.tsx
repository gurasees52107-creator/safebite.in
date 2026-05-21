import { Moon, Sun, Languages } from "lucide-react";
import { useTheme, useLanguage, LANGUAGES } from "@/lib/app-prefs";

const pill =
  "inline-flex items-center rounded-full border bg-background/80 backdrop-blur-sm shadow-sm transition-colors text-xs font-medium";

export const gradientText: React.CSSProperties = {
  backgroundImage: "var(--gradient-hero)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const iconGradientStyle: React.CSSProperties = {
  stroke: "url(#sb-grad)",
};

function GradientDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <linearGradient id="sb-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.62 0.16 160)" />
          <stop offset="100%" stopColor="oklch(0.55 0.16 235)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AppControls() {
  const { theme, toggle } = useTheme();
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <GradientDefs />
      <label className={`${pill} border-border hover:border-primary/40 pl-3 pr-2 h-9 gap-1.5`}>
        <Languages className="w-3.5 h-3.5" style={iconGradientStyle} />
        <select
          aria-label="Language"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="bg-transparent border-0 outline-none text-xs font-medium pr-1 cursor-pointer focus:ring-0"
          style={gradientText}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} style={{ color: "var(--foreground)" }}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className={`${pill} border-border hover:border-primary/40 h-9 w-9 justify-center`}
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4" style={iconGradientStyle} />
        ) : (
          <Moon className="w-4 h-4" style={iconGradientStyle} />
        )}
      </button>
    </div>
  );
}
