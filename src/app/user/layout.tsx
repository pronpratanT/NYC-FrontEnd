export default function UserDepLayout({ children }: { children: React.ReactNode }) {
  // ไม่เรียกใช้ Sidebar, Header, BackgroundSwitcher
  return <>{children}</>;
}