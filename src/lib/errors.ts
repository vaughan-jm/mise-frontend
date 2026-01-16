/**
 * Custom Error Classes
 *
 * Centralized error handling for the frontend.
 * All custom errors should extend AppError.
 */

/**
 * Base error class for application errors
 */
export class AppError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

/**
 * Error class for API request failures
 */
export class ApiRequestError extends AppError {
  status?: number

  constructor(message: string, code: string, status?: number) {
    super(message, code)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

/**
 * Error class for network failures
 */
export class NetworkError extends AppError {
  constructor(message = 'Network request failed') {
    super(message, 'NETWORK_ERROR')
    this.name = 'NetworkError'
  }
}

/**
 * Error class for timeout failures
 */
export class TimeoutError extends AppError {
  constructor(message = 'Request timed out') {
    super(message, 'TIMEOUT')
    this.name = 'TimeoutError'
  }
}

/**
 * Normalize any error into an AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return new TimeoutError()
    }
    return new AppError(error.message, 'UNKNOWN')
  }

  return new AppError('An unexpected error occurred', 'UNKNOWN')
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}
