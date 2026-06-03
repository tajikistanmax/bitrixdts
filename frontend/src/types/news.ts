export interface NewsItem {
  id: string;
  title: string;
  body: string;
  category?: string;
  organizationId: string;
  publishedAt: string;
  author?: { id: string; fullName: string; avatarUrl?: string };
}
