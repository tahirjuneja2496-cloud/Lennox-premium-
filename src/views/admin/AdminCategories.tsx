import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, UploadCloud, X, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAdmin } from '../../context/AdminContext';
import { Category } from '../../types';
import { api } from '../../services/api';

export const AdminCategories: React.FC = () => {
  const { categories, addToast } = useStore();
  const { saveCategory, deleteCategory } = useAdmin();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [subcategoriesInput, setSubcategoriesInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenNew = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImage('/src/assets/images/hero_luxury_editorial_1790850435776.jpg');
    setEnabled(true);
    setSubcategoriesInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setImage(cat.image);
    setEnabled(cat.enabled);
    setSubcategoriesInput(cat.subcategories?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const res = await api.uploadImage(files[0]);
      setImage(res.url);
      addToast('Category image uploaded directly from device.');
    } catch (err: any) {
      addToast(err.message || 'Image upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const catPayload: Partial<Category> = {
        id: editingCategory?.id,
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        image,
        enabled,
        order: editingCategory?.order || categories.length + 1,
        subcategories: subcategoriesInput.split(',').map((s) => s.trim()).filter(Boolean)
      };

      await saveCategory(catPayload, !!editingCategory);
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (window.confirm(`Delete category '${catName}'? Products in this category will remain.`)) {
      await deleteCategory(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A1A18]/10">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#71716A]">Taxonomy Architecture</span>
          <h1 className="text-3xl font-serif text-[#1A1A18] mt-1 font-normal">
            Category Management
          </h1>
        </div>

        <button
          onClick={handleOpenNew}
          className="py-2.5 px-6 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white border border-[#1A1A18]/10 overflow-hidden flex flex-col justify-between shadow-xs">
            <div>
              <div className="relative aspect-[16/10] bg-[#F4F4F0] overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${
                      cat.enabled ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {cat.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-2">
                <h3 className="font-serif text-lg font-medium text-[#1A1A18]">{cat.name}</h3>
                <p className="text-xs text-[#71716A] line-clamp-2">{cat.description}</p>
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1">
                    {cat.subcategories.map((sub, idx) => (
                      <span key={idx} className="text-[10px] bg-[#F4F4F0] text-[#52524D] px-2 py-0.5">
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#1A1A18]/10 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-[#71716A]">/{cat.slug}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 text-[#52524D] hover:text-[#1A1A18] cursor-pointer"
                  title="Edit category"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-1.5 text-[#8A8A82] hover:text-rose-700 cursor-pointer"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FBFBF9] border border-[#1A1A18]/20 w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1A18]/10">
              <h3 className="text-xl font-serif text-[#1A1A18]">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#1A1A18] hover:opacity-60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#1A1A18] font-medium mb-1">Category Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Fine Horology"
                  className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[#1A1A18] font-medium mb-1">Slug (URL Path)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="fine-horology"
                  className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[#1A1A18] font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of materials and pieces..."
                  className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                />
              </div>

              {/* Category Image Upload */}
              <div>
                <label className="block text-[#1A1A18] font-medium mb-1">
                  Category Image (Upload from device)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-12 bg-[#F4F4F0] overflow-hidden border border-[#1A1A18]/10 shrink-0">
                    <img
                      src={image}
                      alt="Category preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="py-2 px-3 bg-[#F4F4F0] hover:bg-[#EAEAE5] text-[#1A1A18] border border-[#1A1A18]/20 text-xs uppercase tracking-wider font-semibold cursor-pointer"
                  >
                    {isUploading ? 'Uploading...' : 'Choose Device Image'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#1A1A18] font-medium mb-1">
                  Subcategories (Comma separated)
                </label>
                <input
                  type="text"
                  value={subcategoriesInput}
                  onChange={(e) => setSubcategoriesInput(e.target.value)}
                  placeholder="Table Lamps, Sculptures, Vessels"
                  className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#1A1A18]"
                  />
                  <span className="text-[#1A1A18] font-medium">Enable on public storefront</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[#1A1A18]/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 border border-[#1A1A18]/20 text-[#1A1A18] text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2 px-6 bg-[#1A1A18] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold cursor-pointer hover:bg-[#333330]"
                >
                  {isSaving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
