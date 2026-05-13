import {
  createContext,
  useEffect,
  useState
} from 'react'

import api from '../api'

export const AuthContext =
  createContext()

export const AuthProvider = ({
  children
}) => {

  const [user, setUser] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const checkAuth = async () => {

    const token =
      localStorage.getItem('token')

    if (!token) {
      setLoading(false)
      return
    }

    try {

      const res = await api.get(
        '/auth/me'
      )

      setUser(res.data)

    } catch (e) {

      localStorage.removeItem(
        'token'
      )

      setUser(null)

    } finally {

      setLoading(false)

    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = (
    token,
    userData
  ) => {

    localStorage.setItem(
      'token',
      token
    )
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}