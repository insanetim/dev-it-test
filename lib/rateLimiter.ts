class RateLimiter {
  private tokens: number
  private maxTokens: number
  private interval: number
  private lastRequestTime: number

  constructor(requestsPerSecond: number) {
    this.tokens = requestsPerSecond
    this.maxTokens = requestsPerSecond
    this.interval = 1000 / requestsPerSecond
    this.lastRequestTime = Date.now()
  }

  async acquire(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRequestTime

    this.tokens += elapsed / this.interval
    if (this.tokens > this.maxTokens) {
      this.tokens = this.maxTokens
    }

    if (this.tokens >= 1) {
      this.tokens -= 1
      this.lastRequestTime = now
      return
    }

    const waitTime = (1 - this.tokens) * this.interval
    this.tokens = 0
    return new Promise(resolve => setTimeout(resolve, waitTime))
  }
}

export default RateLimiter
