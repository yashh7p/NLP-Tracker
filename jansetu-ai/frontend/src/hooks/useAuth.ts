import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../services/api'
import type { User } from '../types'

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['me'],
    queryFn: authApi.me,
    retry: false,
    enabled: !!localStorage.getItem('access_token'),
  })

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    await queryClient.invalidateQueries({ queryKey: ['me'] })
    return data
  }, [queryClient])

  const register = useCallback(async (payload: {
    email: string
    full_name: string
    phone?: string
    password: string
    role?: string
  }) => {
    return authApi.register(payload)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    queryClient.clear()
    window.location.href = '/login'
  }, [queryClient])

  return { user: error ? null : user, isLoading, login, register, logout }
}
