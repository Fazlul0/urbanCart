import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUploader from '../components/ImageUploader';
import {
  getMembershipFacilities,
  getMembershipFacilityShops,
  createMembershipFacility,
  updateMembershipFacility,
  deleteMembershipFacility,
  createMembershipShop,
  updateMembershipShop,
  deleteMembershipShop,
} from '../services/api';

const emptyShop = {
  name: '',
  image: '',
  ownerName: '',
  ownerMobile: '',
  secondaryMobile: '',
  location: '',
  locationLink: '',
  isActive: true,
};

const emptyFacility = {
  name: '',
  description: '',
  image: '',
  isActive: true,
};

/** Manage facility types and partner shops under each type */
const MembershipFacilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopModal, setShopModal] = useState(null);
  const [shopForm, setShopForm] = useState(emptyShop);
  const [facilityModal, setFacilityModal] = useState(null);
  const [facilityForm, setFacilityForm] = useState(emptyFacility);
  const [saving, setSaving] = useState(false);

  const loadFacilities = async () => {
    const res = await getMembershipFacilities();
    const list = res.data.facilities || [];
    setFacilities(list);
    setSelectedId((prev) => {
      if (prev && list.find((f) => f._id === prev)) return prev;
      return list[0]?._id || null;
    });
  };

  const loadShops = async (facilityId) => {
    if (!facilityId) {
      setShops([]);
      return;
    }
    const res = await getMembershipFacilityShops(facilityId);
    setShops(res.data.shops || []);
  };

  useEffect(() => {
    setLoading(true);
    loadFacilities()
      .catch(() => toast.error('Failed to load facilities'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadShops(selectedId).catch(() => setShops([]));
  }, [selectedId]);

  const openCreateFacility = () => {
    setFacilityForm(emptyFacility);
    setFacilityModal('create');
  };

  const openEditFacility = (f) => {
    setFacilityForm({
      name: f.name || '',
      description: f.description || '',
      image: f.image || '',
      isActive: f.isActive !== false,
    });
    setFacilityModal(f);
  };

  const saveFacility = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (facilityModal === 'create') {
        const res = await createMembershipFacility(facilityForm);
        toast.success('Facility type added');
        setFacilityModal(null);
        await loadFacilities();
        const created = res.data?.facility;
        if (created?._id) setSelectedId(created._id);
      } else {
        await updateMembershipFacility(facilityModal._id, facilityForm);
        toast.success('Facility type updated');
        setFacilityModal(null);
        await loadFacilities();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const removeFacility = async (f) => {
    if (
      !confirm(
        `Delete facility type “${f.name}” and all its shops? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await deleteMembershipFacility(f._id);
      toast.success('Facility type deleted');
      if (selectedId === f._id) setSelectedId(null);
      await loadFacilities();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const openCreateShop = () => {
    if (!selectedId) {
      toast.error('Select a facility type first');
      return;
    }
    setShopForm(emptyShop);
    setShopModal('create');
  };

  const openEditShop = (s) => {
    setShopForm({
      name: s.name,
      image: s.image || '',
      ownerName: s.ownerName || '',
      ownerMobile: s.ownerMobile || '',
      secondaryMobile: s.secondaryMobile || '',
      location: s.location || '',
      locationLink: s.locationLink || '',
      isActive: s.isActive !== false,
    });
    setShopModal(s);
  };

  const saveShop = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (shopModal === 'create') {
        await createMembershipShop({ ...shopForm, facilityId: selectedId });
        toast.success('Shop added');
      } else {
        await updateMembershipShop(shopModal._id, shopForm);
        toast.success('Shop updated');
      }
      setShopModal(null);
      await loadShops(selectedId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const removeShop = async (id) => {
    if (!confirm('Delete this shop?')) return;
    try {
      await deleteMembershipShop(id);
      toast.success('Deleted');
      await loadShops(selectedId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <p className="text-neutral-500">Loading...</p>;

  const selected = facilities.find((f) => f._id === selectedId);

  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-500">
        Add or edit <strong>facility types</strong> on the left, then manage partner{' '}
        <strong>shops</strong> (name, image, owner, mobile, location) for each type.
      </p>

      <div className="grid lg:grid-cols-[240px_1fr] gap-4">
        <div className="card p-2 space-y-1 h-fit">
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
              Facility type
            </p>
            <button
              type="button"
              onClick={openCreateFacility}
              className="text-xs text-brand-gold font-medium hover:underline inline-flex items-center gap-0.5"
            >
              <Plus size={12} /> Add
            </button>
          </div>
          {facilities.length === 0 ? (
            <p className="text-sm text-neutral-500 p-3">No facility types yet</p>
          ) : (
            facilities.map((f) => (
              <div
                key={f._id}
                className={`group flex items-center gap-1 rounded-lg ${
                  selectedId === f._id ? 'bg-brand-gold/20' : 'hover:bg-neutral-50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(f._id)}
                  className={`flex-1 text-left px-3 py-2.5 text-sm min-w-0 ${
                    selectedId === f._id ? 'font-medium' : 'text-neutral-700'
                  }`}
                >
                  <span className="truncate block">{f.name}</span>
                  {f.isActive === false ? (
                    <span className="text-[10px] text-neutral-400">Inactive</span>
                  ) : null}
                </button>
                <button
                  type="button"
                  title="Edit type"
                  className="p-1.5 opacity-60 hover:opacity-100 hover:bg-white/60 rounded shrink-0"
                  onClick={() => openEditFacility(f)}
                >
                  <Pencil size={12} />
                </button>
                <button
                  type="button"
                  title="Delete type"
                  className="p-1.5 text-red-600 opacity-60 hover:opacity-100 hover:bg-red-50 rounded shrink-0 mr-1"
                  onClick={() => removeFacility(f)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-lg">{selected.name} shops</h3>
                  <p className="text-sm text-neutral-500">
                    {shops.length} shop{shops.length !== 1 ? 's' : ''} listed
                  </p>
                </div>
                <button type="button" onClick={openCreateShop} className="btn-primary text-sm">
                  <Plus size={14} /> Add shop
                </button>
              </div>

              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b">
                    <tr className="text-left text-neutral-500">
                      <th className="px-4 py-3 font-medium">Shop</th>
                      <th className="px-4 py-3 font-medium">Owner name</th>
                      <th className="px-4 py-3 font-medium">Owner number</th>
                      <th className="px-4 py-3 font-medium">Secondary</th>
                      <th className="px-4 py-3 font-medium">Location</th>
                      <th className="px-4 py-3 font-medium">Map link</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                          No shops yet — click <strong>Add shop</strong> to add a partner under{' '}
                          {selected.name}.
                        </td>
                      </tr>
                    ) : (
                      shops.map((s) => (
                        <tr key={s._id} className="border-b border-neutral-100">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {s.image ? (
                                <img
                                  src={s.image}
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-neutral-100 shrink-0" />
                              )}
                              <span className="font-medium truncate">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{s.ownerName || '—'}</td>
                          <td className="px-4 py-3">{s.ownerMobile || '—'}</td>
                          <td className="px-4 py-3">{s.secondaryMobile || '—'}</td>
                          <td className="px-4 py-3 max-w-[160px] truncate" title={s.location || ''}>
                            {s.location || '—'}
                          </td>
                          <td className="px-4 py-3 max-w-[120px] truncate">
                            {s.locationLink ? (
                              <a
                                href={
                                  /^https?:\/\//i.test(s.locationLink)
                                    ? s.locationLink
                                    : `https://${s.locationLink}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-gold hover:underline text-xs"
                              >
                                Open
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                className="p-1.5 hover:bg-neutral-100 rounded"
                                onClick={() => openEditShop(s)}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                onClick={() => removeShop(s._id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-500 py-8 text-center">
              Select a facility type, or click <strong>Add</strong> to create one
            </p>
          )}
        </div>
      </div>

      {facilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <form
            onSubmit={saveFacility}
            className="bg-white rounded-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {facilityModal === 'create' ? 'Add facility type' : 'Edit facility type'}
              </h3>
              <button type="button" onClick={() => setFacilityModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Name *</label>
              <input
                required
                className="input-field"
                value={facilityForm.name}
                onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                placeholder="e.g. Maintenance, Washing, Equipment"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Description</label>
              <textarea
                rows={2}
                className="input-field resize-none"
                value={facilityForm.description}
                onChange={(e) =>
                  setFacilityForm({ ...facilityForm, description: e.target.value })
                }
              />
            </div>
            <ImageUploader
              fit="category"
              label={facilityForm.image ? 'Replace image' : 'Facility image'}
              value={facilityForm.image}
              onUploaded={(url) => setFacilityForm({ ...facilityForm, image: url })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={facilityForm.isActive}
                onChange={(e) =>
                  setFacilityForm({ ...facilityForm, isActive: e.target.checked })
                }
              />
              Active (visible to members)
            </label>
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving
                ? 'Saving...'
                : facilityModal === 'create'
                  ? 'Add facility type'
                  : 'Save facility type'}
            </button>
          </form>
        </div>
      )}

      {shopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <form
            onSubmit={saveShop}
            className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {shopModal === 'create'
                  ? `Add shop — ${selected?.name || ''}`
                  : 'Edit shop'}
              </h3>
              <button type="button" onClick={() => setShopModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Shop name *</label>
              <input
                required
                className="input-field"
                value={shopForm.name}
                onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                placeholder="Partner garage / wash center name"
              />
            </div>
            <ImageUploader
              fit="category"
              label={shopForm.image ? 'Replace shop image' : 'Shop image'}
              value={shopForm.image}
              onUploaded={(url) => setShopForm({ ...shopForm, image: url })}
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Owner name</label>
                <input
                  className="input-field"
                  value={shopForm.ownerName}
                  onChange={(e) => setShopForm({ ...shopForm, ownerName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Owner number</label>
                <input
                  className="input-field"
                  value={shopForm.ownerMobile}
                  onChange={(e) => setShopForm({ ...shopForm, ownerMobile: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  inputMode="tel"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium mb-1 block">Secondary number</label>
                <input
                  className="input-field"
                  value={shopForm.secondaryMobile}
                  onChange={(e) =>
                    setShopForm({ ...shopForm, secondaryMobile: e.target.value })
                  }
                  placeholder="Optional second mobile"
                  inputMode="tel"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Location details</label>
              <textarea
                rows={3}
                className="input-field resize-none"
                value={shopForm.location}
                onChange={(e) => setShopForm({ ...shopForm, location: e.target.value })}
                placeholder="Full address, area, landmark…"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Location link (Google Maps)</label>
              <input
                className="input-field"
                value={shopForm.locationLink}
                onChange={(e) => setShopForm({ ...shopForm, locationLink: e.target.value })}
                placeholder="https://maps.google.com/…"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={shopForm.isActive}
                onChange={(e) => setShopForm({ ...shopForm, isActive: e.target.checked })}
              />
              Active (visible to members)
            </label>
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving...' : shopModal === 'create' ? 'Add shop' : 'Save shop'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MembershipFacilities;
