import { useEffect, useState, type FormEvent } from 'react';
import { apiFetch } from '../api/client';

interface LocationOption { code: string; name: string }
interface Address {
  id: number;
  label: string;
  name: string;
  phone: string;
  province: string;
  province_code: string | null;
  city: string;
  regency_code: string | null;
  district: string | null;
  district_code: string | null;
  village: string | null;
  village_code: string | null;
  postal_code: string;
  rt: string | null;
  rw: string | null;
  neighborhood: string | null;
  landmark: string | null;
  address: string;
  is_default: boolean;
}

type AddressForm = Omit<Address, 'id' | 'province' | 'city' | 'district' | 'village' | 'is_default'> & { is_default: boolean };
const emptyForm = (): AddressForm => ({
  label: 'Rumah', name: '', phone: '', province_code: '', regency_code: '', district_code: '', village_code: '',
  postal_code: '', rt: '', rw: '', neighborhood: '', landmark: '', address: '', is_default: false,
});
const inputClass = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#DF3E1D] focus:ring-2 focus:ring-[#DF3E1D]/15 disabled:bg-gray-100';
const buttonClass = 'rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-[#DF3E1D] hover:text-[#DF3E1D] disabled:opacity-50';

export default function AddressBookSection() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [regencies, setRegencies] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadAddresses = async () => {
    const response = await apiFetch<{ data: Address[] }>('/addresses');
    setAddresses(response.data);
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<{ data: Address[] }>('/addresses'),
      apiFetch<{ data: LocationOption[] }>('/locations/provinces'),
    ]).then(([addressResponse, provinceResponse]) => {
      if (!active) return;
      setAddresses(addressResponse.data);
      setProvinces(provinceResponse.data);
    }).catch((loadError) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat alamat.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setRegencies([]); setDistricts([]); setVillages([]);
    if (!form.province_code) return;
    let active = true;
    apiFetch<{ data: LocationOption[] }>(`/locations/provinces/${encodeURIComponent(form.province_code)}/regencies`)
      .then(({ data }) => { if (active) setRegencies(data); })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat kota/kabupaten.'); });
    return () => { active = false; };
  }, [form.province_code]);

  useEffect(() => {
    setDistricts([]); setVillages([]);
    if (!form.regency_code) return;
    let active = true;
    apiFetch<{ data: LocationOption[] }>(`/locations/regencies/${encodeURIComponent(form.regency_code)}/districts`)
      .then(({ data }) => { if (active) setDistricts(data); })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat kecamatan.'); });
    return () => { active = false; };
  }, [form.regency_code]);

  useEffect(() => {
    setVillages([]);
    if (!form.district_code) return;
    let active = true;
    apiFetch<{ data: LocationOption[] }>(`/locations/districts/${encodeURIComponent(form.district_code)}/villages`)
      .then(({ data }) => { if (active) setVillages(data); })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat kelurahan/desa.'); });
    return () => { active = false; };
  }, [form.district_code]);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), is_default: addresses.length === 0 });
    setFormOpen(true); setError(''); setSuccess('');
  };

  const openEdit = (address: Address) => {
    setEditingId(address.id);
    setForm({
      label: address.label, name: address.name, phone: address.phone,
      province_code: address.province_code ?? '', regency_code: address.regency_code ?? '',
      district_code: address.district_code ?? '', village_code: address.village_code ?? '',
      postal_code: address.postal_code ?? '', rt: address.rt ?? '', rw: address.rw ?? '',
      neighborhood: address.neighborhood ?? '', landmark: address.landmark ?? '', address: address.address,
      is_default: address.is_default,
    });
    setFormOpen(true); setError(''); setSuccess('');
  };

  const update = (field: keyof AddressForm, value: string | boolean) => {
    setForm((current) => {
      if (field === 'province_code') return { ...current, province_code: String(value), regency_code: '', district_code: '', village_code: '' };
      if (field === 'regency_code') return { ...current, regency_code: String(value), district_code: '', village_code: '' };
      if (field === 'district_code') return { ...current, district_code: String(value), village_code: '' };
      return { ...current, [field]: value };
    });
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        ...form,
        label: form.label.trim(), name: form.name.trim(), phone: form.phone.trim(),
        postal_code: form.postal_code.trim(), address: form.address.trim(),
        rt: form.rt.trim() || null, rw: form.rw.trim() || null,
        neighborhood: form.neighborhood.trim() || null, landmark: form.landmark.trim() || null,
      };
      await apiFetch(editingId ? `/addresses/${editingId}` : '/addresses', {
        method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload),
      });
      await loadAddresses();
      setFormOpen(false); setSuccess(editingId ? 'Alamat berhasil diperbarui.' : 'Alamat berhasil ditambahkan.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Alamat gagal disimpan.');
    } finally { setSaving(false); }
  };

  const makeDefault = async (address: Address) => {
    setError(''); setSuccess('');
    try {
      await apiFetch(`/addresses/${address.id}`, { method: 'PATCH', body: JSON.stringify({ is_default: true }) });
      await loadAddresses(); setSuccess('Alamat utama berhasil diubah.');
    } catch (updateError) { setError(updateError instanceof Error ? updateError.message : 'Alamat utama gagal diubah.'); }
  };

  const remove = async (address: Address) => {
    if (!window.confirm(`Hapus alamat “${address.label}”?`)) return;
    setError(''); setSuccess('');
    try {
      await apiFetch(`/addresses/${address.id}`, { method: 'DELETE' });
      await loadAddresses(); setSuccess('Alamat berhasil dihapus.');
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Alamat gagal dihapus.'); }
  };

  const locationSelects: { field: keyof AddressForm; label: string; options: LocationOption[]; disabled?: boolean }[] = [
    { field: 'province_code', label: 'Provinsi', options: provinces },
    { field: 'regency_code', label: 'Kota/Kabupaten', options: regencies, disabled: !form.province_code },
    { field: 'district_code', label: 'Kecamatan', options: districts, disabled: !form.regency_code },
    { field: 'village_code', label: 'Kelurahan/Desa', options: villages, disabled: !form.district_code },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-extrabold text-gray-900">Alamat Saya</h2><p className="mt-1 text-sm text-gray-500">Kelola alamat pengiriman akun Anda.</p></div>
        {!formOpen && <button type="button" className="rounded-lg bg-[#DF3E1D] px-4 py-2.5 text-sm font-semibold text-white" onClick={openNew}>+ Tambah alamat</button>}
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>}
      {loading ? <p className="py-8 text-sm text-gray-500">Memuat alamat...</p> : addresses.length === 0 && !formOpen ? <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">Belum ada alamat tersimpan. Tambahkan alamat untuk memudahkan checkout.</div> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <article key={address.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-2"><h3 className="font-bold text-gray-900">{address.label}</h3>{address.is_default && <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">UTAMA</span>}</div>
              <p className="mt-2 text-sm font-semibold text-gray-700">{address.name} · {address.phone}</p>
              <p className="mt-1 text-sm leading-6 text-gray-500">{address.address}{address.rt || address.rw ? `, RT ${address.rt || '-'} / RW ${address.rw || '-'}` : ''}{address.neighborhood ? `, ${address.neighborhood}` : ''}{address.landmark ? `, Patokan ${address.landmark}` : ''}<br />{[address.village, address.district, address.city, address.province, address.postal_code].filter(Boolean).join(', ')}</p>
              <div className="mt-4 flex flex-wrap gap-2">{!address.is_default && <button type="button" className={buttonClass} onClick={() => void makeDefault(address)}>Jadikan utama</button>}<button type="button" className={buttonClass} onClick={() => openEdit(address)}>Edit</button><button type="button" className="rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50" onClick={() => void remove(address)}>Hapus</button></div>
            </article>
          ))}
        </div>
      )}
      {formOpen && <form onSubmit={save} className="mt-5 border-t border-gray-100 pt-5">
        <h3 className="mb-4 font-bold text-gray-900">{editingId ? 'Edit alamat' : 'Tambah alamat baru'}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-gray-600">Label alamat<input className={inputClass} required maxLength={255} value={form.label} onChange={(e) => update('label', e.target.value)} placeholder="Rumah, Kantor" /></label>
          <label className="text-sm font-semibold text-gray-600">Nama penerima<input className={inputClass} required maxLength={255} value={form.name} onChange={(e) => update('name', e.target.value)} /></label>
          <label className="text-sm font-semibold text-gray-600">Nomor telepon<input className={inputClass} required maxLength={20} value={form.phone} onChange={(e) => update('phone', e.target.value)} /></label>
          <label className="text-sm font-semibold text-gray-600">Kode pos<input className={inputClass} required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={form.postal_code} onChange={(e) => update('postal_code', e.target.value.replace(/\D/g, '').slice(0, 5))} /></label>
          {locationSelects.map(({ field, label, options, disabled }) => <label key={field} className="text-sm font-semibold text-gray-600">{label}<select className={inputClass} required value={String(form[field])} disabled={disabled} onChange={(e) => update(field, e.target.value)}><option value="">Pilih {label.toLowerCase()}</option>{options.map((option) => <option key={option.code} value={option.code}>{option.name}</option>)}</select></label>)}
          <label className="text-sm font-semibold text-gray-600">RT (opsional)<input className={inputClass} maxLength={3} value={form.rt ?? ''} onChange={(e) => update('rt', e.target.value)} /></label>
          <label className="text-sm font-semibold text-gray-600">RW (opsional)<input className={inputClass} maxLength={3} value={form.rw ?? ''} onChange={(e) => update('rw', e.target.value)} /></label>
          <label className="text-sm font-semibold text-gray-600">Perumahan / lingkungan<input className={inputClass} value={form.neighborhood ?? ''} onChange={(e) => update('neighborhood', e.target.value)} /></label>
          <label className="text-sm font-semibold text-gray-600">Patokan<input className={inputClass} value={form.landmark ?? ''} onChange={(e) => update('landmark', e.target.value)} /></label>
          <label className="text-sm font-semibold text-gray-600 sm:col-span-2">Alamat jalan, nomor rumah, dan detail<textarea className={inputClass} required minLength={5} maxLength={2000} rows={3} value={form.address} onChange={(e) => update('address', e.target.value)} /></label>
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2"><input type="checkbox" checked={form.is_default} onChange={(e) => update('is_default', e.target.checked)} />Jadikan alamat utama</label>
        </div>
        <div className="mt-5 flex gap-2"><button className="rounded-lg bg-[#DF3E1D] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan alamat'}</button><button className={buttonClass} type="button" disabled={saving} onClick={() => setFormOpen(false)}>Batal</button></div>
      </form>}
    </div>
  );
}
