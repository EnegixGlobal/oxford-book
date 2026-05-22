import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/middleware/auth';
import Book from '@/models/Book';
import * as XLSX from 'xlsx';

// helper to make a URL-safe slug (same rules as main books route)
const makeSlug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

async function generateUniqueSlug(base: string) {
  let slug = base;
  let attempt = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await Book.exists({ slug });
    if (!exists) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

type CsvRow = Record<string, string>;

// Very small CSV parser that supports quoted fields and commas inside quotes
function parseCsvWithHeader(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];

  const splitLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current);
    return cells;
  };

  const headerCells = splitLine(lines[0]).map((h) => h.trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    if (cells.every((c) => !c.trim())) continue;
    const row: CsvRow = {};
    headerCells.forEach((header, idx) => {
      row[header] = (cells[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return rows;
}

const toBool = (value: string | undefined): boolean => {
  if (!value) return false;
  const v = value.toString().trim().toLowerCase();
  return v === 'yes' || v === 'true' || v === '1';
};

function parseXlsx(buffer: ArrayBuffer): CsvRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as CsvRow[];
  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult) return authResult;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'CSV file is required (export from Excel as CSV)' },
        { status: 400 }
      );
    }

    const fileName = (file.name || '').toLowerCase();
    const isXlsx =
      fileName.endsWith('.xlsx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const isCsv = fileName.endsWith('.csv') || file.type === 'text/csv';

    if (!isCsv && !isXlsx) {
      return NextResponse.json(
        { success: false, message: 'Unsupported file type. Please upload a CSV or XLSX file.' },
        { status: 400 }
      );
    }

    let rows: CsvRow[] = [];
    if (isXlsx) {
      const buffer = await file.arrayBuffer();
      rows = parseXlsx(buffer);
    } else {
      const text = await file.text();
      rows = parseCsvWithHeader(text);
    }

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: 'CSV seems to be empty or has no data rows' },
        { status: 400 }
      );
    }

    await connectDB();

    let createdCount = 0;
    const failed: { row: number; reason: string }[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];

      const title = row.title || row['Title'];
      const author = row.author || row['author'];
      const isbn = row.isbn || row['ISBN'];
      const mrpStr = row.mrp || row['mrp'];
      const discountedStr = row.discountedPrice || row['discountedPrice'];
      const stockStr = row.stock || row['stock'];

      if (!title || !author || !isbn || !mrpStr || !discountedStr) {
        failed.push({ row: index + 2, reason: 'Missing required fields (title, author, isbn, mrp, discountedPrice)' });
        continue;
      }

      // Ensure ISBN uniqueness
      const existingIsbn = await Book.findOne({ isbn }).lean();
      if (existingIsbn) {
        failed.push({ row: index + 2, reason: `ISBN already exists: ${isbn}` });
        continue;
      }

      const mrp = Number(mrpStr);
      const discountedPrice = Number(discountedStr);
      const stock = Number(stockStr || '0');
      const discount = Number(row.discount || row['discount'] || '0');

      if (Number.isNaN(mrp) || Number.isNaN(discountedPrice)) {
        failed.push({ row: index + 2, reason: 'Invalid number in mrp or discountedPrice' });
        continue;
      }

      const categoryName = row.category || row['category'] || '';
      if (!categoryName) {
        failed.push({ row: index + 2, reason: 'Category is required' });
        continue;
      }

      const subcategoryName = (row.subcategory || row['subcategory'] || row['Subcategory'] || '').trim();
      const ageGroupName = (row.ageGroup || row['ageGroup'] || row['AgeGroup'] || '').trim();
      const genreName = (row.genre || row['genre'] || row['Genre'] || '').trim();

      const categorySlug = makeSlug(categoryName);
      const subcategorySlug = subcategoryName && subcategoryName.length > 0 ? makeSlug(subcategoryName) : undefined;
      const ageGroupSlug = ageGroupName ? makeSlug(ageGroupName) : undefined;
      const genreSlug = genreName ? makeSlug(genreName) : undefined;

      const description = row.description || row['description'] || '';
      const coverImage = row.coverImage || row['coverImage'] || '';
      const publisher = row.publisher || row['publisher'] || '';
      const rawBinding = (row.binding || row['binding'] || '').trim().toLowerCase();
      let binding: 'paperback' | 'hardcover' | 'digital' = 'paperback';
      if (rawBinding.includes('hard')) {
        binding = 'hardcover';
      } else if (rawBinding.includes('digital') || rawBinding.includes('ebook') || rawBinding.includes('pdf') || rawBinding.includes('epub')) {
        binding = 'digital';
      } else {
        binding = 'paperback';
      }
      const language = row.language || row['language'] || '';

      const featured = toBool(row.featured || row['featured'] || row['Featured']);
      const anticipated = toBool(row.anticipated || row['anticipated'] || row['Anticipated']);
      const newRelease = toBool(row.newRelease || row['newRelease'] || row['NewRelease']);
      const awardWinner = toBool(row.awardWinner || row['awardWinner'] || row['AwardWinner']);
      const schoolLibrary = toBool(row.schoolLibrary || row['schoolLibrary'] || row['SchoolLibrary']);

      const baseSlug = makeSlug(title);
      const uniqueSlug = await generateUniqueSlug(baseSlug);

      try {
        await Book.create({
          title,
          slug: uniqueSlug,
          authorName: author,
          description: description.trim() || undefined,
          coverImage: coverImage && coverImage !== '{}' ? coverImage : undefined,
          categorySlug,
          subcategorySlug,
          ageGroup: ageGroupSlug,
          genre: genreSlug,
          stock: stock || 0,
          inStock: (stock || 0) > 0,
          mrp,
          discountedPrice,
          discount: discount || 0,
          isbn,
          publisher,
          binding,
          language,
          featured,
          anticipated,
          newRelease,
          awardWinner,
          schoolLibrary,
        });
        createdCount += 1;
      } catch (err: any) {
        failed.push({ row: index + 2, reason: err?.message || 'Failed to create book' });
      }
    }

    return NextResponse.json({
      success: true,
      createdCount,
      failedCount: failed.length,
      failed,
    });
  } catch (error) {
    console.error('Admin books bulk POST error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}


