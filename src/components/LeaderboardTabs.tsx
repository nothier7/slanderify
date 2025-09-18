"use client";

type Props = {
  period: "week" | "month" | "year";
  onChange: (p: "week" | "month" | "year") => void;
};

const tabs: Array<{ key: Props["period"]; label: string }> = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

export default function LeaderboardTabs({ period, onChange }: Props) {
  return (
    <div className="inline-flex bg-card rounded-lg border border-border/20 p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={
            "px-3 h-9 rounded-md text-sm " +
            (period === t.key ? "bg-primary-500 text-bg" : "text-foreground hover:bg-card")
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
