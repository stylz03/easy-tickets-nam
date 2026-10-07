export default function AmbientBackdrop() {
  return (
    <div className="ambient-backdrop" aria-hidden="true">
      <span className="ambient-photo ambient-photo-desert" />
      <span className="ambient-photo ambient-photo-city" />
      <span className="ambient-photo ambient-photo-coast" />
      <span className="ambient-veil" />
    </div>
  );
}
