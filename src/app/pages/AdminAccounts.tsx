import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { KeyRound, LockKeyhole, Search, ShieldCheck, Trash2, UserCog, UserPlus, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminUser,
  createStaffUser,
  getAdminUsers,
  resetAdminUserPassword,
  softDeleteAdminUser,
  StaffRole,
  updateAdminUser,
  updateAdminUserStatus,
  UserRole,
  UserStatus,
} from '../api/adminUsers';
import { useAuth } from '../context/AuthContext';
import { formatDate as formatSafeDate } from '../lib/dates';

const roleOptions: Array<UserRole | 'all'> = ['all', 'user', 'admin', 'warehouse', 'accountant'];
const statusOptions: Array<UserStatus | 'all'> = ['all', 'active', 'locked', 'inactive'];
const staffRoleOptions: StaffRole[] = ['warehouse', 'accountant'];

const emptyForm = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  role: 'warehouse' as StaffRole,
  status: 'active' as UserStatus,
  password: '',
};

function displayName(account: Pick<AdminUser, 'firstName' | 'lastName' | 'email'>) {
  return `${account.firstName || ''} ${account.lastName || ''}`.trim() || account.email;
}

function roleLabel(role: UserRole | StaffRole) {
  if (role === 'warehouse') return 'Warehouse';
  if (role === 'accountant') return 'Accountant';
  if (role === 'admin') return 'Admin';
  return 'Customer';
}

export function AdminAccounts() {
  const [accounts, setAccounts] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function loadAccounts(page = pagination.page) {
    setIsLoading(true);
    try {
      const data = await getAdminUsers({
        page,
        limit: pagination.limit,
        search,
        role: roleFilter,
        status: statusFilter,
        includeDeleted,
      });
      setAccounts(data.users);
      setPagination(data.pagination);
      if (selectedId && !data.users.some((account) => account.id === selectedId)) {
        newAccount();
      }
    } catch {
      toast.error('Unable to load accounts');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    loadAccounts(1);
  }, [includeDeleted, isAuthLoading, location.pathname, roleFilter, search, statusFilter, user]);

  const metrics = useMemo(() => {
    return {
      total: pagination.total,
      active: accounts.filter((account) => account.status === 'active').length,
      locked: accounts.filter((account) => account.status === 'locked').length,
      staff: accounts.filter((account) => staffRoleOptions.includes(account.role as StaffRole)).length,
    };
  }, [accounts, pagination.total]);

  function selectAccount(account: AdminUser) {
    setMode('edit');
    setSelectedId(account.id);
    setForm({
      id: account.id,
      firstName: account.firstName || '',
      lastName: account.lastName || '',
      email: account.email || '',
      role: staffRoleOptions.includes(account.role as StaffRole) ? (account.role as StaffRole) : 'warehouse',
      status: account.status || 'active',
      password: '',
    });
  }

  function newAccount() {
    setMode('create');
    setSelectedId('');
    setForm(emptyForm);
  }

  function updateForm<K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (mode === 'create') {
        const created = await createStaffUser({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        toast.success('Staff account created');
        await loadAccounts(1);
        selectAccount(created);
      } else {
        const current = accounts.find((account) => account.id === selectedId);
        const payload = {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          status: form.status,
          ...(current && staffRoleOptions.includes(current.role as StaffRole) ? { role: form.role } : {}),
        };
        const updated = await updateAdminUser(selectedId, payload);
        toast.success('Account updated');
        setAccounts((items) => items.map((item) => (item.id === updated.id ? updated : item)));
        selectAccount(updated);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save account');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatus(account: AdminUser, status: UserStatus) {
    try {
      const updated = await updateAdminUserStatus(account.id, status);
      setAccounts((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      if (selectedId === updated.id) selectAccount(updated);
      toast.success('Account status updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update status');
    }
  }

  async function handleResetPassword() {
    if (!selectedId) return;
    const newPassword = window.prompt('Enter a new password with at least 8 characters');
    if (!newPassword) return;

    try {
      const updated = await resetAdminUserPassword(selectedId, newPassword);
      setAccounts((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      toast.success('Password reset');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to reset password');
    }
  }

  async function handleSoftDelete(account: AdminUser) {
    const confirmed = window.confirm(`Soft delete ${displayName(account)}?`);
    if (!confirmed) return;

    try {
      await softDeleteAdminUser(account.id);
      toast.success('Account soft deleted');
      await loadAccounts(pagination.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete account');
    }
  }

  if (isAuthLoading || !user || user.role !== 'admin') {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking admin access...</div>;
  }

  const selectedAccount = accounts.find((account) => account.id === selectedId);
  const canEditRole = selectedAccount ? staffRoleOptions.includes(selectedAccount.role as StaffRole) : true;
  const isSelfSelected = selectedId === user.id;

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Admin</p>
            <h1 className="font-serif text-4xl">Account Management</h1>
          </div>
          <button onClick={newAccount} className="flex w-fit items-center gap-2 bg-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-black">
            <UserPlus className="h-4 w-4" />
            New Staff
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Accounts', value: String(metrics.total), icon: UsersRound },
            { label: 'Active Shown', value: String(metrics.active), icon: ShieldCheck },
            { label: 'Locked Shown', value: String(metrics.locked), icon: LockKeyhole },
            { label: 'Staff Shown', value: String(metrics.staff), icon: UserCog },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="border border-[#EAE7E0] bg-white p-6">
                <div className="mb-5 flex items-center justify-between text-[#9E9B94]">
                  <span className="text-xs uppercase tracking-widest">{item.label}</span>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-serif text-3xl">{item.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_420px]">
          <section className="border border-[#EAE7E0] bg-white">
            <div className="flex flex-col gap-4 border-b border-[#EAE7E0] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="font-serif text-2xl">Accounts</h2>
                  <p className="mt-1 text-sm text-[#737373]">{pagination.total} accounts found</p>
                </div>
                <label className="relative block w-full lg:max-w-sm">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9B94]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name or email"
                    className="w-full border border-[#EAE7E0] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#2D2D2D]"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | 'all')} className="border border-[#EAE7E0] bg-white px-3 py-2 text-sm capitalize">
                  {roleOptions.map((role) => <option key={role} value={role}>{role === 'all' ? 'All roles' : roleLabel(role)}</option>)}
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as UserStatus | 'all')} className="border border-[#EAE7E0] bg-white px-3 py-2 text-sm capitalize">
                  {statusOptions.map((status) => <option key={status} value={status}>{status === 'all' ? 'All statuses' : status}</option>)}
                </select>
                <label className="flex items-center gap-2 border border-[#EAE7E0] px-3 py-2 text-sm">
                  <input type="checkbox" checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} />
                  Show deleted
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="border-b border-[#EAE7E0] text-xs uppercase tracking-widest text-[#9E9B94]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Account</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Deleted</th>
                    <th className="px-6 py-4 font-medium">Last Login</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-[#737373]">Loading accounts...</td>
                    </tr>
                  ) : accounts.map((account) => (
                    <tr key={account.id} className="border-b border-[#EAE7E0] last:border-b-0">
                      <td className="px-6 py-4">
                        <button type="button" onClick={() => selectAccount(account)} className="text-left">
                          <p className="font-medium">{displayName(account)}</p>
                          <p className="mt-1 text-[#737373]">{account.email}</p>
                          <p className="mt-1 font-mono text-xs text-[#9E9B94]">{account.id}</p>
                        </button>
                      </td>
                      <td className="px-6 py-4">{roleLabel(account.role)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex border border-[#EAE7E0] px-2 py-1 text-xs uppercase tracking-wide">{account.status}</span>
                      </td>
                      <td className="px-6 py-4 text-[#737373]">{account.isDeleted ? 'Yes' : 'No'}</td>
                      <td className="px-6 py-4 text-[#737373]">{formatSafeDate(account.lastLoginAt, 'Never')}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => selectAccount(account)} className="border border-[#EAE7E0] px-3 py-2 hover:border-[#2D2D2D]">Edit</button>
                          <button type="button" disabled={account.status === 'locked' || account.id === user.id} onClick={() => handleStatus(account, 'locked')} className="border border-[#EAE7E0] px-3 py-2 hover:border-[#2D2D2D] disabled:opacity-40">Lock</button>
                          <button type="button" disabled={account.status === 'active'} onClick={() => handleStatus(account, 'active')} className="border border-[#EAE7E0] px-3 py-2 hover:border-[#2D2D2D] disabled:opacity-40">Unlock</button>
                          <button type="button" disabled={account.isDeleted || account.id === user.id} onClick={() => handleSoftDelete(account)} className="border border-[#EAE7E0] px-3 py-2 text-[#9F2A2A] hover:border-[#9F2A2A] disabled:opacity-40">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && !accounts.length && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-[#737373]">No accounts match this filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[#EAE7E0] p-4 text-sm text-[#737373]">
              <button disabled={pagination.page <= 1} onClick={() => loadAccounts(pagination.page - 1)} className="border border-[#EAE7E0] px-4 py-2 disabled:opacity-40">Previous</button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadAccounts(pagination.page + 1)} className="border border-[#EAE7E0] px-4 py-2 disabled:opacity-40">Next</button>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="h-fit border border-[#EAE7E0] bg-white p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#9E9B94]">{mode === 'create' ? 'Create' : 'Edit'}</p>
                <h2 className="mt-1 font-serif text-2xl">{mode === 'create' ? 'Staff Account' : 'Account Details'}</h2>
              </div>
              {mode === 'edit' && (
                <button type="button" onClick={handleResetPassword} className="flex items-center gap-2 border border-[#EAE7E0] px-3 py-2 text-sm hover:border-[#2D2D2D]">
                  <KeyRound className="h-4 w-4" />
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">First Name</span>
                <input value={form.firstName} onChange={(event) => updateForm('firstName', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Last Name</span>
                <input value={form.lastName} onChange={(event) => updateForm('lastName', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Email</span>
                <input type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" required />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Role</span>
                <select value={form.role} disabled={!canEditRole} onChange={(event) => updateForm('role', event.target.value as StaffRole)} className="w-full border border-[#EAE7E0] bg-white px-3 py-2 disabled:bg-[#F9F8F6] disabled:text-[#737373]">
                  {staffRoleOptions.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
                </select>
              </label>
              {mode === 'edit' && (
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Status</span>
                  <select value={form.status} disabled={isSelfSelected} onChange={(event) => updateForm('status', event.target.value as UserStatus)} className="w-full border border-[#EAE7E0] bg-white px-3 py-2 disabled:bg-[#F9F8F6] disabled:text-[#737373]">
                    {statusOptions.filter((status) => status !== 'all').map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
              )}
              {mode === 'create' && (
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-widest text-[#737373]">Password</span>
                  <input type="password" minLength={8} value={form.password} onChange={(event) => updateForm('password', event.target.value)} className="w-full border border-[#EAE7E0] px-3 py-2" required />
                </label>
              )}
            </div>

            <button disabled={isSaving} type="submit" className="mt-6 w-full bg-[#2D2D2D] px-6 py-3 text-sm uppercase tracking-widest text-white hover:bg-black disabled:opacity-50">
              {isSaving ? 'Saving...' : mode === 'create' ? 'Create Staff' : 'Save Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
