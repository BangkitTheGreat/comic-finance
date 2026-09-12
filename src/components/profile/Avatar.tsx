import { profileInitials } from "@/lib/profile/initials";

export function Avatar({ name, size = "small" }: { name: string; size?: "small" | "large" }) {
  return <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-border-heavy bg-pop-purple font-bold text-ink shadow-comic-sm ${size === "large" ? "h-20 w-20 text-3xl" : "h-9 w-9 text-sm"}`}>{profileInitials(name)}</span>;
}
