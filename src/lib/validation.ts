import { z } from "zod";

export const leagueEnum = z.enum(["EPL", "LaLiga", "SerieA", "Bundesliga", "Ligue1"]);

export const SubmitSlanderSchema = z.object({
  slander: z.string().min(2).max(64),
  realName: z.string().min(2).max(64),
  league: leagueEnum,
});

export const VoteSchema = z.object({
  slanderId: z.number().int().positive(),
  vote: z.union([z.literal(1), z.literal(0), z.literal(-1)]),
});

export const LeaderboardQuerySchema = z.object({
  period: z.enum(["week", "month", "year"]),
  league: leagueEnum.optional(),
});

export const UsernameSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores");
