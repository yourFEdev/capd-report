export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
