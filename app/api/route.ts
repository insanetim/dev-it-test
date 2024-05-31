import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from 'limiter'

import { REQUESTS_PER_SECOND } from '@/lib/constants'
import { getRandomInRange, wait } from '@/lib/utils'

const limiter = new RateLimiter({
  tokensPerInterval: REQUESTS_PER_SECOND,
  interval: 'second',
  fireImmediately: true
})

export async function POST(request: NextRequest) {
  try {
    const { index } = await request.json()
    const remaining = await limiter.removeTokens(1)
    const origin = request.headers.get('origin')

    if (remaining < 0) {
      return new NextResponse(null, {
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Content-Type': 'text/plain'
        }
      })
    }

    await wait(getRandomInRange(1, 1000))

    return NextResponse.json({ index })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Index is missing' }, { status: 400 })
  }
}
