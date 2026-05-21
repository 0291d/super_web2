import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { GlobalProvider } from './context/GlobalContext';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <GlobalProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" />
      </GlobalProvider>
    </AuthProvider>
  );
}
