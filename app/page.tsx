'use client'

import { FormEvent, useRef, useState } from 'react'

import { TOTAL_REQUESTS } from '@/lib/constants'
import limitedFetch from '@/lib/limitedFetch'
import RateLimiter from '@/lib/rateLimiter'
import Semaphore from '@/lib/semaphore'

export default function Home() {
  const [responsesList, setResponsesList] = useState<Resp[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function fetchWithConcurrencyAndRateLimit(
    concurrencyLimit: number,
    requestsPerSecond: number
  ) {
    const semaphore = new Semaphore(concurrencyLimit)
    const rateLimiter = new RateLimiter(requestsPerSecond)
    const promises = Array.from({ length: TOTAL_REQUESTS }).map((_, i) =>
      limitedFetch(
        '/api',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ index: i + 1 })
        },
        semaphore,
        rateLimiter
      )
        .then(res => {
          if (!res.ok) {
            throw new Error(res.statusText)
          }

          return res.json()
        })
        .then(data => {
          setResponsesList(prev => [...prev, data])
        })
    )
    return Promise.all(promises)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setIsSubmitting(true)
    setResponsesList([])
    setError(null)

    try {
      await fetchWithConcurrencyAndRateLimit(
        inputRef.current!.valueAsNumber,
        inputRef.current!.valueAsNumber
      )
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='flex flex-col items-center justify-center'>
      <form
        className='mb-5 flex w-[300px] gap-x-4'
        onSubmit={handleSubmit}
      >
        <input
          className='w-full rounded-md'
          type='number'
          required
          min={1}
          max={100}
          defaultValue={1}
          ref={inputRef}
        />
        <button
          className='rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50'
          type='submit'
          disabled={isSubmitting}
        >
          Start
        </button>
      </form>
      {error ? (
        <p className='text-red-500'>{error}</p>
      ) : (
        <div className='flex flex-wrap gap-2'>
          {responsesList.map(({ index }) => (
            <span key={index}>{index}</span>
          ))}
        </div>
      )}
    </div>
  )
}
