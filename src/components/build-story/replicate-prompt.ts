// Prompt that lets a visitor rebuild this app from scratch with their own
// coding agent. Derived from the live data model, pages and workflows of
// this portal, so it describes what the app actually is.
// English only - it is meant to be pasted into a coding agent.

export function buildReplicatePrompt() {
  return `Build a "Stock Count Scanner" app on NocoBase with your coding agent.

What it is: a barcode-driven stocktake companion: scan a product, enter the counted quantity, and watch progress against an open inventory count.

Data model (collection - purpose; key fields):
  scm_inventory_count_items - one counted line inside a stocktake
      fields: status (pending|counted|resolved), countedStock, count_id, remark, product_id, diffStock, systemStock
      relations: count -> scm_inventory_counts, product -> scm_products
  scm_inventory_counts - inventory counts
      fields: status (draft|in_progress|completed|cancelled), scope (all|category|product), countBy, countNo, status_sort, diffCount, totalItems, remark, countDate
      relations: items -> scm_inventory_count_items
  scm_products - products
      fields: unit (piece|box|case|kg|meter), status (on_sale|stopped|new), category_id, remark, safetyStock, purchasePrice, barcode, supplier_id, salePrice
      relations: category -> scm_product_categories, supplier -> scm_suppliers
  scm_stock_movements - stock movements
      fields: type (purchase_in|sale_out|return_in|adjustment|loss), remark, afterStock, product_id, referenceNo, occurredAt, quantity, beforeStock, handler
      relations: product -> scm_products

Pages:
  /counts, /progress, /scan
  Each resource page is a list with search/filter plus create, edit and detail dialogs.

Seed data: about 138 rows in total, e.g. scm_inventory_count_items ~84, scm_stock_movements ~25, scm_products ~18.
Keep every seeded value in English.

Build in this order: data model -> pages -> workflows -> roles/permissions -> seed data.
After each page, open it and confirm it renders and its create/edit dialogs work before moving on.`;
}
