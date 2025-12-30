/**
 * SSO OIDC Types
 */

export interface SSOUser {
  id: string
  email: string
  name: string
  employeeId?: string
  department?: string
  position?: string
  avatarUrl?: string
  roleId?: string
  roleName?: string
}

export interface SSOTokens {
  accessToken: string
  refreshToken: string
  idToken: string
  expiresAt: number
}

export interface SSOAuthState {
  user: SSOUser | null
  tokens: SSOTokens | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface OIDCTokenResponse {
  access_token: string
  refresh_token: string
  id_token: string
  token_type: string
  expires_in: number
  scope?: string
}

export interface OIDCUserInfo {
  sub: string
  email: string
  name: string
  employee_id?: string
  department?: string
  position?: string
  avatar_url?: string
  role_id?: string
  role_name?: string
}

export interface PKCEPair {
  codeVerifier: string
  codeChallenge: string
}
