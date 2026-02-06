import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to relative time (e.g., "2h ago", "Yesterday")
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

// Mask connection string for security
export function maskConnectionString(connectionString: string): string {
  // Format: "Endpoint=...;Id=***;Secret=***"
  const parts = connectionString.split(";");
  return parts
    .map((part) => {
      if (part.toLowerCase().includes("secret") || part.toLowerCase().includes("key")) {
        const [key] = part.split("=");
        return `${key}=***`;
      }
      return part;
    })
    .join(";");
}
