import prisma from '../../core/config/database';

export interface SearchFilters {
  query: string;
  types?: string[]; // ['employees','tasks','projects','documents','memos','chat']
  limit?: number;
}

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  url?: string;
  highlight?: string;
  createdAt?: Date;
}

export class SearchService {
  async globalSearch(organizationId: string, filters: SearchFilters): Promise<{ results: SearchResult[]; total: number }> {
    const { query, types, limit = 20 } = filters;
    const perType = Math.ceil(limit / 6);

    if (!query || query.trim().length < 2) {
      return { results: [], total: 0 };
    }

    const searchableTypes = types || ['employees', 'tasks', 'projects', 'documents', 'memos', 'chat'];
    const results: SearchResult[] = [];

    // Параллельный поиск по всем типам
    const searches = await Promise.allSettled([
      searchableTypes.includes('employees') ? this.searchEmployees(organizationId, query, perType) : Promise.resolve([]),
      searchableTypes.includes('tasks') ? this.searchTasks(organizationId, query, perType) : Promise.resolve([]),
      searchableTypes.includes('projects') ? this.searchProjects(organizationId, query, perType) : Promise.resolve([]),
      searchableTypes.includes('documents') ? this.searchDocuments(organizationId, query, perType) : Promise.resolve([]),
      searchableTypes.includes('memos') ? this.searchMemos(organizationId, query, perType) : Promise.resolve([]),
      searchableTypes.includes('chat') ? this.searchChat(organizationId, query, perType) : Promise.resolve([]),
    ]);

    for (const result of searches) {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      }
    }

    // Сортировка по релевантности (точные совпадения первыми)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;
      const bExact = b.title.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;
      return aExact - bExact;
    });

    return { results: results.slice(0, limit), total: results.length };
  }

  private async searchEmployees(orgId: string, query: string, limit: number): Promise<SearchResult[]> {
    const employees = await prisma.employee.findMany({
      where: {
        organizationId: orgId,
        isDeleted: false,
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { position: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, fullName: true, position: true, email: true, departmentId: true },
      take: limit,
    });

    return employees.map(e => ({
      type: 'employee',
      id: e.id,
      title: e.fullName,
      subtitle: e.position || e.email || undefined,
      url: `/employees/${e.id}`,
    }));
  }

  private async searchTasks(orgId: string, query: string, limit: number): Promise<SearchResult[]> {
    const tasks = await prisma.task.findMany({
      where: {
        organizationId: orgId,
        isDeleted: false,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, status: true, priority: true, createdAt: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map(t => ({
      type: 'task',
      id: t.id,
      title: t.title,
      subtitle: `${t.status} / ${t.priority}`,
      url: `/tasks/${t.id}`,
      createdAt: t.createdAt,
    }));
  }

  private async searchProjects(orgId: string, query: string, limit: number): Promise<SearchResult[]> {
    const projects = await prisma.project.findMany({
      where: {
        organizationId: orgId,
        isDeleted: false,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, status: true, createdAt: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return projects.map(p => ({
      type: 'project',
      id: p.id,
      title: p.name,
      subtitle: p.status,
      url: `/projects/${p.id}`,
      createdAt: p.createdAt,
    }));
  }

  private async searchDocuments(orgId: string, query: string, limit: number): Promise<SearchResult[]> {
    const documents = await prisma.document.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { documentType: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, documentType: true, status: true, createdAt: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return documents.map(d => ({
      type: 'document',
      id: d.id,
      title: d.title,
      subtitle: `${d.documentType} / ${d.status}`,
      url: `/documents/${d.id}`,
      createdAt: d.createdAt,
    }));
  }

  private async searchMemos(orgId: string, query: string, limit: number): Promise<SearchResult[]> {
    const memos = await prisma.memo.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { subject: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
          { registrationNumber: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, subject: true, registrationNumber: true, type: true, status: true, createdAt: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return memos.map(m => ({
      type: 'memo',
      id: m.id,
      title: m.subject,
      subtitle: `${m.registrationNumber} / ${m.type}`,
      url: `/memos/${m.id}`,
      createdAt: m.createdAt,
    }));
  }

  private async searchChat(orgId: string, query: string, limit: number): Promise<SearchResult[]> {
    const messages = await prisma.chatMessage.findMany({
      where: {
        channel: { organizationId: orgId },
        body: { contains: query, mode: 'insensitive' },
      },
      select: { id: true, body: true, channelId: true, authorId: true, createdAt: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return messages.map(m => ({
      type: 'chat',
      id: m.id,
      title: (m.body || '').substring(0, 100),
      subtitle: `Канал ${m.channelId}`,
      url: `/chat/${m.channelId}`,
      createdAt: m.createdAt,
    }));
  }
}

export default new SearchService();
