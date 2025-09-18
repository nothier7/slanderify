"use client";
import { leagueEnum } from "@/lib/validation";

type Props = {
  value?: string;
  onChange?: (league: string | undefined) => void;
};

const leagues = leagueEnum.options;

export default function LeagueFilter({ value, onChange }: Props) {
  return (
    <select
      className="h-10 px-3 rounded-lg bg-card border border-border/20 outline-none"
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value || undefined)}
    >
      <option value="">All leagues</option>
      {leagues.map((l) => (
        <option key={l} value={l}>{l}</option>
      ))}
    </select>
  );
}
