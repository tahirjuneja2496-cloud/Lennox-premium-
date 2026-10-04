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
import { Product, ProductVariant, ProductSpecification, ProductColorVariant, ProductVariantConfig } from '../../types';
import { api } from '../../services/api';
import { CATEGORY_OPTIONS, getSizePresetsForCategory } from '../../utils/variants';

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

  // Variants & Catalogue Options State
  const [enableSize, setEnableSize] = useState<boolean>(initialProduct?.variantConfig?.enableSize ?? false);
  const [enableColor, setEnableColor] = useState<boolean>(initialProduct?.variantConfig?.enableColor ?? false);
  const [enableVariantPrice, setEnableVariantPrice] = useState<boolean>(initialProduct?.variantConfig?.enableVariantPrice ?? false);

  // Sizes State
  const [availableSizes, setAvailableSizes] = useState<string[]>(
    initialProduct?.variantConfig?.availableSizes || []
  );
  const [customSizeInput, setCustomSizeInput] = useState('');

  // Colors State
  const [colors, setColors] = useState<ProductColorVariant[]>(
    initialProduct?.variantConfig?.colors || []
  );
  const [customColorInput, setCustomColorInput] = useState('');

  // Legacy raw variants state for backward compatibility
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

  // Category change with size preset loading
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (enableSize && availableSizes.length === 0) {
      const presets = getSizePresetsForCategory(newCat);
      if (presets.length > 0) {
        setAvailableSizes(presets);
      }
    }
  };

  // Size helper functions
  const handleToggleSize = (size: string) => {
    setAvailableSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleAddCustomSize = () => {
    const val = customSizeInput.trim().toUpperCase();
    if (!val) return;
    if (!availableSizes.includes(val)) {
      setAvailableSizes((prev) => [...prev, val]);
      setCustomSizeInput('');
    } else {
      addToast(`Size '${val}' already added`, 'info');
    }
  };

  const handleRemoveSize = (size: string) => {
    setAvailableSizes((prev) => prev.filter((s) => s !== size));
  };

  const handleSelectAllCategorySizes = () => {
    const presets = getSizePresetsForCategory(category);
    if (presets.length > 0) {
      setAvailableSizes((prev) => Array.from(new Set([...prev, ...presets])));
    }
  };

  const handleClearSizes = () => {
    setAvailableSizes([]);
  };

  // Colour helper functions
  const handleAddColor = (nameToAdd?: string) => {
    const colorName = (nameToAdd || customColorInput).trim();
    if (!colorName) return;
    if (colors.some((c) => c.name.toLowerCase() === colorName.toLowerCase())) {
      addToast(`Colour '${colorName}' is already added`, 'info');
      return;
    }
    const newColor: ProductColorVariant = {
      id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: colorName,
      image: images[0] || '',
      price: price
    };
    setColors((prev) => [...prev, newColor]);
    setCustomColorInput('');
  };

  const handleUpdateColor = (id: string, field: keyof ProductColorVariant, value: any) => {
    setColors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveColor = (id: string) => {
    setColors((prev) => prev.filter((c) => c.id !== id));
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

      const variantConfig: ProductVariantConfig = {
        enableSize,
        enableColor,
        enableVariantPrice,
        availableSizes: enableSize ? availableSizes : [],
        colors: enableColor ? colors : []
      };

      // Generate compatible variants array for backward compatibility
      const generatedVariants: ProductVariant[] = [];
      if (enableColor && colors.length > 0) {
        colors.forEach((c) => {
          if (enableSize && availableSizes.length > 0) {
            availableSizes.forEach((sz) => {
              generatedVariants.push({
                id: `var-${c.name.toLowerCase()}-${sz.toLowerCase()}`,
                name: `${c.name} / ${sz}`,
                sku: `${sku || 'SKU'}-${c.name.slice(0, 3).toUpperCase()}-${sz}`,
                price: enableVariantPrice && c.price ? c.price : price,
                stock,
                image: c.image || images[0],
                attributes: { color: c.name, size: sz }
              });
            });
          } else {
            generatedVariants.push({
              id: `var-${c.name.toLowerCase()}`,
              name: c.name,
              sku: `${sku || 'SKU'}-${c.name.slice(0, 3).toUpperCase()}`,
              price: enableVariantPrice && c.price ? c.price : price,
              stock,
              image: c.image || images[0],
              attributes: { color: c.name }
            });
          }
        });
      } else if (enableSize && availableSizes.length > 0) {
        availableSizes.forEach((sz) => {
          generatedVariants.push({
            id: `var-${sz.toLowerCase()}`,
            name: `Size ${sz}`,
            sku: `${sku || 'SKU'}-${sz}`,
            price,
            stock,
            image: images[0],
            attributes: { size: sz }
          });
        });
      } else if (variants.length > 0) {
        generatedVariants.push(...variants);
      }

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
        variants: generatedVariants,
        variantConfig,
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
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-3.5 py-2.5 text-xs text-[#1A1A18] focus:outline-hidden cursor-pointer"
              >
                {Array.from(new Set([...CATEGORY_OPTIONS, ...categories.map((c) => c.name)])).map((catName) => (
                  <option key={catName} value={catName}>
                    {catName}
                  </option>
                ))}
              </select>
              {enableSize && getSizePresetsForCategory(category).length > 0 && (
                <p className="text-[10px] text-emerald-800 font-medium mt-1">
                  Preset available: {getSizePresetsForCategory(category).slice(0, 5).join(', ')}...
                </p>
              )}
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

        {/* Section 4: Product Variants (Optional) */}
        <div className="p-6 sm:p-8 bg-white border border-[#1A1A18]/10 space-y-6 shadow-xs">
          <div>
            <h2 className="text-sm uppercase tracking-wider font-semibold text-[#1A1A18]">
              4. Product Variants (Optional)
            </h2>
            <p className="text-xs text-[#71716A] mt-0.5">
              Optionally enable sizes, colourways, and variant-specific pricing. All images belong to this ONE product catalogue.
            </p>
          </div>

          {/* Optional Variant Feature Toggles */}
          <div className="p-4 bg-[#F4F4F0] border border-[#1A1A18]/15 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-xs hover:bg-[#EAEAE5] transition-colors">
              <input
                type="checkbox"
                checked={enableSize}
                onChange={(e) => {
                  const val = e.target.checked;
                  setEnableSize(val);
                  if (val && availableSizes.length === 0) {
                    const presets = getSizePresetsForCategory(category);
                    if (presets.length > 0) setAvailableSizes(presets);
                  }
                }}
                className="w-4 h-4 mt-0.5 accent-[#1A1A18] cursor-pointer"
              />
              <div>
                <span className="font-semibold text-xs text-[#1A1A18] block">Enable Size</span>
                <span className="text-[10px] text-[#71716A] leading-tight block mt-0.5">
                  Category presets (Shoes, Apparel, Rings) or custom sizes
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-xs hover:bg-[#EAEAE5] transition-colors">
              <input
                type="checkbox"
                checked={enableColor}
                onChange={(e) => setEnableColor(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-[#1A1A18] cursor-pointer"
              />
              <div>
                <span className="font-semibold text-xs text-[#1A1A18] block">Enable Colour</span>
                <span className="text-[10px] text-[#71716A] leading-tight block mt-0.5">
                  Link catalogue pictures to specific colourways
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-xs hover:bg-[#EAEAE5] transition-colors">
              <input
                type="checkbox"
                checked={enableVariantPrice}
                onChange={(e) => setEnableVariantPrice(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-[#1A1A18] cursor-pointer"
              />
              <div>
                <span className="font-semibold text-xs text-[#1A1A18] block">Image/Variant Price</span>
                <span className="text-[10px] text-[#71716A] leading-tight block mt-0.5">
                  Assign individual prices to different images/colours
                </span>
              </div>
            </label>
          </div>

          {/* Sub-section: Size Configuration */}
          {enableSize && (
            <div className="p-5 border border-[#1A1A18]/15 bg-[#FBFBF9] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1A1A18]/10">
                <div>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18]">
                    Size System (Category: {category})
                  </h3>
                  <p className="text-[11px] text-[#71716A]">
                    Select available sizes or add custom dimensions. Customer will see only enabled sizes.
                  </p>
                </div>
                {getSizePresetsForCategory(category).length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllCategorySizes}
                      className="px-2.5 py-1 bg-white border border-[#1A1A18]/20 hover:border-[#1A1A18] text-[10px] uppercase tracking-wider text-[#1A1A18] font-medium cursor-pointer"
                    >
                      Select All Presets
                    </button>
                    {availableSizes.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSizes}
                        className="px-2.5 py-1 bg-white border border-[#1A1A18]/20 hover:text-rose-700 text-[10px] uppercase tracking-wider text-[#71716A] font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Category Presets Quick Toggles */}
              {getSizePresetsForCategory(category).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-[#71716A] font-medium block">
                    Quick suggestions for {category} (click to toggle):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {getSizePresetsForCategory(category).map((sz) => {
                      const isSelected = availableSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleToggleSize(sz)}
                          className={`px-3 py-1 text-xs font-mono font-medium border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#1A1A18] text-white border-[#1A1A18]'
                              : 'bg-white text-[#1A1A18] border-[#1A1A18]/20 hover:border-[#1A1A18]'
                          }`}
                        >
                          {isSelected ? `✓ ${sz}` : sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Sizes Tags */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#1A1A18] block">
                  Active Sizes on Product ({availableSizes.length}):
                </span>
                {availableSizes.length === 0 ? (
                  <p className="text-xs text-amber-800 italic">
                    No sizes selected yet. Choose from suggestions above or type a custom size below.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((sz) => (
                      <span
                        key={sz}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#1A1A18]/30 text-xs font-mono text-[#1A1A18] font-semibold shadow-xs"
                      >
                        <span>{sz}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(sz)}
                          className="text-[#8A8A82] hover:text-rose-700 cursor-pointer p-0.5"
                          title={`Remove size ${sz}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Custom Size */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#1A1A18]/10 max-w-sm">
                <input
                  type="text"
                  placeholder="Custom size (e.g. 46, Free Size, 16Y)"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSize();
                    }
                  }}
                  className="flex-1 bg-white border border-[#1A1A18]/20 px-3 py-1.5 text-xs text-[#1A1A18] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSize}
                  className="px-3 py-1.5 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold cursor-pointer"
                >
                  Add Size
                </button>
              </div>
            </div>
          )}

          {/* Sub-section: Colour System & Variant Pricing */}
          {enableColor && (
            <div className="p-5 border border-[#1A1A18]/15 bg-[#FBFBF9] space-y-4">
              <div className="pb-2 border-b border-[#1A1A18]/10">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1A1A18]">
                  Colourways & Image Links
                </h3>
                <p className="text-[11px] text-[#71716A]">
                  Link each colour to a picture from this catalogue. When customers pick a colour, the photo (and variant price, if enabled) switches automatically.
                </p>
              </div>

              {/* Quick Preset Colours */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-[#71716A] font-medium block">
                  Quick add colour:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Black', 'White', 'Red', 'Blue', 'Green', 'Grey', 'Navy', 'Beige', 'Brown'].map((cName) => (
                    <button
                      key={cName}
                      type="button"
                      onClick={() => handleAddColor(cName)}
                      className="px-2.5 py-1 bg-white border border-[#1A1A18]/20 hover:border-[#1A1A18] text-xs text-[#1A1A18] cursor-pointer"
                    >
                      + {cName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Custom Colour Input */}
              <div className="flex items-center gap-2 max-w-sm">
                <input
                  type="text"
                  placeholder="Custom colour (e.g. Forest Green, Space Grey)"
                  value={customColorInput}
                  onChange={(e) => setCustomColorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddColor();
                    }
                  }}
                  className="flex-1 bg-white border border-[#1A1A18]/20 px-3 py-1.5 text-xs text-[#1A1A18] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleAddColor()}
                  className="px-3 py-1.5 bg-[#1A1A18] hover:bg-[#333330] text-[#FBFBF9] text-xs uppercase tracking-wider font-semibold cursor-pointer"
                >
                  Add Colour
                </button>
              </div>

              {/* List of Configured Colours */}
              <div className="space-y-3 pt-2">
                {colors.length === 0 ? (
                  <p className="text-xs text-amber-800 italic">
                    No colours added yet. Add colours above to link photos and customize prices.
                  </p>
                ) : (
                  colors.map((c, cIdx) => (
                    <div
                      key={c.id || cIdx}
                      className="p-3 bg-white border border-[#1A1A18]/15 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      {/* Colour Name */}
                      <div className="sm:col-span-4">
                        <label className="text-[10px] uppercase text-[#71716A] block mb-1">
                          Colour Name
                        </label>
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => handleUpdateColor(c.id, 'name', e.target.value)}
                          className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-2.5 py-1.5 text-xs text-[#1A1A18] font-medium focus:outline-hidden"
                        />
                      </div>

                      {/* Linked Image Selection */}
                      <div className="sm:col-span-4">
                        <label className="text-[10px] uppercase text-[#71716A] block mb-1">
                          Linked Catalogue Picture
                        </label>
                        <div className="flex items-center gap-2">
                          {c.image ? (
                            <img
                              src={c.image}
                              alt={c.name}
                              className="w-7 h-9 object-cover border border-[#1A1A18]/20 shrink-0 bg-[#F4F4F0]"
                            />
                          ) : (
                            <div className="w-7 h-9 border border-dashed border-[#1A1A18]/30 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-3.5 h-3.5 text-[#8A8A82]" />
                            </div>
                          )}
                          <select
                            value={c.image || ''}
                            onChange={(e) => handleUpdateColor(c.id, 'image', e.target.value)}
                            className="flex-1 bg-[#F4F4F0] border border-[#1A1A18]/20 px-2 py-1.5 text-xs text-[#1A1A18] focus:outline-hidden cursor-pointer truncate"
                          >
                            <option value="">(Default primary image)</option>
                            {images.map((img, imgIdx) => (
                              <option key={imgIdx} value={img}>
                                Picture #{imgIdx + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Variant Price (if enabled) */}
                      {enableVariantPrice ? (
                        <div className="sm:col-span-3">
                          <label className="text-[10px] uppercase text-[#71716A] block mb-1">
                            Variant Price (₹)
                          </label>
                          <input
                            type="number"
                            value={c.price !== undefined ? c.price : price}
                            onChange={(e) => handleUpdateColor(c.id, 'price', Number(e.target.value))}
                            placeholder={String(price)}
                            className="w-full bg-[#F4F4F0] border border-[#1A1A18]/20 px-2.5 py-1.5 text-xs text-[#1A1A18] font-semibold focus:outline-hidden"
                          />
                        </div>
                      ) : (
                        <div className="sm:col-span-3 text-[11px] text-[#71716A]">
                          <span>Standard price: <strong>₹{price}</strong></span>
                        </div>
                      )}

                      {/* Remove Button */}
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(c.id)}
                          className="p-1.5 text-rose-700 hover:text-rose-900 cursor-pointer"
                          title="Remove colour"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Fallback legacy variants if neither size nor color enabled, but raw variants exist */}
          {!enableSize && !enableColor && variants.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-[#1A1A18]/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1A1A18]">
                  Existing Legacy Editions ({variants.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="py-1 px-2.5 bg-[#F4F4F0] hover:bg-[#EAEAE5] text-[#1A1A18] uppercase tracking-wider text-[10px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Legacy Variant</span>
                </button>
              </div>
              {variants.map((v, idx) => (
                <div key={v.id} className="p-3 bg-[#F4F4F0] border border-[#1A1A18]/10 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                  <div>
                    <label className="text-[10px] uppercase text-[#71716A] block mb-1">Variant Name</label>
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                      className="w-full bg-white border border-[#1A1A18]/20 px-2 py-1.5 text-xs text-[#1A1A18] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-[#71716A] block mb-1">SKU</label>
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

          {/* When nothing is enabled */}
          {!enableSize && !enableColor && variants.length === 0 && (
            <p className="text-xs text-[#71716A] italic">
              No variants enabled. This product will sell as a single unified catalogue creation at the standard price.
            </p>
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
