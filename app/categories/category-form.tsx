'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft, Settings, ListPlus, Home, Building, Users, Activity, LogOut, Layers } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import DashboardHeader from '@/components/DashboardHeader';

interface ICategoryField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
}

export default function CategoryForm({ isEdit = false, categoryId = '' }) {
  const router = useRouter();
  const pathname = usePathname();
  const [name, setName] = useState('');
  const [fields, setFields] = useState<ICategoryField[]>([]);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit && categoryId) {
      fetch(`/api/categories/${categoryId}`)
        .then(res => res.json())
        .then(data => {
          if (data.category) {
            setName(data.category.name);
            setFields(data.category.fields || []);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, categoryId]);

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        name: `field_${Date.now()}`,
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        helpText: '',
        options: []
      }
    ]);
  };

  const handleRemoveField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleUpdateField = (index: number, key: string, value: any) => {
    const newFields = [...fields];
    (newFields[index] as any)[key] = value;
    setFields(newFields);
  };

  const handleAddOption = (index: number) => {
    const newFields = [...fields];
    if (!newFields[index].options) newFields[index].options = [];
    newFields[index].options.push('New Option');
    setFields(newFields);
  };

  const handleUpdateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const newFields = [...fields];
    if (newFields[fieldIndex].options) {
      newFields[fieldIndex].options[optionIndex] = value;
    }
    setFields(newFields);
  };

  const handleRemoveOption = (fieldIndex: number, optionIndex: number) => {
    const newFields = [...fields];
    if (newFields[fieldIndex].options) {
      newFields[fieldIndex].options.splice(optionIndex, 1);
    }
    setFields(newFields);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Category Name is required');
      return;
    }

    try {
      const url = isEdit ? `/api/categories/${categoryId}` : '/api/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, fields })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(isEdit ? 'Category updated successfully!' : 'Category created successfully!');
        router.push('/categories');
      } else {
        toast.error(data.error || 'Failed to save category');
      }
    } catch (e) {
      toast.error('An error occurred while saving.');
    }
  };

  if (loading){
     return (
          <DashboardLayout>
            <DashboardHeader title="Categories" />
            <div className="flex items-center justify-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          </DashboardLayout>
        );
  }

  return (
    <DashboardLayout>
      {/* Main Form Content */}
       <DashboardHeader title="Categories" />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => router.push('/categories')}
              className="p-2 mt-1 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm group shrink-0"
              title="Back to Categories List"
            >
              <ArrowLeft size={24} className="text-gray-600 group-hover:-translate-x-1 duration-300" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Category' : 'Create Category'}</h1>
          </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="text-sm font-bold text-gray-700 uppercase mb-2 block">Category Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="e.g. Flat, Villa, Plot"
              className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 text-lg font-bold"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Custom Questions (Dynamic Fields)</h2>
          <button onClick={handleAddField} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100">
            <Plus size={18} /> Add Question
          </button>
        </div>

        <div className="space-y-6">
          {fields.map((field, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 relative">
              <button onClick={() => handleRemoveField(idx)} className="absolute top-4 right-4 text-rose-500 hover:bg-rose-50 p-2 rounded-xl"><Trash2 size={18} /></button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-10">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Question Label</label>
                  <input type="text" className="w-full mt-1 p-2 border rounded-lg" placeholder="e.g. Name" value={field.label} onChange={(e) => handleUpdateField(idx, 'label', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Input Type</label>
                  <select className="w-full mt-1 p-2 border rounded-lg" value={field.type} onChange={(e) => handleUpdateField(idx, 'type', e.target.value)}>
                    <option value="text">Short Text</option>
                    <option value="number">Number</option>
                    <option value="select">Dropdown (Single Select)</option>
                    <option value="multiselect">Multi-Select Dropdown</option>
                    <option value="radio">Radio Buttons</option>
                    <option value="checkbox">Checkbox (Yes/No toggle)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Identifier Name (Internal)</label>
                  <input type="text" className="w-full mt-1 p-2 border rounded-lg bg-gray-50" placeholder="e.g. noOfBedrooms" value={field.name} onChange={(e) => handleUpdateField(idx, 'name', e.target.value)} />
                </div> */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Placeholder text</label>
                  <input type="text" className="w-full mt-1 p-2 border rounded-lg" placeholder="e.g. Enter a number" value={field.placeholder || ''} onChange={(e) => handleUpdateField(idx, 'placeholder', e.target.value)} />
                </div>
                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-sm text-gray-700">
                    <input type="checkbox" checked={field.required} onChange={(e) => handleUpdateField(idx, 'required', e.target.checked)} className="w-4 h-4" />
                    Mandatory Field
                  </label>
                </div>
              </div>

              {['select', 'multiselect', 'radio'].includes(field.type) && (
                <div className="mt-4 p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                  <div className="flex flex-col gap-2 mb-3">
                    <label className="text-xs font-bold text-gray-500 uppercase">Manage Options</label>
                    {field.options && field.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input type="text" value={opt} onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)} className="w-full p-2 border rounded-lg" />
                        <button onClick={() => handleRemoveOption(idx, optIdx)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => handleAddOption(idx)} className="text-xs font-bold bg-white border border-gray-200 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-gray-100"><Plus size={14} /> Add Option</button>
                </div>
              )}
            </div>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-300">
              <ListPlus className="mx-auto text-gray-300 mb-3" size={32} />
              <p className="text-gray-500">No questions added to this category yet.</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={handleSave} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
            <Save size={18} /> {isEdit ? 'Update Category' : 'Save Category'}
          </button>
        </div>
      </div>
     </main>
    </DashboardLayout>
  );
}
