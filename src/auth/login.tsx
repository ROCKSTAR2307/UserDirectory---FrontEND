import { useCallback } from 'react';
import { AppProvider } from '@toolpad/core/AppProvider';
import { SignInPage } from '@toolpad/core/SignInPage';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useNotification } from '../components/NotificationContext';
import { API_BASE } from '../components/config';

const providers = [{ id: 'credentials', name: 'Email and Password' }];

interface SignInProvider {
  id: string;
  name?: string;
}

function Login(): JSX.Element {
  const { showNotification } = useNotification();
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#1e40af' },
      background: { default: '#f8fafc' }
    }
  });

  const signIn = useCallback(
    async (_provider: SignInProvider, formData: FormData) => {
      const emailEntry = formData.get('email');
      const passwordEntry = formData.get('password');
      const email = typeof emailEntry === 'string' ? emailEntry.trim() : '';
      const password = typeof passwordEntry === 'string' ? passwordEntry.trim() : '';

      try {
        const bodyData = new URLSearchParams();
        bodyData.append('email', email);
        bodyData.append('password', password);

        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: bodyData
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `HTTP ${res.status}`);
        }

        const data = (await res.json()) as { access_token?: string };

        if (!data.access_token) {
          throw new Error('No token received from server');
        }

        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('token', data.access_token);
        localStorage.setItem('email', email);

        window.location.reload();
      } catch (error) {
        console.error('Login failed:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        showNotification(`Invalid credentials or server error\n${message}`, 'error');
      }
    },
    [showNotification]
  );

  return (
    <ThemeProvider theme={theme}>
      <AppProvider theme={theme}>
        <SignInPage
          signIn={signIn}
          providers={providers}
          slotProps={{
            emailField: { label: 'Admin ID', autoFocus: true },
            passwordField: { label: 'Password' }
          }}
        />
      </AppProvider>
    </ThemeProvider>
  );
}

export default Login;

