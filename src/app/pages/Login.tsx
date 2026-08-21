import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

function destinationForRole(role: string, redirectTo: string, adminRedirectTo: string) {
  if (role === 'admin') return adminRedirectTo;
  if (role === 'warehouse') return redirectTo.startsWith('/warehouse') ? redirectTo : '/warehouse';
  if (role === 'accountant') return redirectTo.startsWith('/accountant') ? redirectTo : '/accountant';
  return redirectTo;
}

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAuthLoading, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: string } | null;
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get('redirect');
    const fromState = state?.from;
    const target = fromState || fromQuery || '/';

    return target.startsWith('/') && !target.startsWith('//') && target !== '/login' ? target : '/';
  }, [location.search, location.state]);

  const adminRedirectTo = redirectTo.startsWith('/admin') ? redirectTo : '/admin';

  useEffect(() => {
    if (isAuthLoading || !user) return;
    navigate(destinationForRole(user.role, redirectTo, adminRedirectTo), { replace: true });
  }, [adminRedirectTo, isAuthLoading, navigate, redirectTo, user]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '');
    const password = String(formData.get('password') || '');

    try {
      const user = await login(email, password);
      toast.success(`Signed in as ${user.email}`);
      navigate(destinationForRole(user.role, redirectTo, adminRedirectTo), { replace: true });
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const user = await register({
        firstName: String(formData.get('firstName') || ''),
        lastName: String(formData.get('lastName') || ''),
        email: String(formData.get('email') || ''),
        password: String(formData.get('password') || ''),
        newsletter: formData.get('newsletter') === 'on',
      });
      toast.success('Account created');
      navigate(destinationForRole(user.role, redirectTo, '/admin'), { replace: true });
    } catch {
      toast.error('Unable to create account. Password must be at least 8 characters.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-6 py-20 flex justify-center min-h-[70vh]">
      <div className="w-full max-w-md">
        <div className="flex gap-8 mb-12 border-b border-[#EAE7E0]">
          <button
            className={`pb-4 text-sm font-medium tracking-widest uppercase transition-colors relative ${isLogin ? 'text-[#2D2D2D]' : 'text-[#9E9B94] hover:text-[#737373]'}`}
            onClick={() => setIsLogin(true)}
            type="button"
          >
            Login
            {isLogin && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2D2D2D]" />}
          </button>
          <button
            className={`pb-4 text-sm font-medium tracking-widest uppercase transition-colors relative ${!isLogin ? 'text-[#2D2D2D]' : 'text-[#9E9B94] hover:text-[#737373]'}`}
            onClick={() => setIsLogin(false)}
            type="button"
          >
            Register
            {!isLogin && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2D2D2D]" />}
          </button>
        </div>

        {isAuthLoading ? (
          <div className="py-16 text-center text-sm text-[#737373]">Checking account...</div>
        ) : isLogin ? (
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium tracking-wide uppercase text-[#737373] mb-2">Email Address</label>
              <input name="email" type="email" autoComplete="email" required className="w-full border border-[#EAE7E0] p-4 bg-transparent focus:outline-none focus:border-[#2D2D2D]" />
            </div>
            <div>
              <label className="block text-xs font-medium tracking-wide uppercase text-[#737373] mb-2">Password</label>
              <input name="password" type="password" autoComplete="current-password" required className="w-full border border-[#EAE7E0] p-4 bg-transparent focus:outline-none focus:border-[#2D2D2D]" />
            </div>
            <div className="flex justify-between items-center gap-4 text-sm text-[#737373]">
              <span>Sign-in stays active on this device.</span>
              <Link to="/service/faq" className="shrink-0 underline">Password help</Link>
            </div>
            <button disabled={isSubmitting} className="w-full bg-[#2D2D2D] text-white py-4 text-sm font-medium tracking-widest uppercase hover:bg-black transition-colors mt-8 disabled:opacity-60">
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium tracking-wide uppercase text-[#737373] mb-2">First Name</label>
                <input name="firstName" type="text" className="w-full border border-[#EAE7E0] p-4 bg-transparent focus:outline-none focus:border-[#2D2D2D]" />
              </div>
              <div>
                <label className="block text-xs font-medium tracking-wide uppercase text-[#737373] mb-2">Last Name</label>
                <input name="lastName" type="text" className="w-full border border-[#EAE7E0] p-4 bg-transparent focus:outline-none focus:border-[#2D2D2D]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium tracking-wide uppercase text-[#737373] mb-2">Email Address</label>
              <input name="email" type="email" autoComplete="email" required className="w-full border border-[#EAE7E0] p-4 bg-transparent focus:outline-none focus:border-[#2D2D2D]" />
            </div>
            <div>
              <label className="block text-xs font-medium tracking-wide uppercase text-[#737373] mb-2">Password</label>
              <input name="password" type="password" autoComplete="new-password" minLength={8} required className="w-full border border-[#EAE7E0] p-4 bg-transparent focus:outline-none focus:border-[#2D2D2D]" />
            </div>
            <div className="pt-4">
              <label className="flex items-start gap-3 cursor-pointer text-sm text-[#737373]">
                <input name="newsletter" type="checkbox" className="mt-1" />
                <span>Sign up for our newsletter to receive inspiration, news, and a 10% discount on your first order.</span>
              </label>
            </div>
            <button disabled={isSubmitting} className="w-full bg-[#2D2D2D] text-white py-4 text-sm font-medium tracking-widest uppercase hover:bg-black transition-colors mt-8 disabled:opacity-60">
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
