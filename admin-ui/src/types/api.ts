// 凭据状态响应
export interface CredentialsStatusResponse {
  total: number
  available: number
  currentId: number
  credentials: CredentialStatusItem[]
}

// 单个凭据状态
export interface CredentialStatusItem {
  id: number
  priority: number
  disabled: boolean
  failureCount: number
  isCurrent: boolean
  expiresAt: string | null
  authMethod: string | null
  hasProfileArn: boolean
}

// 余额响应
export interface BalanceResponse {
  id: number
  subscriptionTitle: string | null
  currentUsage: number
  usageLimit: number
  remaining: number
  usagePercentage: number
  nextResetAt: number | null
}

// 成功响应
export interface SuccessResponse {
  success: boolean
  message: string
}

// 错误响应
export interface AdminErrorResponse {
  error: {
    type: string
    message: string
  }
}

// 请求类型
export interface SetDisabledRequest {
  disabled: boolean
}

export interface SetPriorityRequest {
  priority: number
}

// 添加凭据请求
export interface AddCredentialRequest {
  refreshToken: string
  authMethod?: 'social' | 'idc' | 'builder-id'
  clientId?: string
  clientSecret?: string
  priority?: number
}

// 添加凭据响应
export interface AddCredentialResponse {
  success: boolean
  message: string
  credentialId: number
}

// 批量导入请求
export interface BatchImportRequest {
  version?: string
  exportedAt?: number
  accounts: ImportAccount[]
  groups?: unknown[]
  tags?: unknown[]
}

// 导入的账户信息
export interface ImportAccount {
  email?: string
  userId?: string
  nickname?: string
  idp?: string
  credentials: ImportCredentials
  subscription?: unknown
  usage?: unknown
  tags?: string[]
  status?: string
}

// 导入的凭据详情
export interface ImportCredentials {
  accessToken?: string
  csrfToken?: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
  region?: string
  expiresAt?: number
  authMethod?: string
  provider?: string
}

// 批量导入响应
export interface BatchImportResponse {
  success: boolean
  message: string
  importedCount: number
  skippedCount: number
  failedCount: number
  results: ImportResult[]
}

// 单个导入结果
export interface ImportResult {
  identifier: string
  success: boolean
  message: string
  credentialId?: number
}
