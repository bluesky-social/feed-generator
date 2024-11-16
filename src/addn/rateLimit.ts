import { pRateLimit } from 'p-ratelimit'

const _limit = pRateLimit({
  interval: undefined,
  rate: undefined,
  concurrency: undefined,
  maxDelay: undefined,
})

const limit = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  try {
    return await _limit(fn)
  } catch (error) {
    if (retries > 0) {
      console.log(`retrying limited call:\n${fn.toString()}`)
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))
      await delay(10000)
      return await limit(fn, retries - 1)
    } else {
      console.log(`error in limited call:\n${fn.toString()}\n${error}`)
      throw error
    }
  }
}

export default limit
