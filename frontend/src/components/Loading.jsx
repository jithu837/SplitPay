export default function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading-screen">
      <div className="spinner spinner-lg" />
      <span>{label}</span>
    </div>
  )
}
