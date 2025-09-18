import VoteButtons from "./VoteButtons";

type Player = { id: number | null; full_name: string; league: string };

type Props = {
  id: number;
  text: string;
  player: Player;
  score: number;
  submitter?: { username: string | null };
  userVote?: 1 | -1 | 0;
};

export default function SlanderCard({ id, text, player, score, submitter, userVote = 0 }: Props) {
  return (
    <div className="card p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm text-muted">
          {player.full_name} · {player.league}
          {submitter?.username ? <span> · @{submitter.username}</span> : null}
        </div>
        <div className="text-lg font-medium truncate">{text}</div>
      </div>
      <VoteButtons slanderId={id} initialScore={score} initialUserVote={userVote} />
    </div>
  );
}
