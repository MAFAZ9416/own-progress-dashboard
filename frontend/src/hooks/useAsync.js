import { useState, useCallback } from 'react'

/**
 * useAsync
 *
 * Generic hook for managing async operations (API calls, etc.)
 *
 * @param {Function} asyncFn  - the async function to call
 * @returns {{ execute, data, isLoading, error, reset }}
 *
 * Usage:
 *   const { execute, data, isLoading, error } = useAsync(skillsService.getAll)
 *   useEffect(() => { execute() }, [])
 */
export function useAsync(asyncFn) {
  const [data, setData]         = useState(null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState(null)

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      try {
        const result = await asyncFn(...args)
        setData(result)
        return result
      } catch (err) {
        setError(err?.response?.data?.message ?? err.message ?? 'An error occurred')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [asyncFn],
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { execute, data, isLoading, error, reset }
}
