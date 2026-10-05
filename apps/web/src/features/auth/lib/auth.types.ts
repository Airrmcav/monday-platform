export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "SELLER";
  companyId: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export interface LoginRequest {
  email: string;
  password: string;
}
