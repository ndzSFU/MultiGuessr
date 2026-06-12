interface RoundCounterProps {
  currentRound: number;
  totalRounds: number;
}

export default function RoundCounter({
  currentRound,
  totalRounds,
}: RoundCounterProps) {
  return (
    <div className="round-counter">
      <span>
        Round {currentRound}/{totalRounds}
      </span>
    </div>
  );
}