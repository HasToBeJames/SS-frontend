import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnnouncementFeed } from "../AnnouncementFeed";
import type { InvoiceAnnouncement } from "@/lib/api";

const mockFeed = vi.fn();
const mockContent = vi.fn();

vi.mock("@/hooks/useInvoiceAnnouncements", () => ({
  useInvoiceAnnouncements: () => mockFeed(),
  useAnnouncementContent: (hash: string, enabled: boolean) => mockContent(hash, enabled),
}));

const items: InvoiceAnnouncement[] = [
  {
    id: "1",
    category: "milestone",
    title: "Goods shipped",
    created_at: "2026-03-01T00:00:00Z",
    content_hash: "QmHash1",
  },
  {
    id: "2",
    category: "warning",
    title: "Delay expected",
    created_at: "2026-03-05T00:00:00Z",
    content_hash: "QmHash2",
  },
];

function feed(overrides = {}) {
  return {
    data: { pages: [{ announcements: items, has_more: false }] },
    isLoading: false,
    isError: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
    ...overrides,
  };
}

describe("AnnouncementFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContent.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  });

  it("renders category, title and date for each announcement", () => {
    mockFeed.mockReturnValue(feed());
    render(<AnnouncementFeed invoiceId="inv-1" />);

    expect(screen.getByTestId("announcement-chip-milestone")).toHaveTextContent("Milestone");
    expect(screen.getByTestId("announcement-chip-warning")).toHaveTextContent("Warning");
    expect(screen.getByTestId("announcement-title-1")).toHaveTextContent("Goods shipped");
    expect(screen.getByTestId("announcement-date-1")).toHaveTextContent(
      new Date("2026-03-01T00:00:00Z").toLocaleDateString(),
    );
  });

  it("colour codes each category differently", () => {
    mockFeed.mockReturnValue(feed());
    render(<AnnouncementFeed invoiceId="inv-1" />);

    expect(screen.getByTestId("announcement-chip-milestone").className).toContain("green");
    expect(screen.getByTestId("announcement-chip-warning").className).toContain("amber");
  });

  it("loads full content from the IPFS hash only after expanding", () => {
    mockFeed.mockReturnValue(feed());
    render(<AnnouncementFeed invoiceId="inv-1" />);

    expect(mockContent).toHaveBeenCalledWith("QmHash1", false);
    mockContent.mockImplementation((hash: string, enabled: boolean) => ({
      data: enabled && hash === "QmHash1" ? "Full shipment details" : undefined,
      isLoading: false,
      isError: false,
    }));

    fireEvent.click(screen.getByTestId("announcement-toggle-1"));

    expect(mockContent).toHaveBeenCalledWith("QmHash1", true);
    expect(screen.getByTestId("announcement-body-1")).toHaveTextContent("Full shipment details");
  });

  it("fetches the next page on Load more", () => {
    const fetchNextPage = vi.fn();
    mockFeed.mockReturnValue(feed({ hasNextPage: true, fetchNextPage }));
    render(<AnnouncementFeed invoiceId="inv-1" />);

    fireEvent.click(screen.getByTestId("announcement-load-more"));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("hides Load more when there are no further pages", () => {
    mockFeed.mockReturnValue(feed());
    render(<AnnouncementFeed invoiceId="inv-1" />);
    expect(screen.queryByTestId("announcement-load-more")).toBeNull();
  });

  it("shows an empty state when there are no announcements", () => {
    mockFeed.mockReturnValue(feed({ data: { pages: [{ announcements: [], has_more: false }] } }));
    render(<AnnouncementFeed invoiceId="inv-1" />);
    expect(screen.getByTestId("announcement-empty")).toBeInTheDocument();
  });
});
