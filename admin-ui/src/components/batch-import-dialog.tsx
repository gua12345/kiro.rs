import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, FileJson, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useBatchImport } from '@/hooks/use-credentials'
import { extractErrorMessage } from '@/lib/utils'
import type { BatchImportRequest, BatchImportResponse, ImportResult } from '@/types/api'

interface BatchImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BatchImportDialog({ open, onOpenChange }: BatchImportDialogProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [parsedData, setParsedData] = useState<BatchImportRequest | null>(null)
  const [parseError, setParseError] = useState<string>('')
  const [importResult, setImportResult] = useState<BatchImportResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutate, isPending } = useBatchImport()

  // 重置状态
  const resetState = () => {
    setParsedData(null)
    setParseError('')
    setImportResult(null)
  }

  // 解析 JSON 内容
  const parseJsonContent = (content: string) => {
    setParseError('')
    setParsedData(null)
    setImportResult(null)

    if (!content.trim()) {
      return
    }

    try {
      const data = JSON.parse(content) as BatchImportRequest

      // 验证数据结构
      if (!data.accounts || !Array.isArray(data.accounts)) {
        setParseError('无效的数据格式：缺少 accounts 数组')
        return
      }

      if (data.accounts.length === 0) {
        setParseError('accounts 数组为空')
        return
      }

      // 检查每个账户是否有 credentials
      const invalidAccounts = data.accounts.filter(
        (acc) => !acc.credentials || !acc.credentials.refreshToken
      )

      if (invalidAccounts.length > 0) {
        setParseError(`${invalidAccounts.length} 个账户缺少有效的 credentials.refreshToken`)
        return
      }

      setParsedData(data)
    } catch {
      setParseError('JSON 解析失败，请检查格式是否正确')
    }
  }

  // 处理文件读取
  const handleFileRead = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      parseJsonContent(content)
    }
    reader.onerror = () => {
      setParseError('文件读取失败')
    }
    reader.readAsText(file)
  }

  // 拖拽事件处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        handleFileRead(file)
      } else {
        setParseError('请上传 JSON 文件')
      }
    }
  }, [])

  // 粘贴事件处理
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text')
    if (text) {
      parseJsonContent(text)
    }
  }, [])

  // 文件选择处理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileRead(file)
    }
  }

  // 提交导入
  const handleSubmit = () => {
    if (!parsedData) return

    mutate(parsedData, {
      onSuccess: (data) => {
        setImportResult(data)
        if (data.success) {
          toast.success(data.message)
        } else {
          toast.warning(data.message)
        }
      },
      onError: (error: unknown) => {
        toast.error(`导入失败: ${extractErrorMessage(error)}`)
      },
    })
  }

  // 关闭对话框
  const handleClose = (open: boolean) => {
    if (!open) {
      resetState()
    }
    onOpenChange(open)
  }

  // 渲染导入结果
  const renderImportResults = (results: ImportResult[]) => (
    <div className="max-h-60 overflow-y-auto space-y-2">
      {results.map((result, index) => (
        <div
          key={index}
          className={`flex items-start gap-2 p-2 rounded text-sm ${
            result.success
              ? 'bg-green-50 dark:bg-green-950'
              : 'bg-red-50 dark:bg-red-950'
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{result.identifier}</div>
            <div className="text-muted-foreground text-xs">{result.message}</div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>批量导入凭据</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 导入结果显示 */}
          {importResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.importedCount}
                  </div>
                  <div className="text-xs text-muted-foreground">成功</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {importResult.skippedCount}
                  </div>
                  <div className="text-xs text-muted-foreground">跳过</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.failedCount}
                  </div>
                  <div className="text-xs text-muted-foreground">失败</div>
                </div>
              </div>
              {renderImportResults(importResult.results)}
            </div>
          ) : (
            <>
              {/* 拖拽/粘贴区域 */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
                tabIndex={0}
              >
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <div className="text-sm text-muted-foreground mb-2">
                  拖拽 JSON 文件到此处，或点击选择文件
                </div>
                <div className="text-xs text-muted-foreground mb-4">
                  也可以直接粘贴 JSON 内容 (Ctrl+V)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  选择文件
                </Button>
              </div>

              {/* 解析错误 */}
              {parseError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {parseError}
                </div>
              )}

              {/* 解析成功预览 */}
              {parsedData && (
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">解析成功</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>版本: {parsedData.version || '未知'}</div>
                    <div>账户数量: {parsedData.accounts.length} 个</div>
                    {parsedData.exportedAt && (
                      <div>
                        导出时间: {new Date(parsedData.exportedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {importResult ? (
            <Button onClick={() => handleClose(false)}>完成</Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isPending}
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!parsedData || isPending}
              >
                {isPending ? '导入中...' : `导入 ${parsedData?.accounts.length || 0} 个凭据`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
