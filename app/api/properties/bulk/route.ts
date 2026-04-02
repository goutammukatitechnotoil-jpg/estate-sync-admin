import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Property from '@/lib/models/Property';
import Category from '@/lib/models/Category';
import TeamMember from '@/lib/models/TeamMember';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

interface ValidationError {
  row: number;
  field: string;
  value: any;
  error: string;
}

interface ProcessedRow {
  rowNumber: number;
  data: any;
  errors: ValidationError[];
  isValid: boolean;
}

// Validation functions
const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

const validateCategory = (value: any, categories: any[]): string | null => {
  if (!value) return 'Category is required';
  const categoryName = String(value).trim();
  const category = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
  if (!category) {
    return `Invalid category: ${categoryName}. Available: ${categories.map(c => c.name).join(', ')}`;
  }
  return null;
};

const validateAgent = (value: any, agents: any[]): string | null => {
  if (!value || String(value).trim() === '') return null; // Agent is optional
  const agentName = String(value).trim();
  const agent = agents.find(a =>
    a.fullName.toLowerCase() === agentName.toLowerCase() ||
    a.email.toLowerCase() === agentName.toLowerCase()
  );
  if (!agent) {
    return `Invalid agent: ${agentName}. Available: ${agents.map(a => `${a.fullName} (${a.email})`).join(', ')}`;
  }
  return null;
};

const validateListingPurpose = (value: any): string | null => {
  if (!value) return 'Listing purpose is required';
  const purpose = String(value).trim();
  if (!['For Sale', 'For Rent'].includes(purpose)) {
    return `Invalid listing purpose: ${purpose}. Must be 'For Sale' or 'For Rent'`;
  }
  return null;
};

const validatePricingType = (value: any): string | null => {
  if (!value) return 'Pricing type is required';
  const type = String(value).trim();
  if (!['fixed', 'range'].includes(type)) {
    return `Invalid pricing type: ${type}. Must be 'fixed' or 'range'`;
  }
  return null;
};

const validatePriceFields = (pricingType: string, price: any, minPrice: any, maxPrice: any): string | null => {
  if (pricingType === 'fixed') {
    if (!price || isNaN(Number(price))) {
      return 'Price is required for fixed pricing type';
    }
    if (Number(price) <= 0) {
      return 'Price must be greater than 0';
    }
  } else if (pricingType === 'range') {
    if (!minPrice || isNaN(Number(minPrice))) {
      return 'Min price is required for range pricing type';
    }
    if (!maxPrice || isNaN(Number(maxPrice))) {
      return 'Max price is required for range pricing type';
    }
    if (Number(minPrice) <= 0 || Number(maxPrice) <= 0) {
      return 'Prices must be greater than 0';
    }
    if (Number(minPrice) >= Number(maxPrice)) {
      return 'Min price must be less than max price';
    }
  }
  return null;
};

const validateBooleanField = (value: any, fieldName: string): string | null => {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const str = String(value).trim().toLowerCase();
  const validValues = ['yes', 'no', 'true', 'false', '1', '0'];
  if (!validValues.includes(str)) {
    return `Invalid ${fieldName}: ${value}. Must be Yes/No, True/False, or 1/0`;
  }
  return null;
};

const validateSelectField = (value: any, fieldName: string, options: string[]): string | null => {
  if (!value || String(value).trim() === '') return null;
  const val = String(value).trim();
  if (!options.includes(val)) {
    return `Invalid ${fieldName}: ${val}. Must be one of: ${options.join(', ')}`;
  }
  return null;
};

const toNumber = (value: any): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const toBoolean = (value: any): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const str = String(value).trim().toLowerCase();
  if (['true', 'yes', '1'].includes(str)) return true;
  if (['false', 'no', '0'].includes(str)) return false;
  return undefined;
};

const toArray = (value: any): string[] => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

const toString = (value: any): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const str = String(value).trim();
  return str === '' ? undefined : str;
};

const normalizeKey = (key: string): string => key.trim();

const normalizeFieldKey = (key: string): string =>
  key
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');

const normalizeEnumValue = (value: any): string | undefined => {
  const str = toString(value);
  if (!str) return undefined;
  return str.trim();
};

const normalizeFurnishingStatus = (value: any): string | undefined => {
  const str = normalizeEnumValue(value)?.toLowerCase().replace(/\s+/g, '');
  if (!str) return undefined;
  if (['furnished', 'furnishedproperty', 'fullyfurnished', 'fully-furnished'].includes(str)) return 'Furnished';
  if (['semifurnished', 'semi-furnished', 'semi furnished', 'semifurnishedproperty'].includes(str)) return 'Semi-Furnished';
  if (['unfurnished', 'un-furnished', 'unfurnishedproperty'].includes(str)) return 'Unfurnished';
  return undefined;
};

const normalizePropertyAgeValue = (value: any): string | undefined => {
  const strRaw = normalizeEnumValue(value);
  if (!strRaw) return undefined;
  const str = strRaw.toLowerCase().replace(/\s+/g, '');
  if (['underconstruction', 'under-construction', 'under construction'].includes(str)) return 'Under Construction';
  if (['new', '0-1years', '0–1years', '0to1years', 'new(0–1years)', 'new(0-1years)'].includes(str)) return 'New (0–1 years)';
  if (['1-5years', '1–5years', '1to5years', '1to5'].includes(str)) return '1–5 years';
  if (['5-10years', '5–10years', '5to10years', '5to10'].includes(str)) return '5–10 years';
  if (['10+years', '10plusyears', '10years', '10+'].includes(str)) return '10+ years';
  return undefined;
};

const normalizeBooleanValue = (value: any): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const str = String(value).trim().toLowerCase();

  // Handle numeric values
  if (str === '0' || str === '1') {
    return Number(str);
  }

  // Handle boolean text representations
  if (['yes', 'true', 'y', '1', 'on', 'enabled', 'active'].includes(str)) {
    return 1;
  }
  if (['no', 'false', 'n', '0', 'off', 'disabled', 'inactive'].includes(str)) {
    return 0;
  }

  return undefined;
};

const fieldAliases: { [key: string]: string[] } = {
  title: ['title', 'propertytitle', 'property title'],
  category: ['category', 'propertycategory', 'property category'],
  listingpurpose: ['listingpurpose', 'listing-purpose', 'listing purpose', 'purpose'],
  pricingtype: ['pricingtype', 'pricing-type', 'pricing type'],
  price: ['price'],
  minprice: ['minprice', 'min-price', 'min price'],
  maxprice: ['maxprice', 'max-price', 'max price'],
  city: ['city'],
  locality: ['locality', 'area', 'region'],
  assignedagent: ['assignedagent', 'assigned-agent', 'assigned agent', 'agent', 'agentname'],
};

const resolveField = (row: any, names: string[]): any => {
  for (const name of names) {
    const value = getFieldValue(row, name);
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return undefined;
};

const getFieldValue = (row: any, key: string): any => {
  const target = normalizeFieldKey(key);
  for (const k of Object.keys(row)) {
    if (normalizeFieldKey(k) === target) {
      return row[k];
    }
  }

  const aliases = fieldAliases[target] || [];
  for (const alias of aliases) {
    for (const k of Object.keys(row)) {
      if (normalizeFieldKey(k) === normalizeFieldKey(alias)) {
        return row[k];
      }
    }
  }

  return row[key];
};

const getDynamicFieldValue = (row: any, field: any): any => {
  // Try internal name first, then user-facing label
  let value = getFieldValue(row, field.name);
  if (value !== undefined && value !== null && String(value).trim() !== '') {
    return value;
  }
  if (field.label) {
    value = getFieldValue(row, field.label);
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return undefined;
};

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const rows = body?.rows;

    console.log('Bulk upload request received:', { rowsCount: rows?.length });

    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: 'Invalid data format. Expected rows array.' }, { status: 400 });
    }

    // Load reference data
    const categories = await Category.find({ status: 1 }).lean();
    const teamMembers = await TeamMember.find({ status: 'Active' }).lean();
    const cities = await Property.distinct('city').lean();

    console.log('Loaded reference data:', {
      categories: categories.length,
      teamMembers: teamMembers.length,
      cities: cities.length
    });

    const processedRows: ProcessedRow[] = [];
    const validEntries: any[] = [];

    // Process each row
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index] || {};
      const rowNumber = index + 1;
      const errors: ValidationError[] = [];

      console.log(`Processing row ${rowNumber}:`, row);

      // Extract and validate fields
      const title = toString(getFieldValue(row, 'title'));
      const categoryName = toString(getFieldValue(row, 'category'));
      const listingPurpose = toString(resolveField(row, ['listingPurpose', 'listingpurpose', 'listing purpose', 'purpose']));
      const pricingTypeRaw = resolveField(row, ['pricingType', 'pricingtype', 'pricing type']);
      const pricingType = toString(pricingTypeRaw) || 'fixed';
      const price = toNumber(getFieldValue(row, 'price'));
      const minPrice = toNumber(getFieldValue(row, 'minPrice'));
      const maxPrice = toNumber(getFieldValue(row, 'maxPrice'));
      const priceType = toString(resolveField(row, ['priceType', 'pricetype', 'price type'])) || 'Total Price';
      const city = toString(getFieldValue(row, 'city'));
      const locality = toString(getFieldValue(row, 'locality'));
      const address = toString(getFieldValue(row, 'address'));
      const mapLink = toString(getFieldValue(row, 'mapLink'));
      const area = toNumber(getFieldValue(row, 'area'));
      const furnishing = toString(getFieldValue(row, 'furnishing'));
      const propertyAge = toString(getFieldValue(row, 'propertyAge'));
      const facing = toString(getFieldValue(row, 'facing'));
      const highlights = toArray(getFieldValue(row, 'highlights'));
      const amenities = toArray(getFieldValue(row, 'amenities'));
      const images = toArray(getFieldValue(row, 'images'));
      const videos = toArray(getFieldValue(row, 'videos'));
      const documents = toArray(getFieldValue(row, 'documents'));
      const videoLink = toString(getFieldValue(row, 'videoLink'));
      const availabilityRaw = resolveField(row, ['availability', 'isAvailable', 'is-available', 'is available']);
      const assignedAgentRaw = resolveField(row, ['assignedAgent', 'assigned-agent', 'assigned agent', 'agent']);
      const siteVisitAllowedRaw = resolveField(row, ['siteVisitAllowed', 'site-visit-allowed', 'site visit allowed']);
      const visitTimings = toString(getFieldValue(row, 'visitTimings'));

      // Validate required fields
      const titleError = validateRequired(title, 'Title');
      if (titleError) errors.push({ row: rowNumber, field: 'title', value: title, error: titleError });

      const categoryError = validateCategory(categoryName, categories);
      if (categoryError) errors.push({ row: rowNumber, field: 'category', value: categoryName, error: categoryError });

      const listingPurposeError = validateListingPurpose(listingPurpose);
      if (listingPurposeError) errors.push({ row: rowNumber, field: 'listingPurpose', value: listingPurpose, error: listingPurposeError });

      const pricingTypeError = validatePricingType(pricingType);
      if (pricingTypeError) errors.push({ row: rowNumber, field: 'pricingType', value: pricingType, error: pricingTypeError });

      const priceFieldsError = validatePriceFields(pricingType, price, minPrice, maxPrice);
      if (priceFieldsError) errors.push({ row: rowNumber, field: 'price', value: { price, minPrice, maxPrice }, error: priceFieldsError });

      const cityError = validateRequired(city, 'City');
      if (cityError) errors.push({ row: rowNumber, field: 'city', value: city, error: cityError });

      const localityError = validateRequired(locality, 'Locality');
      if (localityError) errors.push({ row: rowNumber, field: 'locality', value: locality, error: localityError });

      // Validate required agent
      if (!assignedAgentRaw || String(assignedAgentRaw).trim() === '') {
        errors.push({ row: rowNumber, field: 'assignedAgent', value: assignedAgentRaw, error: 'Assigned Agent is required' });
      } else {
        const agentError = validateAgent(assignedAgentRaw, teamMembers);
        if (agentError) errors.push({ row: rowNumber, field: 'assignedAgent', value: assignedAgentRaw, error: agentError });
      }

      const availabilityError = validateBooleanField(availabilityRaw, 'Availability');
      if (availabilityError) errors.push({ row: rowNumber, field: 'availability', value: availabilityRaw, error: availabilityError });

      const siteVisitError = validateBooleanField(siteVisitAllowedRaw, 'Site Visit Allowed');
      if (siteVisitError) errors.push({ row: rowNumber, field: 'siteVisitAllowed', value: siteVisitAllowedRaw, error: siteVisitError });

      const siteVisitAllowedNormalized = normalizeBooleanValue(siteVisitAllowedRaw);
      if (siteVisitAllowedNormalized === 1) {
        if (!visitTimings || String(visitTimings).trim() === '') {
          errors.push({ row: rowNumber, field: 'visitTimings', value: visitTimings, error: 'Visit Timings is required when Site Visit Allowed is Yes' });
        }
      }

      // Validate select fields
      const furnishingOptions = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
      const furnishingError = validateSelectField(furnishing, 'Furnishing', furnishingOptions);
      if (furnishingError) errors.push({ row: rowNumber, field: 'furnishing', value: furnishing, error: furnishingError });

      const propertyAgeOptions = ['Under Construction', 'New (0–1 years)', '1–5 years', '5–10 years', '10+ years'];
      const propertyAgeError = validateSelectField(propertyAge, 'Property Age', propertyAgeOptions);
      if (propertyAgeError) errors.push({ row: rowNumber, field: 'propertyAge', value: propertyAge, error: propertyAgeError });

      const facingOptions = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];
      const facingError = validateSelectField(facing, 'Facing', facingOptions);
      if (facingError) errors.push({ row: rowNumber, field: 'facing', value: facing, error: facingError });

      const priceTypeOptions = ['Total Price', 'Price per Sq.Ft'];
      const priceTypeError = validateSelectField(priceType, 'Price Type', priceTypeOptions);
      if (priceTypeError) errors.push({ row: rowNumber, field: 'priceType', value: priceType, error: priceTypeError });

      // If no errors, create property document
      if (errors.length === 0) {
        const propertyDoc: any = {
          title: title!,
          category: categoryName!,
          listingPurpose: listingPurpose!,
          pricingType,
          priceType,
          city: city || '',
          locality: locality!,
          status: 1,
          createdBy: null, // Will be set by auth middleware if available
          highlights: highlights.length > 0 ? highlights : [],
          amenities: amenities.length > 0 ? amenities : [],
          images: images.length > 0 ? images : [],
          videos: videos.length > 0 ? videos : [],
          documents: documents.length > 0 ? documents : [],
        };

        // Add pricing fields
        if (pricingType === 'fixed' && price) {
          propertyDoc.price = price;
        } else if (pricingType === 'range' && minPrice && maxPrice) {
          propertyDoc.minPrice = minPrice;
          propertyDoc.maxPrice = maxPrice;
        }

        // Add optional fields
        if (address) propertyDoc.address = address;
        if (mapLink) propertyDoc.mapLink = mapLink;
        if (area) propertyDoc.area = area;
        if (furnishing) propertyDoc.furnishing = furnishing;
        if (propertyAge) propertyDoc.propertyAge = propertyAge;
        if (facing) propertyDoc.facing = facing;
        if (videoLink) propertyDoc.videoLink = videoLink;
        if (visitTimings) propertyDoc.visitTimings = visitTimings;

        // Handle boolean fields
        const availability = normalizeBooleanValue(availabilityRaw);
        propertyDoc.availability = availability !== undefined ? availability === 1 : true;

        const siteVisitAllowed = normalizeBooleanValue(siteVisitAllowedRaw);
        if (siteVisitAllowed !== undefined) propertyDoc.siteVisitAllowed = siteVisitAllowed === 1;

        // Handle agent assignment
        if (assignedAgentRaw) {
          const agent = teamMembers.find(a =>
            a.fullName.toLowerCase() === String(assignedAgentRaw).toLowerCase() ||
            a.email.toLowerCase() === String(assignedAgentRaw).toLowerCase()
          );
          if (agent) propertyDoc.assignedAgentId = agent._id;
        }

        // Add category-specific fields
        const category = categories.find(cat => cat.name.toLowerCase() === categoryName!.toLowerCase());
        if (category) {
          // Add dynamic fields from category configuration
          if (category.fields) {
            category.fields.forEach((field: any) => {
              const fieldValue = getDynamicFieldValue(row, field);
              if (fieldValue !== undefined && fieldValue !== null && String(fieldValue).trim() !== '') {
                if (!propertyDoc.dynamicData) propertyDoc.dynamicData = {};
                propertyDoc.dynamicData[field.name] = fieldValue;
              }
            });
          }

          // Handle specific category fields
          switch (category.name.toLowerCase()) {
            case 'flat/apartment':
              const bhkType = toString(resolveField(row, ['bhkType', 'bhk-type', 'bhk type']));
              const floorNumber = toNumber(resolveField(row, ['propertyFloorNumber', 'floorNumber', 'floor-number']));
              const totalFloors = toNumber(resolveField(row, ['totalFloorsInBuilding', 'totalFloors', 'total-floors']));
              if (bhkType) propertyDoc.bhkType = bhkType;
              if (floorNumber !== undefined) propertyDoc.propertyFloorNumber = floorNumber;
              if (totalFloors !== undefined) propertyDoc.totalFloorsInBuilding = totalFloors;
              break;
            case 'villa/house':
              const bedrooms = toNumber(getFieldValue(row, 'bedrooms'));
              const numberOfFloors = toNumber(resolveField(row, ['numberOfFloors', 'floors']));
              const plotArea = toNumber(getFieldValue(row, 'plotArea'));
              if (bedrooms !== undefined) propertyDoc.bedrooms = bedrooms;
              if (numberOfFloors !== undefined) propertyDoc.numberOfFloors = numberOfFloors;
              if (plotArea !== undefined) propertyDoc.plotArea = plotArea;
              break;
            case 'plot/land':
              const plotAreaLand = toNumber(getFieldValue(row, 'plotArea'));
              if (plotAreaLand !== undefined) propertyDoc.plotArea = plotAreaLand;
              break;
            case 'commercial':
              const commercialType = toString(resolveField(row, ['commercialType', 'commercial-type']));
              const commercialFloor = toNumber(getFieldValue(row, 'floorNumber'));
              if (commercialType) propertyDoc.commercialType = commercialType;
              if (commercialFloor !== undefined) propertyDoc.floorNumber = commercialFloor;
              break;
            case 'other':
              const description = toString(resolveField(row, ['propertyDescription', 'description']));
              if (description) propertyDoc.propertyDescription = description;
              break;
          }

          // Handle vastu complaint for all categories
          const vastuValue = resolveField(row, ['vastuComplaint', 'vastu-complaint', 'vastu complaint']);
          const normalizedVastu = normalizeBooleanValue(vastuValue);
          if (normalizedVastu !== undefined) propertyDoc.vastuComplaint = normalizedVastu;
        }

        validEntries.push(propertyDoc);
      }

      processedRows.push({
        rowNumber,
        data: row,
        errors,
        isValid: errors.length === 0
      });
    }

    // Insert valid entries
    let insertedCount = 0;
    const insertErrors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < validEntries.length; i++) {
      try {
        await Property.create(validEntries[i]);
        insertedCount++;
      } catch (createError: any) {
        const rowNumber = processedRows.find(p => p.isValid && validEntries.indexOf(p.data) === -1)?.rowNumber || (i + 1);
        insertErrors.push({ row: rowNumber, error: createError.message });
      }
    }

    // Generate error report if there are errors
    let errorReportBuffer: Buffer | null = null;
    const allErrors = processedRows.filter(p => !p.isValid).concat(
      insertErrors.map(e => ({
        rowNumber: e.row,
        data: {},
        errors: [{ row: e.row, field: 'Database Insert', value: '', error: e.error }],
        isValid: false
      }))
    );

    if (allErrors.length > 0) {
      // Define all possible field columns for column-wise error display
      const fieldColumns = [
        'Title',
        'Category',
        'Listing Purpose',
        'Configuration Fields',
        'Pricing Type',
        'Price (INR)',
        'Price Type',
        'City',
        'Locality / Area',
        'Full Address',
        'Google Maps Link',
        'Property Area (sq ft)',
        'Vastu Complaint',
        'Property Age',
        'Facing Direction',
        'Highlights / Features (Recommended)',
        'Amenities (Optional)',
        'Property Images',
        'Property Videos',
        'Property Documents',
        'Video Tour Link',
        'Property Availability',
        'Assigned Agent',
        'Site Visit Allowed'
      ];

      // Create error data with column-wise structure
      const errorData = allErrors.map(error => {
        const rowData: any = { 'Row Number': error.rowNumber };

        // Initialize all field columns with empty string
        fieldColumns.forEach(field => {
          rowData[field] = '';
        });

        // Fill in error messages for fields that have errors
        (error.errors || []).forEach(err => {
          // Map field names to column headers (case-insensitive match)
          const matchingColumn = fieldColumns.find(col =>
            col.toLowerCase().includes(err.field.toLowerCase()) ||
            err.field.toLowerCase().includes(col.toLowerCase().split(' ')[0])
          );

          if (matchingColumn) {
            if (rowData[matchingColumn]) {
              rowData[matchingColumn] += '; ' + err.error;
            } else {
              rowData[matchingColumn] = err.error;
            }
          } else {
            // If no match, put in a general 'Other Errors' column
            if (!rowData['Other Errors']) rowData['Other Errors'] = '';
            rowData['Other Errors'] += (rowData['Other Errors'] ? '; ' : '') + `${err.field}: ${err.error}`;
          }
        });

        return rowData;
      });

      const errorWb = XLSX.utils.book_new();
      const errorWs = XLSX.utils.json_to_sheet(errorData);
      XLSX.utils.book_append_sheet(errorWb, errorWs, 'Errors');
      errorReportBuffer = XLSX.write(errorWb, { type: 'buffer', bookType: 'xlsx' });
    }

    const response: any = {
      success: insertedCount > 0,
      inserted: insertedCount,
      failed: allErrors.length,
      totalRows: rows.length,
      errors: allErrors.map(e => {
        const errorObj: { [key: string]: string } = {};
        (e.errors || []).forEach(err => {
          errorObj[err.field] = err.error;
        });
        return {
          row: e.rowNumber,
          errors: errorObj
        };
      })
    };

    if (errorReportBuffer) {
      response.errorReport = errorReportBuffer.toString('base64');
      response.hasErrorReport = true;
    }

    return NextResponse.json(response, { status: 200 });

  } catch (err: any) {
    console.error('Bulk property upload error:', err);
    return NextResponse.json({
      error: 'Bulk upload failed. Please check your file and try again.',
      details: err.message
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const categories = await Category.find({ status: 1 }).lean();
    const teamMembers = await TeamMember.find({ status: 'Active' }).lean();
    const cities = await Property.distinct('city').lean();

    const categoryNames = categories.map((cat) => String(cat.name || '').trim()).filter(Boolean);
    const listingPurpose = ['For Sale', 'For Rent'];
    const pricingType = ['Fixed Price', 'Range Price'];
    const priceTypeForSale = ['Total Price', 'Price per Sq.Ft'];
    const priceTypeForRent = ['Monthly Rent', 'Quarterly Rent'];
    const vastuOptions = ['Yes', 'No'];
    const ageOptions = ['Under Construction', 'New (0-1 Years)', '1-5 Years', '5-10 Years', '10+ Years'];
    const directions = ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'];
    const yesNo = ['Yes', 'No'];
    const agentOptions = teamMembers
      .map((m) => `${m.fullName || ''}${m.email ? ` (${m.email})` : ''}`)
      .filter((v) => v);

    const configurationByCategory: { [category: string]: string[] } = {};
    categories.forEach((cat) => {
      const key = String(cat.name || '').trim();
      if (!key) return;
      const fields = Array.isArray(cat.fields) ? cat.fields.map((f: any) => String(f).trim()).filter(Boolean) : [];
      configurationByCategory[key] = fields.length ? fields : ['1BHK', '2BHK', '3BHK'];
    });

    const cityLocalities: { [city: string]: string[] } = {};
    for (const city of cities) {
      if (!city) continue;
      const localities = await Property.distinct('locality', { city }).lean();
      cityLocalities[String(city).trim()] = (localities || []).map((loc) => String(loc || '').trim()).filter(Boolean);
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Property Template');
    const listSheet = workbook.addWorksheet('dropdownLists');
    listSheet.state = 'veryHidden';

    const normalizeName = (value: string) => value.replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '');

    const writeList = (col: string, values: string[]) => {
      values.forEach((value, idx) => {
        listSheet.getCell(`${col}${idx + 1}`).value = value;
      });
      if (!values.length) {
        listSheet.getCell(`${col}1`).value = 'N/A';
      }
    };

    writeList('A', categoryNames);
    writeList('B', listingPurpose);
    writeList('C', pricingType);
    writeList('D', priceTypeForSale);
    writeList('E', priceTypeForRent);
    writeList('F', vastuOptions);
    writeList('G', ageOptions);
    writeList('H', directions);
    writeList('I', yesNo);
    writeList('J', agentOptions);
    writeList('K', cities.map((c) => String(c || '').trim()).filter(Boolean));

    const safeLength = (len: number) => Math.max(len, 1);
    workbook.definedNames.add('CategoryList', `dropdownLists!$A$1:$A$${safeLength(categoryNames.length)}`);
    workbook.definedNames.add('ListingPurpose', `dropdownLists!$B$1:$B$${safeLength(listingPurpose.length)}`);
    workbook.definedNames.add('PricingType', `dropdownLists!$C$1:$C$${safeLength(pricingType.length)}`);
    workbook.definedNames.add('PriceTypeForSale', `dropdownLists!$D$1:$D$${safeLength(priceTypeForSale.length)}`);
    workbook.definedNames.add('PriceTypeForRent', `dropdownLists!$E$1:$E$${safeLength(priceTypeForRent.length)}`);
    workbook.definedNames.add('VastuList', `dropdownLists!$F$1:$F$${safeLength(vastuOptions.length)}`);
    workbook.definedNames.add('PropertyAgeList', `dropdownLists!$G$1:$G$${safeLength(ageOptions.length)}`);
    workbook.definedNames.add('FacingDirectionList', `dropdownLists!$H$1:$H$${safeLength(directions.length)}`);
    workbook.definedNames.add('YesNoList', `dropdownLists!$I$1:$I$${safeLength(yesNo.length)}`);
    workbook.definedNames.add('AgentList', `dropdownLists!$J$1:$J$${safeLength(agentOptions.length)}`);
    workbook.definedNames.add('CityList', `dropdownLists!$K$1:$K$${safeLength(cities.length)}`);

    Object.entries(configurationByCategory).forEach(([category, values], idx) => {
      const rangeName = `${normalizeName(category)}_Config`;
      const col = String.fromCharCode('L'.charCodeAt(0) + idx);
      writeList(col, values);
      workbook.definedNames.add(rangeName, `dropdownLists!$${col}$1:$${col}$${Math.max(values.length, 1)}`);
    });

    let localityColIndex = 'L'.charCodeAt(0) + Object.keys(configurationByCategory).length;
    Object.entries(cityLocalities).forEach(([city, values]) => {
      const rangeName = `${normalizeName(city)}_Localities`;
      const col = String.fromCharCode(localityColIndex);
      writeList(col, values);
      workbook.definedNames.add(rangeName, `dropdownLists!$${col}$1:$${col}$${Math.max(values.length, 1)}`);
      localityColIndex += 1;
    });

    sheet.addRow([
      'Title',
      'Category',
      'Listing Purpose',
      'Configuration Fields',
      'Pricing Type',
      'Price (INR)',
      'Price Type',
      'City',
      'Locality / Area',
      'Full Address',
      'Google Maps Link',
      'Property Area (sq ft)',
      'Vastu Complaint',
      'Property Age',
      'Facing Direction',
      'Highlights / Features (Recommended)',
      'Amenities (Optional)',
      'Property Images',
      'Property Videos',
      'Property Documents',
      'Video Tour Link',
      'Property Availability',
      'Assigned Agent',
      'Site Visit Allowed'
    ]);

    const rows = 200;
    for (let rowNumber = 2; rowNumber <= rows; rowNumber++) {
      sheet.getRow(rowNumber).height = 18;
      const setValidation = (col: number, formula: string, allowBlank = true) => {
        sheet.getCell(rowNumber, col).dataValidation = {
          type: 'list',
          formulae: [formula],
          allowBlank,
          showErrorMessage: true,
          errorTitle: 'Invalid value',
          error: 'Please select a value from the list'
        };
      };

      setValidation(2, '=CategoryList', false);
      setValidation(3, '=ListingPurpose', false);
      setValidation(4, `=INDIRECT(SUBSTITUTE($B${rowNumber}," ","_") & "_Config")`, true);
      setValidation(5, '=PricingType', true);
      setValidation(7, `=IF($C${rowNumber}="For Sale", PriceTypeForSale, IF($C${rowNumber}="For Rent", PriceTypeForRent, ""))`, true);
      setValidation(8, '=CityList', true);
      setValidation(9, `=INDIRECT(SUBSTITUTE($H${rowNumber}," ","_") & "_Localities")`, true);
      setValidation(13, '=VastuList', true);
      setValidation(14, '=PropertyAgeList', true);
      setValidation(15, '=FacingDirectionList', true);
      setValidation(23, '=YesNoList', true);
      setValidation(24, '=AgentList', true);
      setValidation(25, '=YesNoList', true);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=property_template.xlsx'
      }
    });
  } catch (err: any) {
    console.error('Template generation failed', err);
    return NextResponse.json({ error: 'Could not generate Excel template', details: err.message }, { status: 500 });
  }
}
