export type AdminUser = {
  user_id: string;
  user_type: string;
  state?: string;
  name?: string;
  email?: string;
};

export type AdminSessionPayload = {
  ok?: boolean;
  authenticated?: boolean;
  user?: AdminUser | null;
  roles?: string[];
  powers?: string[];
  redirectTo?: string;
  error?: string;
  code?: string;
};
