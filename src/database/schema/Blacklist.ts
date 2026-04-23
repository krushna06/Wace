export interface Blacklist {
  id: string;
  type: "user" | "guild";
  reason?: string;
  blacklistedAt: number;
  blacklistedBy: string;
}
