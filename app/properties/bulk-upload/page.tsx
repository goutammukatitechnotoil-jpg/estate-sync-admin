'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Download, UploadCloud, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHeader from '@/components/DashboardHeader';

const COMMON_HEADERS = [
  'title',
  'category',
  'listingPurpose',
  'pricingType',
  'price',
  'minPrice',
  'maxPrice',
  'priceType',
  'city',
  'locality',
  'address',
  'mapLink',
  'propertyArea',
  'bhkType',
  'furnishingStatus',
  'propertyAge',
  'facingDirection',
  'highlights',
  'amenities',
  'imageUrls',
  'videoUrls',
  'documentUrls',
  'videoTourLink',
  'isAvailable',
  'assignedAgent',
  'siteVisitAllowed',
  'visitTimings',
  'propertyDescription',
  'vastuComplaint',
];

const buildTemplateRows = (category: any): any[] => {
  if (!category) {
    return [Object.fromEntries(COMMON_HEADERS.map((h) => [h, '']))];
  }
  const dynamic = Array.isArray(category.fields)
    ? category.fields.map((f: any) => (f.label ? f.label : f.name))
    : [];
  const headers = [...COMMON_HEADERS, ...dynamic];
  return [Object.fromEntries(headers.map((h) => [h, '']))];
};

const parseCSV = (workbook: XLSX.WorkBook) => {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  // Normalize keys to lowercase to match our expected format
  return json.map(row => {
    const normalizedRow: Record<string, any> = {};
    Object.keys(row).forEach(key => {
      normalizedRow[key.toLowerCase()] = row[key];
    });
    return normalizedRow;
  });
};

export default function BulkUploadPropertyPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/categories?status=active');
        const data = await res.json();
        if (res.ok) {
          setCategories(data.categories || []);
        } else {
          toast.error(data.error || 'Failed to fetch categories.');
        }
      } catch (e) {
        toast.error('Failed to fetch categories.');
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const selectedCategoryConfig = useMemo(() => {
    if (!selectedCategory) return null;
    return categories.find((cat) => String(cat.name).toLowerCase() === String(selectedCategory).toLowerCase());
  }, [categories, selectedCategory]);

  const handleDownloadTemplate = () => {
    if (!selectedCategory || !selectedCategoryConfig) {
      toast.error('Please select a category first.');
      return;
    }

    const dynamicHeaders = Array.isArray(selectedCategoryConfig.fields)
      ? selectedCategoryConfig.fields.map((f: any) => (f.label ? f.label : f.name))
      : [];

    const headers = [...COMMON_HEADERS, ...dynamicHeaders];
    const templateRow = headers.reduce((acc, h) => ({ ...acc, [h]: '' }), {} as any);
    const ws = XLSX.utils.json_to_sheet([templateRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `property-template-${selectedCategory.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
    toast.success('Template downloaded.');
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls') && !filename.endsWith('.csv')) {
      toast.error('Please upload .xlsx, .xls or .csv file.');
      return;
    }

    if (!selectedCategory || !selectedCategoryConfig) {
      toast.error('Please select a category before uploading.');
      return;
    }

    try {
      setUploading(true);
      console.log('Processing file:', file.name);
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const parsedRows = parseCSV(workbook);
      console.log('Parsed rows:', parsedRows);
      console.log('First row keys:', parsedRows[0] ? Object.keys(parsedRows[0]) : 'No rows');

      if (!Array.isArray(parsedRows) || parsedRows.length === 0) {
        toast.error('No rows found in uploaded file.');
        setUploading(false);
        return;
      }

      // Attach category value if missing
      const rows = parsedRows.map((row) => ({ ...row, category: row.category || selectedCategory }));
      console.log('Rows to send:', rows);

      const res = await fetch('/api/properties/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      const data = await res.json();
      console.log('API response:', data);
      setResult(data);

      if (!res.ok) {
        toast.error(data.error || 'Upload failed.');
      } else {
        const successCount = data.inserted || 0;
        const failCount = data.failed || 0;
        toast.success(`Upload complete: ${successCount} inserted, ${failCount} failed.`);
      }
    } catch (error) {
      console.error('Upload error', error);
      toast.error('Failed to process upload.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const downloadErrorReport = () => {
    if (!result?.errors?.length) {
      toast.error('No errors to download.');
      return;
    }

    // Collect all unique keys from error data to ensure consistent structure
    const allKeys = new Set<string>();
    allKeys.add('row');
    allKeys.add('errors');
    result.errors.forEach((item: any) => {
      if (item.data) {
        Object.keys(item.data).forEach(key => allKeys.add(key));
      }
    });

    // Create rows with all keys to prevent duplicate headers
    const rows = result.errors.map((item: any) => {
      const row: any = {
        row: item.row,
        errors: (item.errors || []).join(' | '),
      };
      allKeys.forEach(key => {
        if (!['row', 'errors'].includes(key)) {
          row[key] = item.data?.[key] ?? '';
        }
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errors');
    XLSX.writeFile(wb, 'property-upload-errors.xlsx');
    toast.success('Error report downloaded.');
  };

  return (
    <DashboardLayout>
      <DashboardHeader title="Bulk Upload Properties" />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push('/properties')}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm group shrink-0"
              title="Back to Properties List"
            >
              <ArrowLeft size={20} className="text-gray-600 group-hover:-translate-x-1 duration-300" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Bulk Upload via Excel/CSV</h2>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Select Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  <option value="">Choose category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                  disabled={!selectedCategory || loading}
                >
                  <Download size={16} /> Download Template
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <p className="text-sm text-gray-500 mb-2">Upload filled template (.xlsx, .xls, .csv):</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="block w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-3"
                disabled={uploading}
              />
            </div>

            {uploading && (
              <div className="text-sm text-blue-600">Processing upload, please wait...</div>
            )}

            {result && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-gray-800 mb-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>{result.inserted || 0} rows imported.</span>
                  <span className="text-rose-500">{result.failed || 0} rows failed.</span>
                </div>
                {result.failed > 0 && (
                  <button
                    onClick={downloadErrorReport}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700"
                  >
                    <AlertCircle size={14} /> Download Error Report
                  </button>
                )}
              </div>
            )}

            <div className="text-xs text-gray-500">
              Template fields:
              <ul className="list-disc pl-5 mt-1">
                <li>Required: title, category, listingPurpose, city, locality, priceType</li>
                <li>Pricing controls: pricingType=fixed requires price, pricingType=range requires minPrice/maxPrice</li>
                <li>Assigned Agent must match team member name/email.</li>
                <li>Dynamic fields upto selected category appear in template.</li>
              </ul>
            </div>
          </div>

          {selectedCategoryConfig && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-2">Category Dynamic Fields - {selectedCategoryConfig.name}</h3>
              {selectedCategoryConfig.fields?.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                  {selectedCategoryConfig.fields.map((field: any) => (
                    <div key={field.name} className="p-2 border border-gray-100 rounded-lg">
                      <p className="font-semibold">{field.label || field.name}</p>
                      <p className="text-xs text-gray-500">{field.type} {field.required ? '(required)' : '(optional)'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No dynamic fields configured for this category.</p>
              )}
            </div>
          )}

          {result?.errors?.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <p className="text-sm font-bold text-rose-700">Failed Rows</p>
              <ul className="text-xs text-rose-600 list-disc pl-5 mt-2 max-h-52 overflow-auto">
                {result.errors.slice(0, 20).map((item: any, idx: number) => (
                  <li key={idx}>Row {item.row}: {item.errors.join(', ')}</li>
                ))}
              </ul>
              {result.errors.length > 20 && (
                <p className="text-xs text-rose-500 mt-2">Only first 20 shown, download full report using button above.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
