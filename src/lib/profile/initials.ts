export function profileInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "CF";
  return [words[0], ...(words.length > 1 ? [words[words.length - 1]] : [])]
    .map(word => Array.from(word)[0]).join("").toLocaleUpperCase("en-US");
}
