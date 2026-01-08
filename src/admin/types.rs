//! Admin API 类型定义

use serde::{Deserialize, Serialize};

// ============ 凭据状态 ============

/// 所有凭据状态响应
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CredentialsStatusResponse {
    /// 凭据总数
    pub total: usize,
    /// 可用凭据数量（未禁用）
    pub available: usize,
    /// 当前活跃凭据 ID
    pub current_id: u64,
    /// 各凭据状态列表
    pub credentials: Vec<CredentialStatusItem>,
}

/// 单个凭据的状态信息
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CredentialStatusItem {
    /// 凭据唯一 ID
    pub id: u64,
    /// 优先级（数字越小优先级越高）
    pub priority: u32,
    /// 是否被禁用
    pub disabled: bool,
    /// 连续失败次数
    pub failure_count: u32,
    /// 是否为当前活跃凭据
    pub is_current: bool,
    /// Token 过期时间（RFC3339 格式）
    pub expires_at: Option<String>,
    /// 认证方式
    pub auth_method: Option<String>,
    /// 是否有 Profile ARN
    pub has_profile_arn: bool,
}

// ============ 操作请求 ============

/// 启用/禁用凭据请求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetDisabledRequest {
    /// 是否禁用
    pub disabled: bool,
}

/// 修改优先级请求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetPriorityRequest {
    /// 新优先级值
    pub priority: u32,
}

/// 添加凭据请求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddCredentialRequest {
    /// 刷新令牌（必填）
    pub refresh_token: String,

    /// 认证方式（可选，默认 social）
    #[serde(default = "default_auth_method")]
    pub auth_method: String,

    /// OIDC Client ID（IdC 认证需要）
    pub client_id: Option<String>,

    /// OIDC Client Secret（IdC 认证需要）
    pub client_secret: Option<String>,

    /// 优先级（可选，默认 0）
    #[serde(default)]
    pub priority: u32,
}

fn default_auth_method() -> String {
    "social".to_string()
}

/// 添加凭据成功响应
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AddCredentialResponse {
    pub success: bool,
    pub message: String,
    /// 新添加的凭据 ID
    pub credential_id: u64,
}

// ============ 批量导入 ============

/// 批量导入凭据请求（来自 Kiro 账户管理工具导出的格式）
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchImportRequest {
    /// 导出版本
    #[serde(default)]
    pub version: Option<String>,

    /// 导出时间戳
    #[serde(default)]
    pub exported_at: Option<u64>,

    /// 账户列表
    pub accounts: Vec<ImportAccount>,

    /// 分组（可选）
    #[serde(default)]
    pub groups: Vec<serde_json::Value>,

    /// 标签（可选）
    #[serde(default)]
    pub tags: Vec<serde_json::Value>,
}

/// 导入的账户信息
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportAccount {
    /// 邮箱
    #[serde(default)]
    pub email: Option<String>,

    /// 用户 ID
    #[serde(default)]
    pub user_id: Option<String>,

    /// 昵称
    #[serde(default)]
    pub nickname: Option<String>,

    /// 身份提供者 (Google, Github, BuilderId)
    #[serde(default)]
    pub idp: Option<String>,

    /// 凭据信息
    pub credentials: ImportCredentials,

    /// 订阅信息（可选）
    #[serde(default)]
    pub subscription: Option<serde_json::Value>,

    /// 使用量信息（可选）
    #[serde(default)]
    pub usage: Option<serde_json::Value>,

    /// 标签
    #[serde(default)]
    pub tags: Vec<String>,

    /// 状态
    #[serde(default)]
    pub status: Option<String>,
}

/// 导入的凭据详情
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportCredentials {
    /// 访问令牌
    #[serde(default)]
    pub access_token: Option<String>,

    /// CSRF Token
    #[serde(default)]
    pub csrf_token: Option<String>,

    /// 刷新令牌（必需）
    pub refresh_token: Option<String>,

    /// OIDC Client ID
    #[serde(default)]
    pub client_id: Option<String>,

    /// OIDC Client Secret
    #[serde(default)]
    pub client_secret: Option<String>,

    /// 区域
    #[serde(default)]
    pub region: Option<String>,

    /// 过期时间戳
    #[serde(default)]
    pub expires_at: Option<u64>,

    /// 认证方式 (social / IdC)
    #[serde(default)]
    pub auth_method: Option<String>,

    /// 提供者 (Google, Github 等)
    #[serde(default)]
    pub provider: Option<String>,
}

/// 批量导入结果
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchImportResponse {
    /// 是否成功
    pub success: bool,
    /// 消息
    pub message: String,
    /// 成功导入数量
    pub imported_count: usize,
    /// 跳过数量（重复或无效）
    pub skipped_count: usize,
    /// 失败数量
    pub failed_count: usize,
    /// 详细结果
    pub results: Vec<ImportResult>,
}

/// 单个导入结果
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    /// 账户标识（邮箱或昵称）
    pub identifier: String,
    /// 是否成功
    pub success: bool,
    /// 消息
    pub message: String,
    /// 新凭据 ID（成功时）
    pub credential_id: Option<u64>,
}

// ============ 余额查询 ============

/// 余额查询响应
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BalanceResponse {
    /// 凭据 ID
    pub id: u64,
    /// 订阅类型
    pub subscription_title: Option<String>,
    /// 当前使用量
    pub current_usage: f64,
    /// 使用限额
    pub usage_limit: f64,
    /// 剩余额度
    pub remaining: f64,
    /// 使用百分比
    pub usage_percentage: f64,
    /// 下次重置时间（Unix 时间戳）
    pub next_reset_at: Option<f64>,
}

// ============ 通用响应 ============

/// 操作成功响应
#[derive(Debug, Serialize)]
pub struct SuccessResponse {
    pub success: bool,
    pub message: String,
}

impl SuccessResponse {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            success: true,
            message: message.into(),
        }
    }
}

/// 错误响应
#[derive(Debug, Serialize)]
pub struct AdminErrorResponse {
    pub error: AdminError,
}

#[derive(Debug, Serialize)]
pub struct AdminError {
    #[serde(rename = "type")]
    pub error_type: String,
    pub message: String,
}

impl AdminErrorResponse {
    pub fn new(error_type: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            error: AdminError {
                error_type: error_type.into(),
                message: message.into(),
            },
        }
    }

    pub fn invalid_request(message: impl Into<String>) -> Self {
        Self::new("invalid_request", message)
    }

    pub fn authentication_error() -> Self {
        Self::new("authentication_error", "Invalid or missing admin API key")
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new("not_found", message)
    }

    pub fn api_error(message: impl Into<String>) -> Self {
        Self::new("api_error", message)
    }

    pub fn internal_error(message: impl Into<String>) -> Self {
        Self::new("internal_error", message)
    }
}
