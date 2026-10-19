export function hasAdminRole(token: string | null): boolean {
  if (!token) return false;
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return false;
    const payload = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))) as {
      role?: string;
    };
    return payload.role === "admin";
  } catch {
    return false;
  }
}
