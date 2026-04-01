const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (email, password, name, company) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name, company }) }),

  getPartners: () => request('/admin/partners'),

  approvePartner: (id) => request(`/admin/partners/${id}/approve`, { method: 'PATCH' }),

  rejectPartner: (id) => request(`/admin/partners/${id}/reject`, { method: 'PATCH' }),

  getUseCases: () => request('/admin/usecases'),

  deleteUseCase: (id) => request(`/admin/usecases/${id}`, { method: 'DELETE' }),

  uploadFile: (file) => {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    return fetch(`${BASE}/admin/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Upload failed');
      return data;
    });
  },

  query: (industry) =>
    request('/query', { method: 'POST', body: JSON.stringify({ industry }) })
};
