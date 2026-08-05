export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-mark">W</span>
      {!compact && <span className="brand-name">WorkClub</span>}
    </div>
  );
}
