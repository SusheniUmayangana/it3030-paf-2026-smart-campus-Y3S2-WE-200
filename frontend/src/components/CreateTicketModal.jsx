import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { X, Upload, AlertCircle } from 'lucide-react';
import { createTicket } from '../services/ticketsService';
import { getResources } from '../services/facilitiesService';

const CATEGORIES = ['ELECTRICAL', 'PLUMBING', 'HVAC', 'IT_EQUIPMENT', 'FURNITURE', 'SAFETY', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const EMPTY_FORM = {
  title: '',
  category: 'ELECTRICAL',
  description: '',
  priority: 'MEDIUM',
  contactDetails: '',
  resourceId: '',
};

export default function CreateTicketModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [resources, setResources] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getResources()
      .then(res => setResources(res.data))
      .catch(err => console.error('Failed to load resources', err));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (files.length > 3) e.files = 'Maximum 3 image attachments allowed';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    // Validate each file
    const validFiles = selected.filter(f => {
      const okType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(f.type);
      const okSize = f.size <= 5 * 1024 * 1024;
      if (!okType) toast.error(`${f.name}: Invalid file type. Only images allowed.`);
      if (!okSize) toast.error(`${f.name}: File exceeds 5MB limit.`);
      return okType && okSize;
    });
    
    const combined = [...files, ...validFiles].slice(0, 3);
    setFiles(combined);
    if (files.length + validFiles.length > 3) {
      toast.error('Only 3 attachments allowed. Extra files were ignored.');
    }
  };

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await createTicket(
        {
          ...form,
          resourceId: form.resourceId ? Number(form.resourceId) : undefined,
        },
        files,
      );
      toast.success('Ticket created successfully!');
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg glass rounded-2xl p-6 shadow-2xl animate-fade-in overflow-y-auto max-h-[90vh]">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-surface-100">New Incident Ticket</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-800/50 text-surface-400 hover:text-surface-200 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Brief title of the issue"
              className={`w-full bg-surface-800/50 border rounded-xl px-4 py-2.5 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all ${
                errors.title ? 'border-red-500/60' : 'border-surface-700/50'
              }`}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2.5 text-surface-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">Priority *</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2.5 text-surface-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Description *</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the incident in detail..."
              className={`w-full bg-surface-800/50 border rounded-xl px-4 py-2.5 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all resize-none ${
                errors.description ? 'border-red-500/60' : 'border-surface-700/50'
              }`}
            />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Resource Selection */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Resource / Location <span className="text-surface-500">(optional)</span>
            </label>
            <select
              value={form.resourceId}
              onChange={(e) => setForm({ ...form, resourceId: e.target.value })}
              className="w-full bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2.5 text-surface-100 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
            >
              <option value="">Select a resource...</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>{r.name} - {r.location}</option>
              ))}
            </select>
          </div>

          {/* Contact Details */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Contact Details <span className="text-surface-500">(optional)</span>
            </label>
            <input
              type="text"
              value={form.contactDetails}
              onChange={(e) => setForm({ ...form, contactDetails: e.target.value })}
              placeholder="Phone or email for follow-up"
              className="w-full bg-surface-800/50 border border-surface-700/50 rounded-xl px-4 py-2.5 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/25 transition-all"
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Attachments <span className="text-surface-500">(max 3 images, 5 MB each)</span>
            </label>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= 3}
              className="w-full border-2 border-dashed border-surface-600 rounded-xl py-4 flex flex-col items-center gap-2 text-surface-400 hover:border-primary-500/50 hover:text-surface-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Upload className="w-6 h-6" />
              <span className="text-sm">{files.length >= 3 ? 'Attachment limit reached' : 'Click to upload images'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {files.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1.5">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between bg-surface-800/40 rounded-lg px-3 py-1.5 text-sm text-surface-300">
                    <span className="truncate max-w-[85%]">{f.name}</span>
                    <button onClick={() => removeFile(i)} className="text-surface-500 hover:text-red-400 transition-colors ml-2">
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {errors.files && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.files}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 border border-surface-700/50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {saving ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}