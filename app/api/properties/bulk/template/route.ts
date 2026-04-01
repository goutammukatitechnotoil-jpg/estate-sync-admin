import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/lib/models/Category';
import TeamMember from '@/lib/models/TeamMember';
import Property from '@/lib/models/Property';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
  validation?: string;
}

// Standard fields that are always included
const getStandardFields = (): TemplateField[] => [
  { name: 'title', label: 'Property Title', type: 'text', required: true },
  { name: 'category', label: 'Category', type: 'select', required: true },
  { name: 'listingPurpose', label: 'Listing Purpose', type: 'select', required: true, options: ['For Sale', 'For Rent'] },
  { name: 'pricingType', label: 'Pricing Type', type: 'select', required: true, options: ['fixed', 'range'] },
  { name: 'price', label: 'Price (₹)', type: 'number', required: false, validation: 'For fixed pricing' },
  { name: 'minPrice', label: 'Min Price (₹)', type: 'number', required: false, validation: 'For range pricing' },
  { name: 'maxPrice', label: 'Max Price (₹)', type: 'number', required: false, validation: 'For range pricing' },
  { name: 'priceType', label: 'Price Type', type: 'select', required: true, options: ['Total Price', 'Price per Sq.Ft'] },
  { name: 'city', label: 'City', type: 'select', required: true },
  { name: 'locality', label: 'Locality', type: 'text', required: true },
  { name: 'address', label: 'Address', type: 'text', required: false },
  { name: 'mapLink', label: 'Google Maps Link', type: 'text', required: false },
  { name: 'area', label: 'Area (Sq.Ft)', type: 'number', required: false },
  { name: 'furnishing', label: 'Furnishing Status', type: 'select', required: false, options: ['Furnished', 'Semi-Furnished', 'Unfurnished'] },
  { name: 'propertyAge', label: 'Property Age', type: 'select', required: false, options: ['Under Construction', 'New (0–1 years)', '1–5 years', '5–10 years', '10+ years'] },
  { name: 'facing', label: 'Facing Direction', type: 'select', required: false, options: ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'] },
  { name: 'highlights', label: 'Highlights (comma-separated)', type: 'text', required: false },
  { name: 'amenities', label: 'Amenities (comma-separated)', type: 'text', required: false },
  { name: 'images', label: 'Image URLs (comma-separated)', type: 'text', required: false },
  { name: 'videos', label: 'Video URLs (comma-separated)', type: 'text', required: false },
  { name: 'documents', label: 'Document URLs (comma-separated)', type: 'text', required: false },
  { name: 'videoLink', label: 'Video Tour Link', type: 'text', required: false },
  { name: 'availability', label: 'Is Available', type: 'boolean', required: true },
  { name: 'assignedAgent', label: 'Assigned Agent', type: 'select', required: false },
  { name: 'siteVisitAllowed', label: 'Site Visit Allowed', type: 'boolean', required: false },
  { name: 'visitTimings', label: 'Visit Timings', type: 'text', required: false },
];

// Category-specific fields - now fetched from database instead of hardcoded
const getCategorySpecificFields = async (categoryName: string): Promise<TemplateField[]> => {
  try {
    // Fetch category configuration from database (same as Property Form)
    const categories = await Category.find({ status: 1 }).select('name fields').lean();

    const category = categories.find(cat =>
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!category || !Array.isArray(category.fields)) {
      return [{ name: 'vastuComplaint', label: 'Vastu Complaint', type: 'boolean', required: false }];
    }

    // Convert category fields to TemplateField format
    const fields: TemplateField[] = category.fields.map((field: any) => ({
      name: field.name,
      label: field.label,
      type: field.type === 'multiselect' ? 'text' : field.type, // Convert multiselect to text for Excel
      required: field.required || false,
      options: Array.isArray(field.options) ? field.options : undefined,
      validation: field.placeholder || undefined
    }));

    // Add vastu complaint for all categories
    fields.push({ name: 'vastuComplaint', label: 'Vastu Complaint', type: 'boolean', required: false });

    return fields;
  } catch (error) {
    console.error('Error fetching category fields:', error);
    return [{ name: 'vastuComplaint', label: 'Vastu Complaint', type: 'boolean', required: false }];
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryName = searchParams.get('category');

    console.log('Template generation request:', { categoryName });

    await connectDB();

    // Fetch categories
    const categories = await Category.find({ status: 1 }).select('name fields').lean();
    console.log('Found categories:', categories.length);

    // Fetch team members (agents)
    let teamMembers: any[] = [];
    try {
      teamMembers = await TeamMember.find({ status: 'Active' })
        .populate('role', 'name')
        .select('fullName email')
        .lean();
      console.log('Found team members:', teamMembers.length);
    } catch (error) {
      console.log('Error fetching team members, using default agents:', error);
      teamMembers = [{ fullName: 'Default Agent', email: 'agent@example.com' }];
    }

    // Get cities from existing properties
    let cities: string[] = [];
    try {
      cities = await Property.distinct('city').lean();
      console.log('Found cities:', cities.length);
    } catch (error) {
      console.log('Error fetching cities, using default cities:', error);
      cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad', 'Kolkata', 'Ahmedabad'];
    }

    // If category is specified, filter to that category only
    let selectedCategories = categories;
    if (categoryName) {
      const selectedCategory = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
      if (!selectedCategory) {
        console.warn('Category not found for request but continuing with all categories:', categoryName);
      } else {
        selectedCategories = [selectedCategory];
        console.log('Selected category:', selectedCategory.name);
      }
    }

    // Create workbook
    const wb = XLSX.utils.book_new();


    // Template sheet with category-specific fields
    const allFields = getStandardFields();

    // Add category-specific fields for selected categories
    if (categoryName && selectedCategories.length === 1) {
      const categorySpecificFields = await getCategorySpecificFields(selectedCategories[0].name);
      allFields.push(...categorySpecificFields);
    }

    // Create template data with headers
    const headers = allFields.map(field => field.required ? `${field.label}*` : field.label);

    // Add sample data row
    const sampleRow = allFields.map(field => {
      switch (field.type) {
        case 'select':
          return field.options ? field.options[0] : '';
        case 'boolean':
          return 'Yes';
        case 'number':
          return field.name.includes('price') ? 1000000 : 1000;
        default:
          return `Sample ${field.label}`;
      }
    });

    const templateData = [headers, sampleRow];
    const templateWS = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths for better readability
    const colWidths = headers.map(() => ({ wch: 20 }));
    templateWS['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, templateWS, 'Template');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    console.log('Buffer generated, size:', buffer.length);

    // Return file
    const fileName = categoryName
      ? `property_bulk_upload_${categoryName.replace(/\s+/g, '_').toLowerCase()}.xlsx`
      : 'property_bulk_upload_template.xlsx';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}