import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { InvoiceBenchmarkCard } from "../InvoiceBenchmarkCard";
import * as api from "@/lib/api";

it("renders all benchmark metrics and handles missing settlement history", async () => {
  vi.spyOn(api, "fetchInvoiceBenchmark").mockResolvedValue({ sector: "Trade Finance", invoice_yield: 9, sector_avg_yield: 8, invoice_avg_settlement_days: null, sector_avg_settlement_days: 14, issuer_default_rate: 1, sector_default_rate: 2 });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><InvoiceBenchmarkCard invoiceId="inv-1" /></QueryClientProvider>);
  expect(await screen.findByTestId("invoice-benchmark")).toHaveTextContent("Trade Finance");
  expect(screen.getByTestId("benchmark-Yield")).toHaveTextContent("9%");
  expect(screen.getByTestId("benchmark-Settlement speed")).toHaveTextContent("No settlement history");
  expect(screen.getByTestId("benchmark-Default rate")).toHaveTextContent("1%");
});
