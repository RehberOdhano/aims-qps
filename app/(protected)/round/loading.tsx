// This page has its own sidebar rendered as page content (not a layout), so
// a plain centered spinner would blank out the whole sidebar-shaped area for
// a moment when navigating here (e.g. from the admin sidebar, which *is* a
// persistent layout and doesn't have this problem). Mirroring the real
// .round-body/.sidebar/.main-area shape here keeps the navy sidebar panel
// visually continuous across the transition instead of flashing away.
export default function Loading() {
  return (
    <div className="round-body">
      <div className="sidebar" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
      <div className="main-area" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    </div>
  );
}
