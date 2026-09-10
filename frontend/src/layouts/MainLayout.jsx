// src/layouts/MainLayout.jsx
import Navbar from "../components/Navbar.jsx";

export default function MainLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(220,38,38,0.18),_transparent_32%),linear-gradient(135deg,_#000000_0%,_#111111_48%,_#1a0000_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:36px_36px]" />
      <Navbar />
      <main className="relative z-10">{children}</main>
    </div>
  );
}