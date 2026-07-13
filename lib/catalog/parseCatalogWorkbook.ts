import ExcelJS from "exceljs";

const REQUIRED_HEADERS = [
  "product_name",
  "product_type",
  "price",
  "quantity_available",
] as const;
const OPTIONAL_HEADERS = ["sku", "discount_percentage", "is_featured"] as const;
const ALL_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];

export interface RawCatalogRow {
  rowNumber: number;
  product_name?: string;
  product_type?: string;
  sku?: string;
  price?: string;
  discount_percentage?: string;
  quantity_available?: string;
  is_featured?: string;
}

// Structural failures (missing columns, unreadable file) throw — the
// caller maps that to InventoryUpload.status = "failed". Per-row problems
// are the caller's job via validateCatalogRow, not this function's.
export async function parseCatalogWorkbook(
  buffer: Buffer,
): Promise<RawCatalogRow[]> {
  const workbook = new ExcelJS.Workbook();
  // exceljs's own index.d.ts declares an ambient `Buffer extends ArrayBuffer`
  // that predates @types/node's newer generic Buffer shape and no longer
  // structurally matches it — a type-defs mismatch, not a runtime issue.
  await workbook.xlsx.load(
    buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("Workbook has no sheets");
  }

  const columnIndexByHeader = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const header = String(cell.value ?? "")
      .trim()
      .toLowerCase();
    if (header) columnIndexByHeader.set(header, colNumber);
  });

  const missingRequired = REQUIRED_HEADERS.filter(
    (header) => !columnIndexByHeader.has(header),
  );
  if (missingRequired.length > 0) {
    throw new Error(`Missing required column(s): ${missingRequired.join(", ")}`);
  }

  function get(row: ExcelJS.Row, header: string): string | undefined {
    const colNumber = columnIndexByHeader.get(header);
    if (!colNumber) return undefined;
    const value = row.getCell(colNumber).value;
    return value === null || value === undefined
      ? undefined
      : String(value).trim() || undefined;
  }

  const rows: RawCatalogRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const values = ALL_HEADERS.map((header) => get(row, header));
    if (values.every((value) => !value)) return; // skip blank rows

    rows.push({
      rowNumber,
      product_name: get(row, "product_name"),
      product_type: get(row, "product_type"),
      sku: get(row, "sku"),
      price: get(row, "price"),
      discount_percentage: get(row, "discount_percentage"),
      quantity_available: get(row, "quantity_available"),
      is_featured: get(row, "is_featured"),
    });
  });

  return rows;
}
