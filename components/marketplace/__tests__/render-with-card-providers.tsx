import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { ComparisonProvider } from "@/components/marketplace/InvoiceComparisonContext";

/**
 * `InvoiceCard` renders children that use React Query (demand metrics) and the
 * comparison context, so tests need both providers.
 */
export function renderWithCardProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ComparisonProvider>{ui}</ComparisonProvider>
    </QueryClientProvider>,
  );
}
