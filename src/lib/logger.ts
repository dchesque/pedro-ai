type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  // IDs
  userId?: string
  shortId?: string
  sceneId?: string
  requestId?: string

  // Operação
  model?: string
  step?: string

  // Métricas
  duration?: number
  credits?: number
  progress?: string

  // Dados extras
  [key: string]: unknown
}

const LOG_COLORS = {
  debug: '\x1b[90m',   // Cinza
  info: '\x1b[36m',    // Ciano
  warn: '\x1b[33m',    // Amarelo
  error: '\x1b[31m',   // Vermelho
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bright: '\x1b[1m',
}

const LOG_ICONS = {
  debug: '🔍',
  info: '📘',
  warn: '⚠️',
  error: '❌',
}

// Nível mínimo baseado em ambiente
const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL]
}

function formatTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 23)
}

function truncate(str: string, maxLength: number = 50): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - 3) + '...'
}

function formatContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) return ''

  const parts: string[] = []

  // IDs (truncados)
  if (context.userId) parts.push(`user:${context.userId.substring(0, 8)}`)
  if (context.shortId) parts.push(`short:${context.shortId.substring(0, 8)}`)
  if (context.sceneId) parts.push(`scene:${context.sceneId.substring(0, 8)}`)
  if (context.requestId) parts.push(`req:${context.requestId.substring(0, 8)}`)

  // Operação
  if (context.model) parts.push(`model:${context.model}`)
  if (context.step) parts.push(`step:${context.step}`)

  // Métricas
  if (context.duration !== undefined) parts.push(`${context.duration}ms`)
  if (context.credits !== undefined) parts.push(`${context.credits}cr`)
  if (context.progress) parts.push(context.progress)

  // Campos extras (excluindo os já processados e erros)
  const processedKeys = ['userId', 'shortId', 'sceneId', 'requestId', 'model', 'step', 'duration', 'credits', 'progress', 'error']
  const extraKeys = Object.keys(context).filter(k => !processedKeys.includes(k))

  for (const key of extraKeys) {
    const value = context[key]
    if (value !== undefined && value !== null) {
      if (typeof value === 'string') {
        parts.push(`${key}:${truncate(value, 30)}`)
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        parts.push(`${key}:${value}`)
      } else {
        parts.push(`${key}:${truncate(JSON.stringify(value), 30)}`)
      }
    }
  }

  return parts.length > 0 ? ` [${parts.join(' | ')}]` : ''
}

function log(level: LogLevel, module: string, message: string, context?: LogContext) {
  if (!shouldLog(level)) return

  const color = LOG_COLORS[level]
  const icon = LOG_ICONS[level]
  const timestamp = formatTimestamp()
  const contextStr = formatContext(context)

  // Módulo com padding para alinhamento
  const formattedModule = `[${module}]`.padEnd(25)

  console.log(
    `${LOG_COLORS.dim}${timestamp}${LOG_COLORS.reset} ${icon} ${color}${formattedModule}${LOG_COLORS.reset} ${message}${LOG_COLORS.dim}${contextStr}${LOG_COLORS.reset}`
  )

  // Stack trace para erros
  if (level === 'error' && context?.error instanceof Error) {
    console.error(`${LOG_COLORS.dim}${(context.error as Error).stack}${LOG_COLORS.reset}`)
  }
}

/**
 * Cria um logger para um módulo específico
 * @param module Nome do módulo (ex: 'shorts/pipeline', 'fal/flux')
 */
export function createLogger(module: string) {
  return {
    debug: (message: string, context?: LogContext) => log('debug', module, message, context),
    info: (message: string, context?: LogContext) => log('info', module, message, context),
    warn: (message: string, context?: LogContext) => log('warn', module, message, context),
    error: (message: string, context?: LogContext) => log('error', module, message, context),

    /**
     * Inicia uma operação e retorna o timestamp para medir duração
     */
    start: (operation: string, context?: LogContext): number => {
      log('info', module, `🚀 ${operation}`, context)
      return Date.now()
    },

    /**
     * Marca operação como sucesso
     */
    success: (operation: string, startTime?: number, context?: LogContext) => {
      const duration = startTime ? Date.now() - startTime : undefined
      log('info', module, `✅ ${operation}`, { ...context, duration })
    },

    /**
     * Marca operação como falha
     */
    fail: (operation: string, error: unknown, context?: LogContext) => {
      const err = error instanceof Error ? error : new Error(String(error))
      log('error', module, `❌ ${operation}: ${err.message}`, { ...context, error: err })
    },

    /**
     * Log de progresso (ex: 3/10)
     */
    progress: (current: number, total: number, label: string, context?: LogContext) => {
      const percent = Math.round((current / total) * 100)
      log('info', module, `⏳ ${label}`, { ...context, progress: `${current}/${total} (${percent}%)` })
    },

    /**
     * Log de etapa/step
     */
    step: (stepName: string, context?: LogContext) => {
      log('info', module, `📍 ${stepName}`, context)
    },
  }
}

// Logger padrão
export const logger = createLogger('app')

// --- Funções de Compatibilidade (Sistema Antigo/API) ---

export function isApiLoggingEnabled(): boolean {
  return process.env.ENABLE_API_LOGGING !== 'false'
}

export function getApiLogMinimumStatus(): number {
  return parseInt(process.env.API_LOG_MIN_STATUS || '400')
}

export const logDebug = (message: string, context?: LogContext) => log('debug', 'api', message, context)
export const logInfo = (message: string, context?: LogContext) => log('info', 'api', message, context)
export const logWarn = (message: string, context?: LogContext) => log('warn', 'api', message, context)
export const logError = (message: string, context?: LogContext) => log('error', 'api', message, context)

