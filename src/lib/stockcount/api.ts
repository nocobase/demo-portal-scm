import type { DataProvider } from "@refinedev/core";

import type {
  CountItemRecord,
  InventoryCountRecord,
  ProductRecord,
} from "./types";

const PAGE_SIZE = 200;

export async function findProductByCode(
  dataProvider: DataProvider,
  code: string
): Promise<ProductRecord | undefined> {
  const trimmed = code.trim();
  if (!trimmed) return undefined;

  const byBarcode = await dataProvider.getList<ProductRecord>({
    resource: "scm_products",
    pagination: { mode: "server", currentPage: 1, pageSize: 1 },
    filters: [{ field: "barcode", operator: "eq", value: trimmed }],
    meta: { appends: ["category"] },
  });
  if (byBarcode.data.length > 0) return byBarcode.data[0];

  const bySku = await dataProvider.getList<ProductRecord>({
    resource: "scm_products",
    pagination: { mode: "server", currentPage: 1, pageSize: 1 },
    filters: [{ field: "sku", operator: "eq", value: trimmed }],
    meta: { appends: ["category"] },
  });
  return bySku.data[0];
}

export async function getActiveCount(
  dataProvider: DataProvider,
  storedId?: string | null
): Promise<InventoryCountRecord | undefined> {
  if (storedId) {
    try {
      const response = await dataProvider.getOne<InventoryCountRecord>({
        resource: "scm_inventory_counts",
        id: storedId,
      });
      if (response.data) return response.data;
    } catch {
      // stored count may have been removed; fall through
    }
  }

  const response = await dataProvider.getList<InventoryCountRecord>({
    resource: "scm_inventory_counts",
    pagination: { mode: "server", currentPage: 1, pageSize: 1 },
    filters: [{ field: "status", operator: "eq", value: "in_progress" }],
    sorters: [{ field: "createdAt", order: "desc" }],
  });
  return response.data[0];
}

export async function getCountItems(
  dataProvider: DataProvider,
  countId: number | string
): Promise<CountItemRecord[]> {
  const response = await dataProvider.getList<CountItemRecord>({
    resource: "scm_inventory_count_items",
    pagination: { mode: "server", currentPage: 1, pageSize: PAGE_SIZE },
    filters: [{ field: "count_id", operator: "eq", value: countId }],
    sorters: [{ field: "id", order: "asc" }],
    meta: { appends: ["product"] },
  });
  return response.data;
}

export async function getCountItem(
  dataProvider: DataProvider,
  countId: number | string,
  productId: number | string
): Promise<CountItemRecord | undefined> {
  const response = await dataProvider.getList<CountItemRecord>({
    resource: "scm_inventory_count_items",
    pagination: { mode: "server", currentPage: 1, pageSize: 1 },
    filters: [
      { field: "count_id", operator: "eq", value: countId },
      { field: "product_id", operator: "eq", value: productId },
    ],
    meta: { appends: ["product"] },
  });
  return response.data[0];
}

export async function saveCountedStock(
  dataProvider: DataProvider,
  itemId: number | string,
  countedStock: number | null
): Promise<void> {
  await dataProvider.update({
    resource: "scm_inventory_count_items",
    id: itemId,
    variables: {
      countedStock,
      status: countedStock === null ? "pending" : "counted",
    },
  });
}

export async function addItemToCount(
  dataProvider: DataProvider,
  countId: number | string,
  product: ProductRecord,
  locale?: string
): Promise<CountItemRecord> {
  const response = await dataProvider.create<CountItemRecord>({
    resource: "scm_inventory_count_items",
    variables: {
      count: { id: countId },
      product: { id: product.id },
      systemStock: Number(product.currentStock ?? 0),
      countedStock: null,
      diffStock: 0,
      status: "pending",
      remark: locale?.startsWith("zh")
        ? "现场扫码补充"
        : "Added by on-site scan",
    },
  });
  return response.data;
}

export async function completeCount(
  dataProvider: DataProvider,
  countId: number | string,
  locale?: string
): Promise<void> {
  const items = await getCountItems(dataProvider, countId);

  let diffCount = 0;
  for (const item of items) {
    const systemStock = Number(item.systemStock ?? 0);
    const countedStock = Number(item.countedStock ?? systemStock);
    const diff = countedStock - systemStock;
    if (diff !== 0) diffCount += 1;

    if (item.status === "resolved") continue;

    if (diff !== 0 && item.productId) {
      await dataProvider.update({
        resource: "scm_products",
        id: item.productId,
        variables: { currentStock: countedStock },
      });
      await dataProvider.create({
        resource: "scm_stock_movements",
        variables: {
          product: { id: item.productId },
          type: "adjustment",
          quantity: Math.abs(diff),
          beforeStock: systemStock,
          afterStock: countedStock,
          referenceNo: locale?.startsWith("zh")
            ? `盘点单#${countId}`
            : `Stocktake#${countId}`,
          handler: locale?.startsWith("zh")
            ? "盘点调整"
            : "Stocktake adjustment",
          occurredAt: new Date().toISOString(),
          remark: locale?.startsWith("zh")
            ? `盘点差异 ${diff > 0 ? "+" : ""}${diff}`
            : `Stocktake variance ${diff > 0 ? "+" : ""}${diff}`,
        },
      });
    }

    await dataProvider.update({
      resource: "scm_inventory_count_items",
      id: item.id,
      variables: {
        countedStock,
        diffStock: diff,
        status: "resolved",
      },
    });
  }

  await dataProvider.update({
    resource: "scm_inventory_counts",
    id: countId,
    variables: {
      status: "completed",
      totalItems: items.length,
      diffCount,
    },
  });
}

export async function createFullStocktake(
  dataProvider: DataProvider,
  countBy?: string,
  locale?: string
): Promise<InventoryCountRecord> {
  const products = await fetchAllProducts(dataProvider);
  const countResponse = await dataProvider.create<InventoryCountRecord>({
    resource: "scm_inventory_counts",
    variables: {
      scope: "all",
      status: "in_progress",
      countDate: new Date().toISOString().slice(0, 10),
      countBy:
        countBy || (locale?.startsWith("zh") ? "移动盘点" : "Mobile stocktake"),
      remark: locale?.startsWith("zh") ? "手机端创建" : "Created from mobile",
      totalItems: 0,
      diffCount: 0,
    },
  });
  const count = countResponse.data;

  if (products.length > 0) {
    await Promise.all(
      products.map((product) =>
        dataProvider.create({
          resource: "scm_inventory_count_items",
          variables: {
            count: { id: count.id },
            product: { id: product.id },
            systemStock: Number(product.currentStock ?? 0),
            countedStock: null,
            diffStock: 0,
            status: "pending",
            remark: null,
          },
        })
      )
    );
  }

  if (products.length !== Number(count.totalItems ?? 0)) {
    await dataProvider.update({
      resource: "scm_inventory_counts",
      id: count.id,
      variables: { totalItems: products.length },
    });
  }

  return count;
}

async function fetchAllProducts(
  dataProvider: DataProvider
): Promise<Array<{ id: number; currentStock?: number }>> {
  const products: Array<{ id: number; currentStock?: number }> = [];
  let page = 1;
  for (;;) {
    const response = await dataProvider.getList<{ id: number; currentStock?: number }>({
      resource: "scm_products",
      pagination: { mode: "server", currentPage: page, pageSize: PAGE_SIZE },
      meta: { fields: ["id", "currentStock"] },
    });
    products.push(...response.data);
    if (response.total <= page * PAGE_SIZE) break;
    page += 1;
  }
  return products;
}
