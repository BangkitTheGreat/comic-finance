export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface p-margin-mobile md:p-margin-desktop flex justify-center pt-10">
      <div className="w-full max-w-2xl">
        {children}
      </div>
    </div>
  );
}
