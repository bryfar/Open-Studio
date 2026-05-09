export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden">
      {children}
    </div>
  );
}