// Admin Service - API calls

const API_BASE = (import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || 'http://localhost:3000/api';

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';

export interface DashboardStats {
  totalUsers: number;
  totalStories: number;
  totalComments: number;
  totalLikes: number;
  totalCommunities: number;
  totalEvents: number;
  newUsersToday: number;
  newStoriesToday: number;
  activeUsersToday: number;
}

export interface AdminUser {
  id: string;
  email: string;
  nombre: string;
  apellido: string | null;
  avatar: string | null;
  role: UserRole;
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
  storiesCount: number;
  followersCount: number;
}

export interface ContentItem {
  id: string;
  description: string;
  mediaUrl: string;
  mediaType: string;
  authorId: string;
  authorName: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface ReportsData {
  userGrowth: Array<{ date: string; count: number }>;
  storyGrowth: Array<{ date: string; count: number }>;
  topCreators: Array<{ id: string; nombre: string; storiesCount: number }>;
}

// Get dashboard stats
export async function getDashboardStats(token: string): Promise<DashboardStats> {
  const response = await fetch(`${API_BASE}/admin/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener dashboard');
  }

  const data = await response.json();
  return data.data;
}

// Get users
export async function getUsers(
  token: string,
  page: number = 1,
  limit: number = 20,
  filters: {
    search?: string;
    role?: UserRole;
    banned?: boolean;
  } = {}
): Promise<{ users: AdminUser[]; total: number }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters.search) params.append('search', filters.search);
  if (filters.role) params.append('role', filters.role);
  if (filters.banned !== undefined) params.append('banned', filters.banned.toString());

  const response = await fetch(`${API_BASE}/admin/users?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener usuarios');
  }

  const data = await response.json();
  return data.data;
}

// Change user role
export async function changeUserRole(userId: string, role: UserRole, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al cambiar rol');
  }
}

// Ban user
export async function banUser(userId: string, reason: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/users/${userId}/ban`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al banear usuario');
  }
}

// Unban user
export async function unbanUser(userId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/users/${userId}/ban`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al desbanear usuario');
  }
}

// Get content for moderation
export async function getContent(
  token: string,
  page: number = 1,
  limit: number = 20,
  type: 'all' | 'recent' = 'recent'
): Promise<{ content: ContentItem[]; total: number }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    type,
  });

  const response = await fetch(`${API_BASE}/admin/content?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener contenido');
  }

  const data = await response.json();
  return data.data;
}

// Delete content
export async function deleteContent(storyId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/content/${storyId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al eliminar contenido');
  }
}

// Get reports
export async function getReports(days: number = 30, token: string): Promise<ReportsData> {
  const response = await fetch(`${API_BASE}/admin/reports?days=${days}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener reportes');
  }

  const data = await response.json();
  return data.data;
}
