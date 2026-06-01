import axios from 'axios';

const API_URL = 'http://host67.expnac.local:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/token', formData);
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  },
  
  register: async (data: { email: string; nome: string; senha: string }) => {
    const response = await api.post('/register', data);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/me');
    return response.data;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const employeeService = {
  list: async () => {
    const response = await api.get('/employees');
    return response.data;
  },
  
  get: async (id: number) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/employees', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  }
};

export const indicatorService = {
  list: async (area?: string) => {
    const response = await api.get('/indicators', { params: { area } });
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/indicators', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/indicators/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/indicators/${id}`);
    return response.data;
  }
};

export const feedbackService = {
  list: async (employeeId?: number) => {
    const response = await api.get('/feedbacks', { params: { employee_id: employeeId } });
    return response.data;
  },
  
  get: async (id: number) => {
    const response = await api.get(`/feedbacks/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/feedbacks', data);
    return response.data;
  },
  
  sign: async (id: number, data: { senha_assinatura: string; comentario_colaborador?: string }) => {
    const response = await api.post(`/feedbacks/${id}/sign`, data);
    return response.data;
  },
  
  downloadPDF: async (id: number) => {
    const response = await api.get(`/feedbacks/${id}/pdf`, { responseType: 'blob' });
    
    // Extrair nome do arquivo do header Content-Disposition
    const contentDisposition = response.headers['content-disposition'];
    let filename = `feedback_${id}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename=(.+)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/"/g, '');
      }
    }
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
};

export default api;
