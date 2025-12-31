"use client";

import { useRouter } from "next/navigation";

export default function InsightsPage() {
  const router = useRouter();
  
  // Redirect to home since homepage is the feed
  router.push("/");
  
  return null;
}
