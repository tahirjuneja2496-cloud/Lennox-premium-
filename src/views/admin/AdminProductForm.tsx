import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  Trash2,
  Sparkles,
  ArrowLeft,
  Check,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAdmin } from '../../context/AdminContext';
import { Product, ProductVariant, ProductSpecification } from '../../types';
import { api } from '../../services/api';

interface AdminProductFormProps {
  initialProduct?: Product | null;
  onCancel: () => void;
  onSaved: () => void;
}

export const AdminProductForm: React.FC<AdminProductFormProps> = ({
  initialProduct,
  onCancel,
  onSaved
}) => {
  const { categories, products, addToast } = useStore();
  const { saveProduct } = useAdmin();
  const isEdit = !!initialProduct;

  // Form State
  const [name, setName] = useState(initialProduct?.name || '');
  const [slug, setSlug] = useState(initialProduct?.slug || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [shortDescription, setShortDescription] = useState(initialProduct?.shortDescription || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [category, setCategory] = useState(initialProduct?.category || categories[0]?.name || 'Lighting & Objects');
  const [subcategory, setSubcategory] = useState(initialProduct?.subcategory || '');
  const [brand, setBrand] = useState(initialProduct?.brand || 'Atelier V Editions');
  const [tagsInput, setTagsInput] = useState(initialProduct?.tags?.join(', ') || '');
  const [price, setPrice] = useState(initialProduct?.price || 450);
  const [originalPrice, setOriginalPrice] = useState(initialProduct?.originalPrice || 500);
  const [stock, setStock] = useState(initialProduct?.stock || 10);
  const [lowStockThreshold, setLowStockThreshold] = useState(initialProduct?.lowStockThreshold || 3);
  const [published, setPublished] = useState<boolean>(initialProduct ? initialProduct.published : true);
  const [featured, setFeatured] = useState<boolean>(initialProduct?.featured ?? false);
  const [bestseller, setBestseller] = useState<boolean>(initialProduct?.bestseller ?? false);
  const [newArrival, setNewArrival] = useState<boolean>(initialProduct?.newArrival ?? true);

  // Direct Images State
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Variants State
  const [variants, setVariants] = useState<ProductVariant[]>(initialProduct?.variants || []);
  
  // Specifications State
  const [specifications, setSpecifications] = useState<ProductSpecification[]>(
    initialProduct?.specifications || [
      { label: 'Origin', value: 'Handcrafted in France' },
      { label: 'Materials', value: 'Natural travertine & cast bronze' }
    ]
  );

  // SEO State
  const [metaTitle, setMetaTitle] = useState(initialProduct?.seo?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialProduct?.seo?.metaDescription || '');
  const [keywords, setKeywords] = useState(initialProduct?.seo?.keywords || '');

  const [isSaving, setIsSaving] = useState(false);

  // Auto-generate unique SKU
  const generateSku = () => {
    const catCode = category.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'OBJ') || 'EDT';
    const randNum = Math.floor(100 + Math.random() * 900);
    const newSku = `ATV-${catCode}-${randNum}`;
    setSku(newSku);
    addToast(`Generated unique SKU: ${newSku}`, 'info');
  };

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEdit || !slug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  };

  // Direct Device Image Upload Handlers
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map((file) => api.uploadImage(file));
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((r) => r.url);
      setImages((prev) => [...prev, ...newUrls]);
      addToast(`Uploaded ${results.length} images directly from device.`);
    } catch (err: any) {
      addToast(err.message || 'Image upload failed', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDeleteImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryThumbnail = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      return [selected, ...copy];
    });
    addToast('Set as primary cover thumbnail.');
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[newIndex];
      copy[newIndex] = temp;
      return copy;
    });
  };

  // Variant helpers
  const handleAddVariant = () => {
    const vIndex = variants.length + 1;
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}-${vIndex}`,
      name: `Edition ${vIndex}`,
      sku: `${sku || 'ATV'}-V${vIndex}`,
      price,
      stock: 5,
      attributes: { Option: `Edition ${vIndex}` }
    };
    setVariants((prev) => [...prev, newVariant]);
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleDeleteVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Specifications helpers
  const handleAddSpec = () => {
    setSpecifications((prev) => [...prev, { label: '', value: '' }]);
  };

  const handleUpdateSpec = (index: number, field: 'label' | 'value', value: string) => {
    setSpecifications((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleDeleteSpec = (index: number) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast('Product name is required', 'error');
      return;
    }
    if (!sku.trim()) {
      addToast('SKU is required', 'error');
      return;
    }

    // SKU duplicate check
    const existingSku = products.find(
      (p) => p.sku.toLowerCase() === sku.trim().toLowerCase() && p.id !== initialProduct?.id
    );
    if (existingSku) {
      addToast(`SKU '${sku}' already exists on '${existingSku.name}'. Please use a unique SKU.`, 'error');
      return;
    }

    setIsSaving(true);
    try {
      const discountPercent =
        originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

      const productData: Partial<Product> = {
        id: initialProduct?.id,
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sku: sku.trim().toUpperCase(),
        shortDescription,
        description,
        category,
        subcategory,
        brand,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        price: Number(price),
        originalPrice: Number(originalPrice),
        discountPercent,
        stock: Number(stock),
        lowStockThreshold: Number(lowStockThreshold),
        images: images.length > 0 ? images : ['/src/assets/images/hero_luxury_editorial_1790850435776.jpg'],
        published,
        featured,
        bestseller,
        newArrival,
        variants,
        specifications: specifications.filter((s) => s.label.trim() && s.value.trim()),
        rating: initialProduct?.rating || 5.0,
        reviewCount: initialProduct?.reviewCount || 0,
        seo: {
          metaTitle: metaTitle || `${name} | Atelier V`,
          metaDescription: metaDescription || shortDescription,
          keywords
        }
      };

      await saveProduct(productData, isEdit);
      onSaved();
    } catch (err: any) {
      addToast(err.message || 'Failed to save product', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-[#1A1A18]/10">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#71716A] hover:text-[#1A1A18] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-5 border border-[#1A1A18]/20 hover:border-[#1A1A18] text-xs uppercase tracking-wider text-[#1A1A18] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="py-2.5 px-6 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold cursor-pointer shadow-xs"
          >
            {isSaving ? 'Recording...' : isEdit ? 'Update Creation' : 'Publish Creation'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 text-xs">
        
        {/* Section 1: Basic Information */}
        <div className="p-6 sm:p-8 bg-white border border-[#1A1A18]/10 space-y-6 shadow-xs">
          <h2 className="text-sm uppercase tracking-wider font-semibold text-[#1A1A18]">
            1. Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-[#1A1A18] font-medium mb-1.5">Product Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. No. 04 Sculptural Bronze & Fluted Alabaster Table Lamp"
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden font-medium"
              />
            </div>

            {/* SKU and Unique Generator */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[#1A1A18] font-medium">SKU ID * (Unique)</label>
                <button
                  type="button"
                  onClick={generateSku}
                  className="text-[11px] text-amber-900 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Auto-Generate</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="ATV-OBJ-001"
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] font-mono focus:outline-hidden"
              />
            </div>

            {/* Permanent URL Slug */}
            <div>
              <label className="block text-[#1A1A18] font-medium mb-1.5">Permanent URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="sculptural-bronze-alabaster-lamp"
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] font-mono focus:outline-hidden"
              />
              <p className="text-[10px] text-[#71716A] mt-1">Direct link: /product/{slug || '...'}</p>
            </div>

            {/* Category & Brand */}
            <div>
              <label className="block text-[#1A1A18] font-medium mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#1A1A18] font-medium mb-1.5">Maison / Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[#1A1A18] font-medium mb-1.5">Short Overview (Kicker)</label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Hand-cast solid bronze arm with honed Spanish alabaster shade..."
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[#1A1A18] font-medium mb-1.5">Full Provenance Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe material weight, artisan techniques, patination and tactile qualities..."
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[#1A1A18] font-medium mb-1.5">Keywords & Tags (Comma separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Lighting, Bronze, Alabaster, Minimalist, Handcrafted"
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Direct Device Image File Upload (Extremely Important Requirement) */}
        <div className="p-6 sm:p-8 bg-white border border-[#1A1A18]/10 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm uppercase tracking-wider font-semibold text-[#1A1A18]">
                2. Direct Image Upload from Device
              </h2>
              <p className="text-xs text-[#71716A] mt-0.5">
                Drag and drop or select images directly from your computer/device. No URL pasting required.
              </p>
            </div>
            <span className="text-xs font-mono text-[#71716A]">
              {images.length} Image{images.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-[#1A1A18] bg-[#F4F4F0]'
                : 'border-[#1A1A18]/20 hover:border-[#1A1A18] bg-[#FBFBF9]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <UploadCloud className="w-8 h-8 text-[#71716A] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#1A1A18] uppercase tracking-wider">
              {isUploading ? 'Uploading & Optimizing Images...' : 'Click to Browse or Drag Images Here'}
            </p>
            <p className="text-[11px] text-[#71716A] mt-1">
              Supports JPG, JPEG, PNG, WEBP · Auto-stored permanently in media repository
            </p>
          </div>

          {/* Uploaded Images Grid with Reorder, Thumbnail Setting, and Delete */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`group relative aspect-[3/4] bg-[#F4F4F0] border overflow-hidden ${
                    idx === 0 ? 'border-[#1A1A18] ring-2 ring-[#1A1A18]/20' : 'border-[#1A1A18]/10'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Preview ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {idx === 0 ? (
                      <span className="bg-[#1A1A18] text-[#FBFBF9] text-[9px] uppercase tracking-wider px-2 py-0.5 font-semibold">
                        Primary Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryThumbnail(idx)}
                        className="bg-[#FBFBF9]/90 hover:bg-[#1A1A18] hover:text-[#FBFBF9] text-[#1A1A18] text-[9px] uppercase tracking-wider px-1.5 py-0.5 cursor-pointer shadow-xs transition-colors"
                      >
                        Set Cover
                      </button>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between bg-[#1A1A18]/80 backdrop-blur-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1 text-[#FBFBF9]">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 'up')}
                          className="p-1 hover:text-amber-300 cursor-pointer"
                          title="Move left/up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 'down')}
                          className="p-1 hover:text-amber-300 cursor-pointer"
                          title="Move right/down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteImage(idx)}
                      className="p-1 text-rose-300 hover:text-rose-100 cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Pricing & Inventory */}
        <div className="p-6 sm:p-8 bg-white border border-[#1A1A18]/10 space-y-6 shadow-xs">
          <h2 className="text-sm uppercase tracking-wider font-semibold text-[#1A1A18]">
            3. Pricing & Inventory Management
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div>
              <label className="block text-[#1A1A18] font-medium mb-1.5">Sale Price ($) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] font-semibold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[#1A1A18] font-medium mb-1.5">Original / MRP Price ($)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
              />
              {originalPrice > price && (
                <p className="text-[10px] text-emerald-800 font-medium mt-1">
                  Discount: {Math.round(((originalPrice - price) / originalPrice) * 100)}% off
                </p>
              )}
            </div>

            <div>
              <label className="block text-[#1A1A18] font-medium mb-1.5">Stock Available *</label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[#1A1A18] font-medium mb-1.5">Low-Stock Alert Level</label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Badges Toggles */}
          <div className="pt-4 border-t border-[#1A1A18]/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 accent-[#1A1A18]"
              />
              <span className="font-medium text-[#1A1A18]">Publish Live</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 accent-[#1A1A18]"
              />
              <span className="font-medium text-[#1A1A18]">Featured on Home</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bestseller}
                onChange={(e) => setBestseller(e.target.checked)}
                className="w-4 h-4 accent-[#1A1A18]"
              />
              <span className="font-medium text-[#1A1A18]">Bestseller</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newArrival}
                onChange={(e) => setNewArrival(e.target.checked)}
                className="w-4 h-4 accent-[#1A1A18]"
              />
              <span className="font-medium text-[#1A1A18]">New Arrival</span>
            </label>
          </div>
        </div>

        {/* Section 4: Variants Builder */}
        <div className="p-6 sm:p-8 bg-white border border-[#1A1A18]/10 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm uppercase tracking-wider font-semibold text-[#1A1A18]">
                4. Variants & Specifications
              </h2>
              <p className="text-xs text-[#71716A] mt-0.5">
                Support for color, finish, and size variants with individual SKU and stock.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddVariant}
              className="py-1.5 px-3 bg-[#F4F4F0] hover:bg-[#EAEAE5] text-[#1A1A18] uppercase tracking-wider text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Variant</span>
            </button>
          </div>

          {variants.length === 0 ? (
            <p className="text-xs text-[#71716A] italic">No variants added. Product will sell as a single edition.</p>
          ) : (
            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div key={v.id} className="p-4 bg-[#F4F4F0] border border-[#1A1A18]/10 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                  <div>
                    <label className="text-[10px] uppercase text-[#71716A] block mb-1">Variant Name</label>
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                      placeholder="e.g. Patinated Bronze / Large"
                      className="w-full bg-white border border-[#1A1A18]/20 px-2 py-1.5 text-xs text-[#1A1A18] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-[#71716A] block mb-1">Variant SKU</label>
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value.toUpperCase())}
                      className="w-full bg-white border border-[#1A1A18]/20 px-2 py-1.5 text-xs text-[#1A1A18] font-mono focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase text-[#71716A] block mb-1">Price ($)</label>
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => handleUpdateVariant(idx, 'price', Number(e.target.value))}
                        className="w-full bg-white border border-[#1A1A18]/20 px-2 py-1.5 text-xs text-[#1A1A18] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-[#71716A] block mb-1">Stock</label>
                      <input
                        type="number"
                        value={v.stock}
                        onChange={(e) => handleUpdateVariant(idx, 'stock', Number(e.target.value))}
                        className="w-full bg-white border border-[#1A1A18]/20 px-2 py-1.5 text-xs text-[#1A1A18] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteVariant(idx)}
                      className="text-rose-700 hover:text-rose-900 p-2 cursor-pointer"
                      title="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Technical Specifications */}
        <div className="p-6 sm:p-8 bg-white border border-[#1A1A18]/10 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm uppercase tracking-wider font-semibold text-[#1A1A18]">
                5. Technical Specifications Table
              </h2>
              <p className="text-xs text-[#71716A] mt-0.5">
                Displays on product page in the Material Specifications tab.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSpec}
              className="py-1.5 px-3 bg-[#F4F4F0] hover:bg-[#EAEAE5] text-[#1A1A18] uppercase tracking-wider text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Spec Row</span>
            </button>
          </div>

          <div className="space-y-3">
            {specifications.map((spec, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Label (e.g. Dimensions)"
                  value={spec.label}
                  onChange={(e) => handleUpdateSpec(idx, 'label', e.target.value)}
                  className="w-1/3 bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden font-medium"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. H 46cm × W 28cm × D 18cm)"
                  value={spec.value}
                  onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                  className="flex-1 bg-[#F4F4F0] border border-[#1A1A18]/20 px-3 py-2 text-xs text-[#1A1A18] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteSpec(idx)}
                  className="text-stone-400 hover:text-rose-700 p-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: SEO Metadata */}
        <div className="p-6 sm:p-8 bg-white border border-[#1A1A18]/10 space-y-6 shadow-xs">
          <h2 className="text-sm uppercase tracking-wider font-semibold text-[#1A1A18]">
            6. Search Engine Optimization (SEO)
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-[#1A1A18] font-medium mb-1.5">Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Product Name | Atelier V"
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[#1A1A18] font-medium mb-1.5">Meta Description</label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Summary displayed in search engines and social sharing..."
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-6 border border-[#1A1A18]/30 hover:border-[#1A1A18] text-xs uppercase tracking-wider text-[#1A1A18] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="py-3 px-8 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-widest font-semibold cursor-pointer shadow-lg"
          >
            {isSaving ? 'Recording Inscription...' : isEdit ? 'Save Changes' : 'Publish Product'}
          </button>
        </div>

      </form>
    </div>
  );
};
