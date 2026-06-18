import { useState } from "react";
import { get, post, put, uploadFile } from '@/api/api';
import { X, Upload, Plus, Trash2 } from "lucide-react";

const TYPES = ["movie", "tv_series", "commercial", "documentary", "music_video", "other"];
const STATUSES = ["draft", "open", "full", "closed", "archived"];
const GENDERS = ["any", "male", "female"];

const createEmptyPosition = () => ({
  title: "",
  description: "",
  location: "",
  shooting_date: "",
  compensation: "",
  spots_total: 1,
  age_min: "",
  age_max: "",
  gender: "any",
  required_skills: "",
  notes: "",
});

export default function ProjectFormModal({ project, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: project?.name || "",
    type: project?.type || "movie",
    status: project?.status || "draft",
    short_description: project?.short_description || "",
    full_description: project?.full_description || "",
    image_url: project?.image_url || "",
    production_company: project?.production_company || "",
    director: project?.director || "",
    location: project?.location || "",
    shooting_start_date: project?.shooting_start_date || "",
    shooting_end_date: project?.shooting_end_date || "",
  });
  const [positions, setPositions] = useState(project?.positions?.length ? project.positions : [createEmptyPosition()]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePositionChange = (index, key, value) => {
    setPositions((current) => current.map((pos, idx) => idx === index ? { ...pos, [key]: value } : pos));
  };

  const addPosition = () => {
    setPositions((current) => [...current, createEmptyPosition()]);
  };

  const removePosition = (index) => {
    setPositions((current) => current.filter((_, idx) => idx !== index));
  };

  const saveProjectPositions = async (projectId) => {
    const positionPayloads = positions
      .filter((pos) => pos.title.trim())
      .map((pos) => ({
        project_id: projectId,
        title: pos.title.trim(),
        description: pos.description.trim(),
        location: pos.location.trim(),
        shooting_date: pos.shooting_date,
        compensation: pos.compensation.trim(),
        spots_total: Number(pos.spots_total) || 1,
        age_min: pos.age_min ? Number(pos.age_min) : null,
        age_max: pos.age_max ? Number(pos.age_max) : null,
        gender: pos.gender,
        required_skills: pos.required_skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        notes: pos.notes.trim(),
      }));

    if (positionPayloads.length === 0) return;
    await Promise.all(positionPayloads.map((payload) => post('/api/positions', payload)));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (project?.id) {
      await put(`/api/projects/${project.id}`, form);
      await saveProjectPositions(project.id);
      await post('/api/audit-logs', { action: "update", entity_type: "Project", entity_id: project.id, details: `Updated: ${form.name}` }); // Using the 'post' function from api.js
    } else {
      const created = await post('/api/projects', form);
      await saveProjectPositions(created.id);
      await post('/api/audit-logs', { action: "create", entity_type: "Project", entity_id: created.id, details: `Created: ${form.name}` }); // Using the 'post' function from api.js
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert('File is too large. Maximum size is 3 MB.'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) { alert('Unsupported file type. Please use JPG, PNG, WebP, or GIF.'); return; }
    setUploading(true);
    try {
      const { file_url } = await uploadFile({ file });
      setForm({ ...form, image_url: file_url });
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const inp = "w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50";
  const lbl = "text-xs text-white/40 block mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-zinc-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{project?.id ? "Edit Project" : "New Project"}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className={lbl}>Project Name *</label><input required className={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <label className={lbl}>Type</label>
              <select className={inp} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Director</label><input className={inp} value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} /></div>
            <div><label className={lbl}>Production Company</label><input className={inp} value={form.production_company} onChange={(e) => setForm({ ...form, production_company: e.target.value })} /></div>
            <div><label className={lbl}>Location</label><input className={inp} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><label className={lbl}>Image URL</label>
              <div className="flex gap-2">
                <input className={inp + " flex-1"} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                <label className="bg-zinc-700 hover:bg-zinc-600 border border-white/10 rounded-lg px-3 py-2 cursor-pointer flex items-center">
                  {uploading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Upload className="w-4 h-4 text-white/60" />}
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" className="hidden" onChange={uploadImage} />
                </label>
              </div>
            </div>
            <div><label className={lbl}>Shooting Start</label><input type="date" className={inp} value={form.shooting_start_date} onChange={(e) => setForm({ ...form, shooting_start_date: e.target.value })} /></div>
            <div><label className={lbl}>Shooting End</label><input type="date" className={inp} value={form.shooting_end_date} onChange={(e) => setForm({ ...form, shooting_end_date: e.target.value })} /></div>
            <div className="md:col-span-2"><label className={lbl}>Short Description</label><textarea rows={2} className={inp + " resize-none"} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} /></div>
            <div className="md:col-span-2"><label className={lbl}>Full Description</label><textarea rows={4} className={inp + " resize-none"} value={form.full_description} onChange={(e) => setForm({ ...form, full_description: e.target.value })} /></div>
          </div>

          <div className="space-y-4 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold">Project Roles / Positions</h3>
              <button type="button" onClick={addPosition} className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded-lg transition-all">
                <Plus className="w-3.5 h-3.5" /> Add Role
              </button>
            </div>
            <div className="space-y-4">
              {positions.map((position, index) => (
                <div key={index} className="bg-zinc-900 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-sm font-semibold">Role {index + 1}</p>
                      <p className="text-xs text-white/40">Fill title and details for this role.</p>
                    </div>
                    <button type="button" onClick={() => removePosition(index)} className="text-white/40 hover:text-white">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><label className={lbl}>Role Title</label><input className={inp} value={position.title} onChange={(e) => handlePositionChange(index, "title", e.target.value)} /></div>
                    <div><label className={lbl}>Total Spots</label><input type="number" min="1" className={inp} value={position.spots_total} onChange={(e) => handlePositionChange(index, "spots_total", e.target.value)} /></div>
                    <div><label className={lbl}>Shooting Date</label><input type="date" className={inp} value={position.shooting_date} onChange={(e) => handlePositionChange(index, "shooting_date", e.target.value)} /></div>
                    <div><label className={lbl}>Gender</label><select className={inp} value={position.gender} onChange={(e) => handlePositionChange(index, "gender", e.target.value)}>{GENDERS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}</select></div>
                    <div><label className={lbl}>Age Min</label><input type="number" min="0" className={inp} value={position.age_min} onChange={(e) => handlePositionChange(index, "age_min", e.target.value)} /></div>
                    <div><label className={lbl}>Age Max</label><input type="number" min="0" className={inp} value={position.age_max} onChange={(e) => handlePositionChange(index, "age_max", e.target.value)} /></div>
                    <div className="md:col-span-2"><label className={lbl}>Location</label><input className={inp} value={position.location} onChange={(e) => handlePositionChange(index, "location", e.target.value)} /></div>
                    <div className="md:col-span-2"><label className={lbl}>Compensation</label><input className={inp} value={position.compensation} onChange={(e) => handlePositionChange(index, "compensation", e.target.value)} /></div>
                    <div className="md:col-span-2"><label className={lbl}>Required Skills (comma separated)</label><input className={inp} value={position.required_skills} onChange={(e) => handlePositionChange(index, "required_skills", e.target.value)} /></div>
                    <div className="md:col-span-2"><label className={lbl}>Notes</label><textarea rows={2} className={inp + " resize-none"} value={position.notes} onChange={(e) => handlePositionChange(index, "notes", e.target.value)} /></div>
                    <div className="md:col-span-2"><label className={lbl}>Description</label><textarea rows={3} className={inp + " resize-none"} value={position.description} onChange={(e) => handlePositionChange(index, "description", e.target.value)} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-white/20 text-white/60 hover:text-white py-2.5 rounded-lg text-sm font-semibold transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-bold transition-all">
              {saving ? "Saving..." : "Save Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}