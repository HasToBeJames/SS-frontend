"use client";

import { useParams } from "next/navigation";
import { PoolDetail } from "@/components/pools/PoolDetail";

export default function PoolDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <main className="container mx-auto px-4 py-8 pb-24">
      <PoolDetail poolId={params.id} />
    </main>
  );
}
