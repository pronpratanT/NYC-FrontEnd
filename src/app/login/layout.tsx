// ตัวอย่าง Nested Layout สำหรับหน้า login
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // ไม่เรียกใช้ Sidebar, Header, BackgroundSwitcher
  return <>{children}</>;
}
