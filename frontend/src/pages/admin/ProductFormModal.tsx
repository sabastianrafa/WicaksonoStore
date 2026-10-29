import { useEffect, useState, type ChangeEvent } from 'react';
import { apiFetch } from '../../api/client';
import type { AdminProduct, Category, ProductImage } from './types';
import { normalizeProduct } from './utils';
import { Modal, labelStyle } from './styles';

interface Props {
  product: AdminProduct | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (product: AdminProduct, isEdit: boolean) => void;
}

interface ProductForm {
  name: string;
  categoryId: string;
  price: string;
  originalPrice: string;
  stock: string;
  weight: string;
  discount: string;
  isActive: boolean;
  description: string;
}

interface PendingImage {
  id: string;
  file: File;
  preview: string;
}

/* Batas upload: kompres di sisi klien agar aman di bawah limit PHP. */
const MAX_INPUT_SIZE = 20 * 1024 * 1024;
const MAX_UPLOAD_SIZE = 1.8 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1920;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function compressImage(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_SIZE) return file;

  const bitmap = await createImageBitmap(file);

  try {
    let width = bitmap.width;
    let height = bitmap.height;

    const scale = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height, 1);

    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) throw new Error('Browser tidak mendukung Canvas.');

    let quality = 0.85;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      canvas.width = width;
      canvas.height = height;

      context.clearRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', quality);
      });

      if (!blob) throw new Error('Gagal melakukan kompresi gambar.');

      if (blob.size <= MAX_UPLOAD_SIZE) {
        const baseName = file.name.replace(/\.[^/.]+$/, '');

        return new File([blob], `${baseName}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
      }

      if (quality > 0.45) {
        quality -= 0.1;
      } else {
        width = Math.max(640, Math.round(width * 0.8));
        height = Math.max(640, Math.round(height * 0.8));
      }
    }

    throw new Error('Gambar masih terlalu besar setelah dikompres.');
  } finally {
    bitmap.close();
  }
}

const createImageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Diskon diturunkan dari harga, backend menyimpannya sebagai integer 0-100. */
function calculateDiscount(price: string | number, originalPrice: string | number): string {
  const sale = Number(price);
  const normal = Number(originalPrice);

  if (
    !Number.isFinite(sale) ||
    !Number.isFinite(normal) ||
    normal <= 0 ||
    sale < 0 ||
    sale >= normal
  ) {
    return '0';
  }

  return String(Math.round(((normal - sale) / normal) * 100));
}

export default function ProductFormModal({ product, categories, onClose, onSaved }: Props) {
  const isEdit = product !== null;

  const [form, setForm] = useState<ProductForm>(() => {
    if (product) {
      return {
        name: product.name,
        categoryId: String(product.category_id ?? ''),
        price: String(product.price ?? ''),
        originalPrice: String(product.originalPrice ?? product.price ?? ''),
        stock: String(product.stock ?? 0),
        weight: product.weight > 0 ? String(product.weight) : '',
        discount: String(product.discount ?? 0),
        isActive: product.is_active,
        description: product.description ?? '',
      };
    }

    return {
      name: '',
      categoryId: categories[0] ? String(categories[0].id) : '',
      price: '',
      originalPrice: '',
      stock: '',
      weight: '',
      discount: '0',
      isActive: true,
      description: '',
    };
  });

  const [discountEnabled, setDiscountEnabled] = useState(
    () => Boolean(product && product.discount > 0 && product.originalPrice > product.price)
  );

  const [productImages, setProductImages] = useState<ProductImage[]>(product?.images ?? []);
  const [primaryImageId, setPrimaryImageId] = useState<number | null>(
    () => product?.images.find((image) => image.is_primary)?.id ?? null
  );
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image ?? null);

  const [newImages, setNewImages] = useState<PendingImage[]>([]);
  const [selectedPrimaryNewId, setSelectedPrimaryNewId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [processingImages, setProcessingImages] = useState(false);
  const [processingText, setProcessingText] = useState('');

  const setField = (field: keyof ProductForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ---------- Muat gambar produk dari /admin/products/{id} ---------- */

  useEffect(() => {
    if (!product?.id) {
      setProductImages([]);
      setPrimaryImageId(null);
      return;
    }

    let active = true;

    const load = async () => {
      setLoadingImages(true);

      try {
        const response = await apiFetch<any>(`/admin/products/${product.id}`);
        const images: ProductImage[] = response?.data?.images ?? product.images ?? [];

        if (!active) return;

        setProductImages(images);
        setPrimaryImageId(images.find((image) => image.is_primary)?.id ?? null);
      } catch (error) {
        console.error('Gagal memuat gambar produk:', error);
      } finally {
        if (active) setLoadingImages(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [product?.id]);

  // Kategori bisa selesai dimuat setelah modal terbuka.
  useEffect(() => {
    if (!isEdit && !form.categoryId && categories[0]) {
      setField('categoryId', String(categories[0].id));
    }
  }, [categories, isEdit, form.categoryId]);

  /* ---------- Upload gambar baru ---------- */

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) return;

    const validFiles = files.filter((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        window.alert(`${file.name} harus JPG, PNG, atau WEBP.`);
        return false;
      }

      if (file.size > MAX_INPUT_SIZE) {
        window.alert(`${file.name} terlalu besar. Maksimal file awal 20 MB.`);
        return false;
      }

      return true;
    });

    if (!validFiles.length) {
      event.target.value = '';
      return;
    }

    setProcessingImages(true);

    const pending: PendingImage[] = [];

    try {
      for (let index = 0; index < validFiles.length; index += 1) {
        const file = validFiles[index];

        setProcessingText(`Mengompres gambar ${index + 1}/${validFiles.length}...`);

        try {
          const compressed = await compressImage(file);

          pending.push({
            id: createImageId(),
            file: compressed,
            preview: URL.createObjectURL(compressed),
          });
        } catch (error) {
          console.error(`Gagal memproses ${file.name}:`, error);
          window.alert(`Gagal memproses ${file.name}.`);
        }
      }

      if (!pending.length) return;

      setNewImages((prev) => [...prev, ...pending]);

      if (
        primaryImageId === null &&
        selectedPrimaryNewId === null &&
        productImages.length === 0
      ) {
        setSelectedPrimaryNewId(pending[0].id);
        setImagePreview(pending[0].preview);
      }
    } finally {
      setProcessingImages(false);
      setProcessingText('');
      event.target.value = '';
    }
  };

  const handleRemoveNewImage = (id: string) => {
    setNewImages((prev) => {
      const removed = prev.find((item) => item.id === id);

      if (removed) URL.revokeObjectURL(removed.preview);

      return prev.filter((item) => item.id !== id);
    });

    if (selectedPrimaryNewId === id) setSelectedPrimaryNewId(null);
  };

  const handleDeleteImage = async (image: ProductImage) => {
    if (!product?.id) return;

    const confirmed = window.confirm(
      image.is_primary
        ? 'Gambar utama akan dihapus. Gambar lain akan menjadi gambar utama. Lanjutkan?'
        : 'Hapus gambar produk ini?'
    );

    if (!confirmed) return;

    try {
      setDeletingImageId(image.id);

      await apiFetch(`/admin/products/${product.id}/images/${image.id}`, {
        method: 'DELETE',
      });

      const response = await apiFetch<any>(`/admin/products/${product.id}`);
      const updated = normalizeProduct(response?.data ?? {});

      setProductImages(updated.images);
      setPrimaryImageId(
        updated.images.find((item) => item.is_primary)?.id ?? null
      );
      setImagePreview(updated.image || null);

      onSaved(updated, true);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : 'Gagal menghapus gambar.'
      );
    } finally {
      setDeletingImageId(null);
    }
  };

  /* ---------- Promo ---------- */

  const toggleDiscount = (enabled: boolean) => {
    setDiscountEnabled(enabled);

    if (!enabled) {
      setField('discount', '0');
      return;
    }

    setField('discount', calculateDiscount(form.price, form.originalPrice));
  };

  const handleNumericChange = (
    field: 'price' | 'originalPrice' | 'stock' | 'weight',
    value: string
  ) => {
    const digits = value.replace(/[^0-9]/g, '');

    setForm((prev) => {
      const next = { ...prev, [field]: digits };

      if (discountEnabled && (field === 'price' || field === 'originalPrice')) {
        next.discount = calculateDiscount(
          field === 'price' ? digits : prev.price,
          field === 'originalPrice' ? digits : prev.originalPrice
        );
      }

      if (!discountEnabled) next.discount = '0';

      return next;
    });
  };

  /* ---------- Simpan ---------- */

  const handleSave = async () => {
    if (saving || processingImages) return;

    if (!form.name.trim() || !form.price || !form.stock || !form.weight || !form.description.trim()) {
      window.alert('Mohon lengkapi semua field produk sebelum disimpan.');
      return;
    }

    if (!form.categoryId) {
      window.alert('Pilih kategori terlebih dahulu.');
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock);
    const weight = Number(form.weight);

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isInteger(weight) ||
      weight < 1 ||
      weight > 4294967295
    ) {
      window.alert('Nilai harga, stok, atau berat tidak valid.');
      return;
    }

    const originalPrice = discountEnabled ? Number(form.originalPrice) : price;
    const discount = discountEnabled ? Number(calculateDiscount(price, originalPrice)) : 0;

    if (discountEnabled && (!Number.isFinite(originalPrice) || originalPrice <= price)) {
      window.alert(
        'Harga Normal harus lebih tinggi daripada Harga Jual. Isi Harga Normal yang lebih besar sebelum menyimpan promo.'
      );
      return;
    }

    if (discountEnabled && discount <= 0) {
      window.alert('Promo tidak valid. Harga Jual harus lebih rendah daripada Harga Normal.');
      return;
    }

    try {
      setSaving(true);

      // Body JSON: apiFetch sudah memasang Content-Type untuk non-FormData.
      const response = await apiFetch<any>(
        isEdit ? `/admin/products/${product.id}` : '/admin/products',
        {
          method: isEdit ? 'PUT' : 'POST',
          body: JSON.stringify({
            category_id: Number(form.categoryId),
            name: form.name.trim(),
            description: form.description.trim(),
            price,
            original_price: originalPrice,
            stock,
            weight,
            discount,
            is_active: form.isActive,
          }),
        }
      );

      const saved = normalizeProduct(response?.data ?? {});

      if (!saved.id) throw new Error('Produk gagal disimpan.');

      // Upload gambar baru setelah produk tersimpan.
      const uploaded: Array<{ id: number; previewId: string }> = [];

      for (const pending of newImages) {
        const imageData = new FormData();
        imageData.append('image', pending.file);
        imageData.append('is_primary', '0');

        try {
          const uploadResponse = await apiFetch<any>(
            `/admin/products/${saved.id}/images`,
            { method: 'POST', body: imageData }
          );

          if (!uploadResponse?.data?.id) {
            throw new Error('Server tidak mengembalikan ID gambar.');
          }

          uploaded.push({ id: uploadResponse.data.id, previewId: pending.id });
        } catch (error) {
          throw new Error(
            `Gagal upload "${pending.file.name}". ${
              error instanceof Error ? error.message : 'Periksa file gambar.'
            }`
          );
        }
      }

      // Tentukan gambar utama.
      let primaryId = primaryImageId;

      if (selectedPrimaryNewId) {
        const match = uploaded.find((item) => item.previewId === selectedPrimaryNewId);
        if (match) primaryId = match.id;
      } else if (!primaryId && uploaded[0]) {
        primaryId = uploaded[0].id;
      }

      if (primaryId) {
        await apiFetch(`/admin/products/${saved.id}/images/${primaryId}/primary`, {
          method: 'PATCH',
        });
      }

      const latestResponse = await apiFetch<any>(`/admin/products/${saved.id}`);
      const latest = normalizeProduct(latestResponse?.data ?? saved);

      setProductImages(latest.images);
      setPrimaryImageId(latest.images.find((item) => item.is_primary)?.id ?? null);
      setSelectedPrimaryNewId(null);
      setImagePreview(latest.image || null);

      newImages.forEach((image) => URL.revokeObjectURL(image.preview));
      setNewImages([]);

      onSaved(latest, isEdit);
      onClose();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menyimpan produk.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
      onClose={onClose}
      maxWidth={860}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        {/* Kolom kiri */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Nama Produk</label>
            <input
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="Masukkan nama produk"
              className="input-field"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Kategori</label>
            <select
              value={form.categoryId}
              onChange={(event) => setField('categoryId', event.target.value)}
              className="input-field"
            >
              {categories.length === 0 ? (
                <option value="">Memuat kategori...</option>
              ) : (
                categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Harga Jual</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(event) => handleNumericChange('price', event.target.value)}
                placeholder="25000"
                className="input-field"
              />
            </div>

            <div>
              <label style={labelStyle}>Stok</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) => handleNumericChange('stock', event.target.value)}
                placeholder="50"
                className="input-field"
              />
            </div>

            <div>
              <label style={labelStyle}>Berat (gram)</label>
              <input
                type="number"
                min="1"
                max="4294967295"
                step="1"
                value={form.weight}
                onChange={(event) => handleNumericChange('weight', event.target.value)}
                placeholder="250"
                className="input-field"
              />
            </div>
          </div>

          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
              background: '#FAFAFA',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              <input
                type="checkbox"
                checked={discountEnabled}
                onChange={(event) => toggleDiscount(event.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#E4401F', cursor: 'pointer' }}
              />
              Produk sedang diskon
            </label>

            {discountEnabled && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  marginTop: 14,
                }}
              >
                <div>
                  <label style={labelStyle}>Harga Normal</label>
                  <input
                    type="number"
                    min="0"
                    value={form.originalPrice}
                    onChange={(event) =>
                      handleNumericChange('originalPrice', event.target.value)
                    }
                    placeholder="30000"
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Diskon (%)</label>
                  <div
                    className="input-field"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#F3F4F6',
                      color: '#374151',
                      fontWeight: 700,
                      cursor: 'not-allowed',
                    }}
                  >
                    {form.discount || '0'}%
                  </div>
                </div>
              </div>
            )}

            <p style={{ margin: '8px 0 0', fontSize: '0.7rem', color: '#9CA3AF' }}>
              Diskon dihitung otomatis. Saat promo aktif, Harga Jual wajib lebih rendah dari Harga
              Normal.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Status Produk</label>
            <select
              value={form.isActive ? '1' : '0'}
              onChange={(event) => setField('isActive', event.target.value === '1')}
              className="input-field"
            >
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
              rows={5}
              placeholder="Tuliskan deskripsi produk..."
              className="input-field"
              style={{ resize: 'vertical', minHeight: 120 }}
            />
          </div>
        </div>

        {/* Kolom kanan: gambar */}
        <div>
          <label style={labelStyle}>Foto Produk</label>

          {loadingImages ? (
            <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 8 }}>Memuat gambar...</div>
          ) : null}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginTop: 10,
            }}
          >
            {productImages.map((image) => (
              <div
                key={image.id}
                onClick={() => {
                  setPrimaryImageId(image.id);
                  setSelectedPrimaryNewId(null);
                  setImagePreview(image.url);
                }}
                style={{
                  position: 'relative',
                  aspectRatio: '1 / 1',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border:
                    primaryImageId === image.id ? '2px solid #E4401F' : '1px solid #E5E7EB',
                  background: '#FFF8F0',
                  cursor: primaryImageId === image.id ? 'default' : 'pointer',
                }}
                title={
                  primaryImageId === image.id
                    ? 'Foto utama'
                    : 'Klik untuk menjadikan foto utama'
                }
              >
                <img
                  src={image.url}
                  alt={image.alt_text ?? 'Gambar produk'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />

                {primaryImageId === image.id && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 7,
                      left: 7,
                      padding: '3px 7px',
                      borderRadius: 6,
                      background: '#E4401F',
                      color: 'white',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                    }}
                  >
                    UTAMA
                  </span>
                )}

                {isEdit && (
                  <button
                    type="button"
                    disabled={deletingImageId === image.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteImage(image);
                    }}
                    style={{
                      position: 'absolute',
                      top: 7,
                      right: 7,
                      width: 28,
                      height: 28,
                      border: 'none',
                      borderRadius: 50,
                      background: 'rgba(220, 38, 38, 0.9)',
                      color: 'white',
                      cursor: deletingImageId === image.id ? 'wait' : 'pointer',
                      fontSize: 16,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {deletingImageId === image.id ? '...' : '×'}
                  </button>
                )}
              </div>
            ))}

            {newImages.map((image) => (
              <div
                key={image.id}
                onClick={() => {
                  setSelectedPrimaryNewId(image.id);
                  setPrimaryImageId(null);
                  setImagePreview(image.preview);
                }}
                style={{
                  position: 'relative',
                  aspectRatio: '1 / 1',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border:
                    selectedPrimaryNewId === image.id ? '2px solid #E4401F' : '1px dashed #D1D5DB',
                  background: '#FFF8F0',
                  cursor: 'pointer',
                }}
                title="Klik untuk menjadikan foto utama"
              >
                <img
                  src={image.preview}
                  alt="Gambar baru"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />

                {selectedPrimaryNewId === image.id && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 7,
                      left: 7,
                      padding: '3px 7px',
                      borderRadius: 6,
                      background: '#E4401F',
                      color: 'white',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                    }}
                  >
                    UTAMA
                  </span>
                )}

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveNewImage(image.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: 7,
                    right: 7,
                    width: 28,
                    height: 28,
                    border: 'none',
                    borderRadius: 50,
                    background: 'rgba(220, 38, 38, 0.9)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {imagePreview && (
            <div style={{ marginTop: 14 }}>
              <div style={{ ...labelStyle, fontSize: '0.75rem' }}>PratinjauFoto Utama</div>
              <img
                src={imagePreview}
                alt="Pratinjau foto utama"
                style={{
                  width: '100%',
                  borderRadius: 12,
                  objectFit: 'cover',
                  background: '#FFF8F0',
                  border: '1px solid #F3F4F6',
                }}
              />
            </div>
          )}

          <label
            className="btn-primary"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: 14,
              cursor: processingImages ? 'wait' : 'pointer',
              opacity: processingImages ? 0.6 : 1,
            }}
          >
            {processingImages ? processingText : '+ Unggah Foto'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              disabled={processingImages}
              onChange={handleImageUpload}
            />
          </label>

          <p style={{ margin: '10px 0 0', fontSize: '0.7rem', color: '#9CA3AF', lineHeight: 1.5 }}>
            JPG, PNG, atau WEBP. Maksimal 5 MB per file (gambar besar otomatis dikompres di
            browser). Klik foto untuk menjadikannya foto utama.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          marginTop: 24,
        }}
      >
        <button
          onClick={onClose}
          disabled={saving}
          style={{
            padding: '9px 18px',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            background: 'white',
            cursor: 'pointer',
            fontFamily: 'Poppins',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        >
          Batal
        </button>

        <button
          onClick={handleSave}
          disabled={saving || processingImages}
          className="btn-primary"
          style={{ padding: '9px 18px', fontSize: '0.85rem' }}
        >
          {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Produk'}
        </button>
      </div>
    </Modal>
  );
}
