export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions?: string[];
}

export interface AuthResponse {
  status: string;
  message?: string;
  data: {
    user: User;
    token: string;
    token_type: string;
  };
}
