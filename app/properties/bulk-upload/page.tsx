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

// Helper function to normalize boolean values for preview
const normalizeBooleanForDisplay = (value: any): string => {
  if (value === undefined || value === null || value === '') return '';
  const str = String(value).trim().toLowerCase();

  if (['1', 'yes', 'true', 'y', 'on', 'enabled', 'active'].includes(str)) return 'Yes (1)';
  if (['0', 'no', 'false', 'n', 'off', 'disabled', 'inactive'].includes(str)) return 'No (0)';

  return String(value).trim();
};

export default function BulkUploadPropertyPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<number, Record<string, string>>>({});
  const [fileName, setFileName] = useState<string>('');

  useEffect(() => {
    const loadCategories = async () => {
      setIsCategoriesLoading(true);
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
        setIsCategoriesLoading(false);
      }
    };
    loadCategories();
  }, []);

  const selectedCategoryConfig = useMemo(() => {
    if (!selectedCategory) return null;
    return categories.find((cat) => String(cat.name).toLowerCase() === String(selectedCategory).toLowerCase());
  }, [categories, selectedCategory]);

  const handleDownloadTemplate = async () => {
    if (!selectedCategory) {
      toast.error('Please select a category first.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/properties/bulk/template?category=${encodeURIComponent(selectedCategory)}`);
      if (!res.ok) {
        let errMessage = 'Failed to download template';
        try {
          const errorData = await res.json();
          errMessage = errorData?.error || errorData?.details || errMessage;
        } catch (parseErr) {
          console.warn('Template error response not JSON', parseErr);
        }
        toast.error(errMessage);
        return;
      }

      const buffer = await res.arrayBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `property_bulk_upload_${selectedCategory.replace(/\s+/g, '_').toLowerCase()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Template downloaded for ${selectedCategory}`);
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls') && !filename.endsWith('.csv')) {
      toast.error('Please upload .xlsx, .xls or .csv file.');
      return;
    }

    if (!selectedCategory) {
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

      // Show preview instead of uploading immediately
      setPreviewData(parsedRows);
      setFileName(file.name);
      setShowPreview(true);
      setUploading(false);
      event.target.value = '';
    } catch (error) {
      console.error('File processing error', error);
      toast.error('Failed to process file.');
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleConfirmUpload = async () => {
    if (!previewData.length) return;

    let uploadResult: any = null;

    try {
      setUploading(true);
      setShowPreview(false);

      // Attach category value if missing
      const rows = previewData.map((row) => row); // No need to attach category, it's in the Excel
      console.log('Rows to send:', rows);

      const res = await fetch('/api/properties/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });

      const data = await res.json();
      uploadResult = data;
      console.log('API response:', data);
      setResult(data);

      const normalizeFieldKey = (field: string): string =>
        String(field || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      const errorMap: Record<number, Record<string, string>> = {};
      (data.errors || []).forEach((item: any) => {
        if (!item?.row || !item?.errors || typeof item.errors !== 'object') return;

        const normalizedErrors: Record<string, string> = {};
        Object.entries(item.errors).forEach(([field, message]) => {
          const key = normalizeFieldKey(field);
          const lowerField = String(field || '').toLowerCase();

          normalizedErrors[key] = String(message || '');
          normalizedErrors[lowerField] = String(message || '');

          // Keep both shorthand and expanded forms to match any preview key style
          if (key.endsWith('title')) {
            normalizedErrors['propertytitle'] = normalizedErrors[key];
          }
          if (key === 'status' || key === 'availability' || key === 'isavailable') {
            normalizedErrors['isavailable'] = normalizedErrors[key];
          }

          if (field.toLowerCase().includes('category')) {
            normalizedErrors['category'] = normalizedErrors[key];
          }
        });

        errorMap[item.row] = {
          ...(errorMap[item.row] || {}),
          ...normalizedErrors,
        };
      });
      setRowErrors(errorMap);

      if (!res.ok) {
        toast.error(data.error || 'Upload failed.');
      } else {
        const successCount = data.inserted || 0;
        const failCount = data.failed || 0;

        if (successCount > 0) {
          toast.success(`Upload complete: ${successCount} inserted, ${failCount} failed.`);
        } else {
          toast.error(`Upload failed: ${failCount} errors found.`);
        }

        if (failCount > 0) {
          toast.error('Please check the error details below and download the error report for corrections.');
          setShowPreview(true); // keep preview showing to highlight in table
        } else {
          setShowPreview(false);
          setPreviewData([]);
          setFileName('');
        }
      }
    } catch (error) {
      console.error('Upload error', error);
      toast.error('Failed to process upload.');
    } finally {
      setUploading(false);
      // preserve preview when user has validation errors
      if (!uploadResult?.failed || uploadResult?.failed <= 0) {
        setPreviewData([]);
        setFileName('');
      }
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreviewData([]);
    setFileName('');
  };

  const downloadErrorReport = () => {
    if (!result?.errors?.length) {
      toast.error('No errors to download.');
      return;
    }

    try {
      const errorData = (result.errors || []).map((error: any) => {
        const rowObj: Record<string, any> = { 'Row Number': error.row };
        if (error.errors && typeof error.errors === 'object') {
          Object.entries(error.errors).forEach(([field, msg]) => {
            rowObj[field] = msg;
          });
        } else if (Array.isArray(error.errors)) {
          rowObj['Error'] = error.errors.join(', ');
        } else if (typeof error.error === 'string') {
          rowObj['Error'] = error.error;
        }
        return rowObj;
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(errorData);
      XLSX.utils.book_append_sheet(wb, ws, 'Errors');

      XLSX.writeFile(wb, 'bulk_upload_errors.xlsx');
      toast.success('Error report downloaded');
    } catch (error) {
      console.error('Error report generation failed:', error);
      toast.error('Failed to generate error report');
    }
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="flex flex-col">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Select Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-12 p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isCategoriesLoading}
                >
                  <option value="">
                    {isCategoriesLoading ? 'Loading categories...' : 'Choose category'}
                  </option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1 h-5">
                  {selectedCategoryConfig
                    ? `Template will include ${selectedCategoryConfig.fields?.length || 0} category-specific fields`
                    : ''}
                </p>
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full h-12 inline-flex items-center justify-center gap-2 px-4 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                  disabled={!selectedCategory || loading || isCategoriesLoading}
                >
                  <Download size={16} /> Download Template
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload Filled Template</h3>
                <p className="text-sm text-gray-600">Upload your completed Excel/CSV file (.xlsx, .xls, .csv)</p>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="block w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={uploading || showPreview}
              />
            </div>

            {uploading && (
              <div className="text-sm text-blue-600">Processing upload, please wait...</div>
            )}

            {showPreview && previewData.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">File Preview</h3>
                    <p className="text-sm text-blue-700">File: {fileName} | Rows: {previewData.length}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelPreview}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmUpload}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Confirm Upload'}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-blue-200">
                    <thead className="bg-blue-100">
                      <tr>
                        {Object.keys(previewData[0] || {}).map((key) => (
                          <th
                            key={key}
                            className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-blue-200">
                      {previewData.slice(0, 5).map((row, index) => {
                        const rowNumber = index + 1;
                        const rowIssue = rowErrors[rowNumber] || {};
                        const rowHasError = Object.keys(rowIssue).length > 0;

                        const normalizeFieldKey = (field: string): string =>
                          String(field || '').toLowerCase().replace(/[^a-z0-9]/g, '');

                        const rowErrorSummary = Object.entries(rowIssue)
                          .map(([field, message]) => `${field}: ${message}`)
                          .join(' | ');

                        return (
                          <React.Fragment key={`preview-row-${rowNumber}`}>
                            <tr
                              className={`${rowHasError ? 'bg-rose-50' : ''} hover:bg-blue-25`}
                            >
                              {Object.keys(row).map((key) => {
                                const rawValue = String(row[key] || '');
                                let displayValue = rawValue;
                                let isBooleanField = false;

                                const lowerKey = key.toLowerCase();
                                if (['isavailable', 'available', 'sitevisitallowed', 'sitevisit', 'vastucomplaint', 'vastu'].includes(lowerKey)) {
                                  const normalized = normalizeBooleanForDisplay(row[key]);
                                  if (normalized !== rawValue) {
                                    displayValue = `${rawValue} → ${normalized}`;
                                    isBooleanField = true;
                                  }
                                }

                                const keyNorm = normalizeFieldKey(key);
                                const cellErrorKey = rowIssue[keyNorm] || rowIssue[lowerKey] || rowIssue[lowerKey.replace(/\s|_|-/g, '')];
                                const fuzzyError = Object.entries(rowIssue).find(([errKey]) => {
                                  const normalizedErrKey = normalizeFieldKey(errKey);
                                  return normalizedErrKey === keyNorm || keyNorm.includes(normalizedErrKey) || normalizedErrKey.includes(keyNorm);
                                });
                                const cellError = cellErrorKey || (fuzzyError ? fuzzyError[1] : undefined);
                                const cellClass = cellError ? 'bg-rose-200 text-rose-800 font-semibold' : isBooleanField ? 'text-blue-700 font-medium' : 'text-gray-900';

                                return (
                                  <td
                                    key={key}
                                    className={`px-3 py-2 text-sm max-w-xs truncate ${cellClass}`}
                                    title={cellError ? `${cellError}` : displayValue}
                                  >
                                    {displayValue}
                                    {cellError && <div className="text-xs text-rose-700">{cellError}</div>}
                                  </td>
                                );
                              })}
                            </tr>
                            {rowHasError && (
                              <tr key={`${index}-error`}>
                                <td colSpan={Object.keys(row).length} className="px-3 py-2 text-xs text-rose-800 bg-rose-100">
                                  <strong>Row {rowNumber} errors:</strong> {rowErrorSummary}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {previewData.length > 5 && (
                        <tr>
                          <td
                            colSpan={Object.keys(previewData[0] || {}).length}
                            className="px-3 py-2 text-sm text-blue-600 italic text-center"
                          >
                            ... and {previewData.length - 5} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-xs text-blue-600">
                  <p>Showing first 5 rows of {previewData.length} total rows.</p>
                  <p className="mt-1"><strong>Boolean fields</strong> (highlighted in blue) show how values will be normalized: &ldquo;Yes&rdquo; → &ldquo;Yes (1)&rdquo;, &ldquo;No&rdquo; → &ldquo;No (0)&rdquo;, etc.</p>
                  <p className="mt-1">Click &ldquo;Confirm Upload&rdquo; to proceed.</p>
                </div>
              </div>
            )}

            {result && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-800">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>{result.inserted || 0} rows imported successfully.</span>
                    {result.failed > 0 && (
                      <span className="text-rose-500">{result.failed || 0} rows failed.</span>
                    )}
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
                {result?.errors?.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                    <p className="text-sm font-bold text-rose-700">Failed Rows</p>
                    <ul className="text-xs text-rose-600 list-disc pl-5 mt-2 max-h-52 overflow-auto">
                      {result.errors.slice(0, 20).map((item: any, idx: number) => {
                        let message = '';
                        if (Array.isArray(item.errors)) {
                          message = item.errors.join(', ');
                        } else if (item.errors && typeof item.errors === 'object') {
                          message = Object.entries(item.errors)
                            .map(([field, value]) => `${field}: ${value}`)
                            .join(', ');
                        } else {
                          message = String(item.errors || 'Unknown error');
                        }

                        return (
                          <li key={idx}>Row {item.row}: {message}</li>
                        );
                      })}
                    </ul>
                    {result.errors.length > 20 && (
                      <p className="text-xs text-rose-500 mt-2">Only first 20 shown, download full report using button above.</p>
                    )}
                  </div>
                )} 
                {/* {result.errors?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Error Details:</p>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-2 py-1 text-left">Row</th>
                            <th className="px-2 py-1 text-left">Field</th>
                            <th className="px-2 py-1 text-left">Wrong Value</th>
                            <th className="px-2 py-1 text-left">Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.errors.slice(0, 10).map((error: any, idx: number) => (
                            <tr key={idx} className="border-t border-gray-200">
                              <td className="px-2 py-1">{error.row}</td>
                              <td className="px-2 py-1 font-medium">
                                {error.field || (error.errors && Object.keys(error.errors).join(', ')) || 'N/A'}
                              </td>
                              <td className="px-2 py-1 text-red-600">
                                {error.value || (error.errors && Object.values(error.errors).join(', ')) || 'N/A'}
                              </td>
                              <td className="px-2 py-1 text-red-600">
                                {error.error || (error.errors && Object.values(error.errors).join(', ')) || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {result.errors.length > 10 && (
                      <p className="text-xs text-gray-500 mt-2">Showing first 10 errors. Download full report for complete details.</p>
                    )}
                  </div>
                )} */}
              </div>
            )}

            <div className="text-xs text-gray-500">
              <strong>How it works:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Upload your Excel/CSV file to see a preview of the data before uploading</li>
                <li>Review the preview table and confirm upload when ready</li>
                <li><strong>Required fields:</strong> title, category, listingPurpose, city, locality, priceType</li>
                <li><strong>Pricing:</strong> pricingType=fixed requires price, pricingType=range requires minPrice/maxPrice</li>
                <li><strong>Boolean fields</strong> (Yes/No, Available/Not Available, etc.) accept: <code className="bg-gray-100 px-1 rounded">1/0</code>, <code className="bg-gray-100 px-1 rounded">Yes/No</code>, <code className="bg-gray-100 px-1 rounded">True/False</code>, <code className="bg-gray-100 px-1 rounded">On/Off</code></li>
                <li><strong>Assigned Agent:</strong> Must match team member name/email</li>
                <li><strong>Dynamic fields:</strong> For selected category appear in template</li>
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
        </div>
      </main>
    </DashboardLayout>
  );
}
