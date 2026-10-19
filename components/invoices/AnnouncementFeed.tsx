"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnnouncementContent,
  useInvoiceAnnouncements,
} from "@/hooks/useInvoiceAnnouncements";
import {
  ANNOUNCEMENT_CATEGORY_LABELS,
  ANNOUNCEMENT_CATEGORY_STYLES,
} from "@/lib/announcements";
import type { InvoiceAnnouncement } from "@/lib/api";
import { cn } from "@/lib/utils";

export function AnnouncementCategoryChip({
  category,
}: {
  category: InvoiceAnnouncement["category"];
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        ANNOUNCEMENT_CATEGORY_STYLES[category],
      )}
      data-testid={`announcement-chip-${category}`}
    >
      {ANNOUNCEMENT_CATEGORY_LABELS[category]}
    </span>
  );
}

function AnnouncementEntry({ announcement }: { announcement: InvoiceAnnouncement }) {
  const [expanded, setExpanded] = useState(false);
  const content = useAnnouncementContent(announcement.content_hash, expanded);
  const panelId = `announcement-body-${announcement.id}`;

  return (
    <li
      className="space-y-2 rounded-lg border p-4"
      data-testid={`announcement-${announcement.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <AnnouncementCategoryChip category={announcement.category} />
        <h3 className="font-medium" data-testid={`announcement-title-${announcement.id}`}>
          {announcement.title}
        </h3>
        <time
          className="ml-auto text-xs text-muted-foreground"
          dateTime={announcement.created_at}
          data-testid={`announcement-date-${announcement.id}`}
        >
          {new Date(announcement.created_at).toLocaleDateString()}
        </time>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((open) => !open)}
        data-testid={`announcement-toggle-${announcement.id}`}
      >
        {expanded ? (
          <>
            <ChevronUp className="mr-1 h-4 w-4" />
            Hide details
          </>
        ) : (
          <>
            <ChevronDown className="mr-1 h-4 w-4" />
            Read more
          </>
        )}
      </Button>

      {expanded && (
        <div id={panelId} data-testid={`announcement-body-${announcement.id}`}>
          {content.isLoading && <Skeleton className="h-16 w-full" />}
          {content.isError && (
            <p className="text-sm text-destructive" role="alert">
              Could not load this announcement from IPFS. Try again later.
            </p>
          )}
          {content.data !== undefined && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {content.data}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export function AnnouncementFeed({ invoiceId }: { invoiceId: string }) {
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInvoiceAnnouncements(invoiceId);

  const announcements = data?.pages.flatMap((page) => page.announcements) ?? [];

  return (
    <Card data-testid="announcement-feed">
      <CardHeader>
        <h2 className="text-lg font-semibold">Issuer announcements</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-3" data-testid="announcement-feed-loading">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive" role="alert">
            Could not load announcements. Refresh to try again.
          </p>
        )}

        {!isLoading && !isError && announcements.length === 0 && (
          <p className="text-sm text-muted-foreground" data-testid="announcement-empty">
            The issuer has not posted any announcements for this invoice yet.
          </p>
        )}

        {announcements.length > 0 && (
          <ul className="space-y-3">
            {announcements.map((announcement) => (
              <AnnouncementEntry key={announcement.id} announcement={announcement} />
            ))}
          </ul>
        )}

        {hasNextPage && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              data-testid="announcement-load-more"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
