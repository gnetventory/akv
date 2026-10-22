import React, { useState } from 'react';
import { Save, X, Plus, ExternalLink, Globe } from 'lucide-react';
import { STAGE_OPTIONS, STAGES, INDUSTRY_TAGS } from '../../utils/constants';
import { addMember } from '../../utils/storage';
import { useApp } from '../../contexts/AppContext';
import { formatWebsiteUrl, getPlatformLabel, getPlatformBadgeStyle } from '../../utils/helpers';

const EMPTY_FORM = {
  name: '',
  role: '',
  business: '',
  stage: 'idea',
  lookingFor: '',
  canHelp: '',
  location: { country: '', city: '' },
  phone: '',
  linkedin: '',
  website: '',
  secondaryWebsite: '',
  websites: [],
  tags: [],
  originalLanguage: 'en',
  originalText: '',
};

export default function ManualForm({ initialData = {}, onSaved, onCancel, isEdit = false }) {
  const { notify, refreshMembers } = useApp();
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initialData });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));
  const setLocation = (field, val) =>
    setForm((f) => ({ ...f, location: { ...f.location, [field]: val } }));

  // ── Dynamic Website & Social Link Handlers ──────────────────────────────────
  const currentWebsites =
    Array.isArray(form.websites) && form.websites.length > 0
      ? form.websites
      : [form.website, form.secondaryWebsite].filter(Boolean);

  const handleUpdateWebsite = (index, val) => {
    const updated = [...(currentWebsites.length > 0 ? currentWebsites : [''])];
    updated[index] = val;
    setForm((prev) => ({
      ...prev,
      websites: updated,
      website: updated[0] || '',
      secondaryWebsite: updated[1] || '',
    }));
  };

  const handleAddWebsiteLink = () => {
    const updated = [...currentWebsites, ''];
    setForm((prev) => ({
      ...prev,
      websites: updated,
      website: updated[0] || '',
      secondaryWebsite: updated[1] || '',
    }));
  };

  const handleRemoveWebsiteLink = (index) => {
    const updated = currentWebsites.filter((_, i) => i !== index);
    setForm((prev) => ({
      ...prev,
      websites: updated,
      website: updated[0] || '',
      secondaryWebsite: updated[1] || '',
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.role.trim()) e.role = 'Role is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addTag = (tag) => {
    const t = tag.trim();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput('');
  };

  const removeTag = (tag) => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const saved = addMember(form);
    refreshMembers();
    notify(`${form.name} added to directory! 🎉`);
    onSaved?.(saved);
    if (!isEdit) setForm(EMPTY_FORM);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Row 1: Name + Role */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input
            className={`input ${errors.name ? 'ring-2 ring-red-500' : ''}`}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Maria Silva"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="label">What do you do? *</label>
          <input
            className={`input ${errors.role ? 'ring-2 ring-red-500' : ''}`}
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
            placeholder="e.g. Digital marketer & startup advisor"
          />
          {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
        </div>
      </div>

      {/* Business */}
      <div>
        <label className="label">Business / Project</label>
        <textarea
          className="input resize-none"
          rows={2}
          value={form.business}
          onChange={(e) => set('business', e.target.value)}
          placeholder="e.g. EcoDeliver – Sustainable packaging delivery startup"
        />
      </div>

      {/* Stage */}
      <div>
        <label className="label">Where are you currently?</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STAGE_OPTIONS.map((s) => {
            const stage = STAGES[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => set('stage', s)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  form.stage === s
                    ? `${stage.bg} ${stage.text} ${stage.border}`
                    : 'border-gray-200 dark:border-gray-700 text-muted hover:border-gray-400'
                }`}
              >
                {stage.icon} {stage.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Country</label>
          <input
            className="input"
            value={form.location.country}
            onChange={(e) => setLocation('country', e.target.value)}
            placeholder="e.g. Brazil"
          />
        </div>
        <div>
          <label className="label">City</label>
          <input
            className="input"
            value={form.location.city}
            onChange={(e) => setLocation('city', e.target.value)}
            placeholder="e.g. São Paulo"
          />
        </div>
      </div>

      {/* Looking For + Can Help */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">🔍 Looking for right now</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={form.lookingFor}
            onChange={(e) => set('lookingFor', e.target.value)}
            placeholder="e.g. Co-founder with technical skills, beta testers, investors..."
          />
        </div>
        <div>
          <label className="label">🤝 Can help others with</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={form.canHelp}
            onChange={(e) => set('canHelp', e.target.value)}
            placeholder="e.g. Social media ads, brand strategy, connecting with local suppliers..."
          />
        </div>
      </div>

      {/* Contact & Links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">WhatsApp Number (optional)</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="e.g. +201012345678"
            type="tel"
          />
          <p className="text-xs text-stone-500 mt-1">
            Include country code. Restricted to NIA portal view.
          </p>
        </div>
        <div>
          <label className="label">LinkedIn Profile URL</label>
          <input
            className="input"
            value={form.linkedin || ''}
            onChange={(e) => set('linkedin', e.target.value)}
            placeholder="e.g. https://linkedin.com/in/username"
          />
        </div>
      </div>

      {/* Websites & Social Links (Labeled Platforms & Multi-Links Support) */}
      <div className="space-y-2.5 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750">
        <div className="flex items-center justify-between">
          <label className="label text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 mb-0">
            <Globe size={13} className="text-orange-500" />
            <span>Websites & Social Media Links ({currentWebsites.length})</span>
          </label>
          <button
            type="button"
            onClick={handleAddWebsiteLink}
            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus size={12} /> Add Another Link
          </button>
        </div>

        <div className="space-y-2">
          {currentWebsites.map((url, idx) => {
            const badgeStyle = getPlatformBadgeStyle(url);
            const platform = getPlatformLabel(url);
            return (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 shrink-0 min-w-[105px] justify-center shadow-xs ${badgeStyle.bg} ${badgeStyle.border}`}
                >
                  <span>{badgeStyle.label}</span>
                </div>

                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleUpdateWebsite(idx, e.target.value)}
                  placeholder={`e.g. https://${platform.toLowerCase().replace(/[^a-z0-9]/g, '') || 'website'}.com/...`}
                  className="input text-xs py-1.5 font-mono flex-1"
                />

                {url && (
                  <a
                    href={formatWebsiteUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                    title={`Test open ${platform}`}
                  >
                    <ExternalLink size={13} />
                  </a>
                )}

                {currentWebsites.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveWebsiteLink(idx)}
                    className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove link"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            );
          })}

          {currentWebsites.length === 0 && (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-700 text-xs text-stone-500">
              <span>No website or social links added yet.</span>
              <button
                type="button"
                onClick={handleAddWebsiteLink}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
              >
                + Add Link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="label">Industry Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {form.tags.map((t) => (
            <span
              key={t}
              className="badge bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 cursor-pointer hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 group"
              onClick={() => removeTag(t)}
            >
              {t} <X size={10} className="opacity-50 group-hover:opacity-100" />
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {INDUSTRY_TAGS.filter((t) => !form.tags.includes(t))
            .slice(0, 18)
            .map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addTag(t)}
                className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                + {t}
              </button>
            ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary">
          <Save size={15} />
          {isEdit ? 'Save Changes' : 'Add to Directory'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
