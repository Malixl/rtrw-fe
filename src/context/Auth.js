import { createContext } from 'react';

const AuthContext = createContext({
  login: () => Promise.resolve({ isSuccess: false, message: '' }),
  logout: () => undefined,
  forgot: () => Promise.resolve({ isSuccess: false, message: '' }),
  reset: () => Promise.resolve({ isSuccess: false, message: '' }),
  token: JSON.parse(localStorage.getItem('token'))?.data || '',
  user: null,
  isLoading: false,
  onUnauthorized: () => { }
});

export default AuthContext;
