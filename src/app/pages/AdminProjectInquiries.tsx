import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Archive, ClipboardList, Clock3, Mail, Phone, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteProfessionalInquiry,
  getProfessionalInquiries,
  ProfessionalInquiry,
  updateProfessionalInquiry,
} from '../api/professionals';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/dates';

type InquiryStatusFilter = 'all' | NonNullable<ProfessionalInquiry['status']>;

const statuses: InquiryStatusFilter[] = ['all', 'new', 'reviewed', 'archived'];

function statusLabel(status?: ProfessionalInquiry['status']) {
  return status || 'new';
}

export function AdminProjectInquiries() {
  const [inquiries, setInquiries] = useState<ProfessionalInquiry[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InquiryStatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function loadInquiries() {
    setIsLoading(true);
    try {
      setInquiries(await getProfessionalInquiries());
    } catch {
      toast.error('Unable to load project inquiries');
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

    loadInquiries();
  }, [isAuthLoading, location.pathname, navigate, user]);

  const metrics = useMemo(
    () => ({
      total: inquiries.length,
      new: inquiries.filter((inquiry) => statusLabel(inquiry.status) === 'new').length,
      reviewed: inquiries.filter((inquiry) => inquiry.status === 'reviewed').length,
      archived: inquiries.filter((inquiry) => inquiry.status === 'archived').length,
    }),
    [inquiries],
  );

  const filteredInquiries = useMemo(() => {
    const query = search.toLowerCase().trim();
    return inquiries.filter((inquiry) => {
      const matchesStatus = statusFilter === 'all' || statusLabel(inquiry.status) === statusFilter;
      const matchesSearch =
        !query ||
        [
          inquiry.name,
          inquiry.company,
          inquiry.email,
          inquiry.phone,
          inquiry.projectType,
          inquiry.budget,
          inquiry.projectDetails,
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [inquiries, search, statusFilter]);

  async function handleStatusChange(inquiry: ProfessionalInquiry, status: NonNullable<ProfessionalInquiry['status']>) {
    if (!inquiry.id) return;
    setUpdatingId(inquiry.id);
    try {
      const updatedInquiry = await updateProfessionalInquiry(inquiry.id, { status });
      setInquiries((current) => current.map((item) => (item.id === updatedInquiry.id ? updatedInquiry : item)));
      toast.success('Project inquiry updated');
    } catch {
      toast.error('Unable to update project inquiry');
    } finally {
      setUpdatingId('');
    }
  }

  async function handleDelete(inquiry: ProfessionalInquiry) {
    if (!inquiry.id || !window.confirm('Delete this project inquiry?')) return;
    setUpdatingId(inquiry.id);
    try {
      await deleteProfessionalInquiry(inquiry.id);
      setInquiries((current) => current.filter((item) => item.id !== inquiry.id));
      toast.success('Project inquiry deleted');
    } catch {
      toast.error('Unable to delete project inquiry');
    } finally {
      setUpdatingId('');
    }
  }

  if (isAuthLoading || !user || user.role !== 'admin') {
    return <div className="container mx-auto px-6 py-20 text-sm text-[#737373]">Checking admin access...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Admin</p>
            <h1 className="font-serif text-4xl">Project Inquiries</h1>
          </div>
          <label className="relative block w-full md:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9B94]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search inquiries"
              className="w-full border border-[#EAE7E0] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#2D2D2D]"
            />
          </label>
        </div>

        {isLoading ? (
          <div className="border border-[#EAE7E0] bg-white p-8 text-sm text-[#737373]">Loading project inquiries...</div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Total', value: String(metrics.total), icon: ClipboardList },
                { label: 'New', value: String(metrics.new), icon: Clock3 },
                { label: 'Reviewed', value: String(metrics.reviewed), icon: Mail },
                { label: 'Archived', value: String(metrics.archived), icon: Archive },
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

            <section className="border border-[#EAE7E0] bg-white">
              <div className="flex flex-col gap-4 border-b border-[#EAE7E0] p-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h2 className="font-serif text-2xl">Inquiry Management</h2>
                  <p className="mt-1 text-sm text-[#737373]">{filteredInquiries.length} inquiries shown</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                        statusFilter === status
                          ? 'border-[#2D2D2D] bg-[#2D2D2D] text-white'
                          : 'border-[#EAE7E0] bg-white text-[#2D2D2D] hover:border-[#2D2D2D]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-[#EAE7E0]">
                {filteredInquiries.map((inquiry) => (
                  <article key={inquiry.id} className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-[280px_1fr_180px]">
                    <div>
                      <p className="font-medium">{inquiry.name}</p>
                      <p className="mt-1 text-sm text-[#737373]">{inquiry.company || 'No company provided'}</p>
                      <p className="mt-4 text-xs uppercase tracking-widest text-[#9E9B94]">{formatDate(inquiry.createdAt)}</p>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[#737373]">
                        <a href={`mailto:${inquiry.email}`} className="inline-flex items-center gap-2 hover:text-[#2D2D2D]">
                          <Mail className="h-4 w-4" />
                          {inquiry.email}
                        </a>
                        {inquiry.phone && (
                          <a href={`tel:${inquiry.phone}`} className="inline-flex items-center gap-2 hover:text-[#2D2D2D]">
                            <Phone className="h-4 w-4" />
                            {inquiry.phone}
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="border border-[#EAE7E0] p-3">
                          <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Project Type</p>
                          <p className="mt-1 text-[#2D2D2D]">{inquiry.projectType || 'Not provided'}</p>
                        </div>
                        <div className="border border-[#EAE7E0] p-3">
                          <p className="text-xs uppercase tracking-widest text-[#9E9B94]">Budget</p>
                          <p className="mt-1 text-[#2D2D2D]">{inquiry.budget || 'Not provided'}</p>
                        </div>
                      </div>

                      <p className="whitespace-pre-line leading-6 text-[#737373]">{inquiry.projectDetails}</p>
                    </div>

                    <div className="flex items-start gap-3 xl:flex-col xl:items-stretch">
                      <select
                        value={statusLabel(inquiry.status)}
                        disabled={updatingId === inquiry.id}
                        onChange={(event) => handleStatusChange(inquiry, event.target.value as NonNullable<ProfessionalInquiry['status']>)}
                        className="min-w-36 border border-[#EAE7E0] bg-white px-3 py-2 text-sm capitalize outline-none focus:border-[#2D2D2D] disabled:opacity-60"
                      >
                        {statuses.filter((status) => status !== 'all').map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={updatingId === inquiry.id}
                        onClick={() => handleDelete(inquiry)}
                        className="inline-flex items-center justify-center gap-2 border border-[#EAE7E0] px-3 py-2 text-sm text-[#737373] hover:border-[#2D2D2D] hover:text-[#2D2D2D] disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}

                {!filteredInquiries.length && (
                  <div className="p-10 text-center text-sm text-[#737373]">No project inquiries match this filter.</div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
