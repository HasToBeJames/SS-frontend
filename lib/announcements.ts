import type { AnnouncementCategory } from "@/lib/api";

export const ANNOUNCEMENT_CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  update: "Update",
  milestone: "Milestone",
  warning: "Warning",
  event: "Event",
};

/** Chip colours per category: blue update, green milestone, amber warning, purple event. */
export const ANNOUNCEMENT_CATEGORY_STYLES: Record<AnnouncementCategory, string> = {
  update:
    "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
  milestone:
    "border-green-200 bg-green-100 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
  warning:
    "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  event:
    "border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-200",
};
