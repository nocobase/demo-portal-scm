export type ProductRecord = {
  id: number;
  sku: string;
  name: string;
  barcode?: string | null;
  categoryId?: number | null;
  category?: { id: number; name: string } | null;
  spec?: string | null;
  unit?: string | null;
  currentStock?: number | null;
  safetyStock?: number | null;
  status?: string | null;
  supplierId?: number | null;
  supplier?: { id: number; name: string } | null;
};

export type InventoryCountRecord = {
  id: number;
  countNo?: string | null;
  scope?: string | null;
  status?: string | null;
  countDate?: string | null;
  countBy?: string | null;
  totalItems?: number | null;
  diffCount?: number | null;
  remark?: string | null;
  createdAt?: string;
};

export type CountItemRecord = {
  id: number;
  countId?: number | null;
  productId?: number | null;
  product?: Pick<ProductRecord, "id" | "name" | "sku" | "unit"> | null;
  systemStock?: number | null;
  countedStock?: number | null;
  diffStock?: number | null;
  status?: string | null;
  remark?: string | null;
};
