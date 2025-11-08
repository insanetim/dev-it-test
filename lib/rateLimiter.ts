// rateLimiter.ts
export default class RateLimiter {
  private tokens: number
  private maxTokens: number
  private interval: number
  private lastRequestTime: number

  // очередь промисов для сериализации доступа
  private queue: Array<() => void> = []
  private processing = false

  constructor(requestsPerSecond: number) {
    if (requestsPerSecond <= 0) throw new Error('requestsPerSecond must be > 0')
    this.tokens = requestsPerSecond
    this.maxTokens = requestsPerSecond
    this.interval = 1000 / requestsPerSecond
    this.lastRequestTime = Date.now()
  }

  // публичный метод: возвращает промис, который разрешится когда можно выполнить запрос
  async acquire(): Promise<void> {
    return new Promise<void>(resolve => {
      this.queue.push(resolve)
      if (!this.processing) this.processQueue()
    })
  }

  // внутренний сериализованный обработчик очереди
  private async processQueue() {
    this.processing = true
    while (this.queue.length > 0) {
      const resolve = this.queue.shift()!
      await this.ensureToken() // дождаться/списать токен
      resolve()
    }
    this.processing = false
  }

  // обновляет токены на основе времени и либо мгновенно списывает токен,
  // либо ждёт нужное время, списывает и возвращает
  private async ensureToken(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRequestTime
    this.tokens += elapsed / this.interval
    if (this.tokens > this.maxTokens) this.tokens = this.maxTokens

    if (this.tokens >= 1) {
      this.tokens -= 1
      this.lastRequestTime = Date.now()
      return
    }

    // сколько ждать до появления 1 токена
    const waitTime = Math.ceil((1 - this.tokens) * this.interval)
    // ждем и после таймаута списываем токен и фиксируем время
    await new Promise<void>(res => setTimeout(res, waitTime))
    // после ожидания пересчитываем время/токены аккуратно:
    const after = Date.now()
    const elapsedAfter = after - this.lastRequestTime
    this.tokens += elapsedAfter / this.interval
    if (this.tokens > this.maxTokens) this.tokens = this.maxTokens
    // теперь должен быть >=1, но для надёжности:
    if (this.tokens < 1) {
      // маловероятно, но на случай системных задержек — рекурсивно дождёмся
      return this.ensureToken()
    }
    this.tokens -= 1
    this.lastRequestTime = Date.now()
  }
}
