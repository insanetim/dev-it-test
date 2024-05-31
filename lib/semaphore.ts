class Semaphore {
  private queue: (() => void)[]
  private currentConcurrency: number
  private maxConcurrency: number

  constructor(maxConcurrency: number) {
    this.queue = []
    this.currentConcurrency = 0
    this.maxConcurrency = maxConcurrency
  }

  async acquire(): Promise<void> {
    if (this.currentConcurrency < this.maxConcurrency) {
      this.currentConcurrency++
      return
    }
    return new Promise(resolve => this.queue.push(resolve))
  }

  release(): void {
    if (this.queue.length > 0) {
      const nextResolve = this.queue.shift()
      if (nextResolve) nextResolve()
    } else {
      this.currentConcurrency--
    }
  }
}

export default Semaphore
