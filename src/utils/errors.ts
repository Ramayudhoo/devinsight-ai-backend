export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class GithubUserNotFoundError extends AppError {
  constructor(username: string) {
    super(404, 'GITHUB_USER_NOT_FOUND', `GitHub user "${username}" tidak ditemukan`)
  }
}

export class GithubApiError extends AppError {
  constructor(message: string) {
    super(502, 'GITHUB_API_ERROR', message)
  }
}

export class AiResponseInvalidError extends AppError {
  constructor() {
    super(502, 'AI_RESPONSE_INVALID', 'AI mengembalikan format yang tidak valid')
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(422, 'VALIDATION_ERROR', message)
  }
}

export class RateLimitExceededError extends AppError {
  constructor() {
    super(429, 'RATE_LIMIT_EXCEEDED', 'Terlalu banyak request, coba lagi nanti')
  }
}
