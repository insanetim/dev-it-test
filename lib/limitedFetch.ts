import RateLimiter from './rateLimiter'
import Semaphore from './semaphore'

async function limitedFetch(
  url: string,
  requestInit: RequestInit = {},
  semaphore: Semaphore,
  rateLimiter: RateLimiter
): Promise<Response> {
  await semaphore.acquire()
  await rateLimiter.acquire()
  try {
    const response = await fetch(url, requestInit)
    return response
  } finally {
    semaphore.release()
  }
}

export default limitedFetch
