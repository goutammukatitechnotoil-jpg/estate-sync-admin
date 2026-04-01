import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Property from '@/lib/models/Property';
import Category from '@/lib/models/Category';
import TeamMember from '@/lib/models/TeamMember';

export const dynamic = 'force-dynamic';

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

const normalizeFacingDirection = (value: any): string | undefined => {
  const strRaw = normalizeEnumValue(value);
  if (!strRaw) return undefined;
  const str = strRaw.toLowerCase().replace(/\s+/g, '').replace(/[–—-]/g, '-');
  if (['north', 'n'].includes(str)) return 'North';
  if (['south', 's'].includes(str)) return 'South';
  if (['east', 'e'].includes(str)) return 'East';
  if (['west', 'w'].includes(str)) return 'West';
  if (['north-east', 'northeast', 'ne'].includes(str)) return 'North-East';
  if (['north-west', 'northwest', 'nw'].includes(str)) return 'North-West';
  if (['south-east', 'southeast', 'se'].includes(str)) return 'South-East';
  if (['south-west', 'southwest', 'sw'].includes(str)) return 'South-West';
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
    const stopOnError = body?.stopOnError === true;

    console.log('Bulk upload request received:', { rowsCount: rows?.length, stopOnError });

    if (!Array.isArray(rows)) {
      console.error('Invalid data format - rows is not an array');
      return NextResponse.json({ error: 'Invalid data format. Expected rows array.' }, { status: 400 });
    }

    const categoryList = await Category.find({ status: 1 }).lean();
    const teamMembers = await TeamMember.find({ status: 'Active' }).lean();

    console.log('Loaded data:', { categories: categoryList.length, teamMembers: teamMembers.length });
    console.log('Categories:', categoryList.map(c => c.name));

    const categoryMap = new Map<string, any>();
    categoryList.forEach((cat) => categoryMap.set(String(cat.name).toLowerCase(), cat));

    const agentMap = new Map<string, any>();
    teamMembers.forEach((m) => {
      if (m.fullName) agentMap.set(String(m.fullName).toLowerCase(), m);
      if (m.email) agentMap.set(String(m.email).toLowerCase(), m);
    });

    const validEntries: any[] = [];
    const errors: Array<{ row: number; errors: string[]; data: any }> = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index] || {};
      const rowErrors: string[] = [];

      console.log(`Processing row ${index + 1}:`, row);

      const title = toString(getFieldValue(row, 'title'));
      const categoryName = toString(getFieldValue(row, 'category'));
      const listingPurpose = toString(resolveField(row, ['listingPurpose', 'listingpurpose', 'listing purpose', 'purpose']));
      const price = toNumber(getFieldValue(row, 'price'));
      const minPrice = toNumber(getFieldValue(row, 'minPrice'));
      const maxPrice = toNumber(getFieldValue(row, 'maxPrice'));
      const pricingTypeRaw = resolveField(row, ['pricingType', 'pricingtype', 'pricing type']);
      const pricingType = toString(pricingTypeRaw) || (price !== undefined ? 'fixed' : ((minPrice !== undefined || maxPrice !== undefined) ? 'range' : 'fixed'));
      const priceType = toString(resolveField(row, ['priceType', 'pricetype', 'price type'])) || 'Total Price';
      const city = toString(getFieldValue(row, 'city'));
      const locality = toString(getFieldValue(row, 'locality'));
      const assignedAgentValue = toString(resolveField(row, ['assignedAgent', 'assignedagent', 'assigned agent', 'agent', 'agentname']));


      if (!title) rowErrors.push('title is required');
      if (!categoryName) rowErrors.push('category is required');
      if (!listingPurpose) rowErrors.push('listingPurpose is required');
      if (!priceType) rowErrors.push('priceType is required');
      if (!city) rowErrors.push('city is required');
      if (!locality) rowErrors.push('locality is required');

      const category = categoryName ? categoryMap.get(categoryName.toLowerCase()) : null;
      console.log(`Row ${index + 1} category lookup:`, { categoryName, categoryFound: !!category, availableCategories: Array.from(categoryMap.keys()) });
      if (!category) {
        rowErrors.push(`category '${categoryName}' not found`);
      }

      // More flexible pricing validation
      if (pricingType === 'fixed') {
        if (price === undefined || price === null) {
          rowErrors.push('price is required for fixed pricing');
        } else if (price !== undefined && price <= 0) {
          rowErrors.push('price must be greater than 0');
        }
      } else if (pricingType === 'range') {
        if (minPrice === undefined || minPrice === null) {
          rowErrors.push('minPrice is required for range pricing');
        } else if (minPrice !== undefined && minPrice <= 0) {
          rowErrors.push('minPrice must be greater than 0');
        }
        if (maxPrice === undefined || maxPrice === null) {
          rowErrors.push('maxPrice is required for range pricing');
        } else if (maxPrice !== undefined && maxPrice <= 0) {
          rowErrors.push('maxPrice must be greater than 0');
        }
        if (minPrice !== undefined && maxPrice !== undefined && minPrice >= maxPrice) {
          rowErrors.push('minPrice must be less than maxPrice');
        }
      }

      let assignedAgentId: string | undefined;
      if (assignedAgentValue) {
        const agent = agentMap.get(assignedAgentValue.toLowerCase());
        if (!agent) {
          // For bulk upload, make agent assignment optional - don't fail if agent not found
          console.warn(`Agent '${assignedAgentValue}' not found, skipping agent assignment`);
        } else {
          assignedAgentId = agent._id;
        }
      }

      if (category?.fields && Array.isArray(category.fields)) {
        category.fields.forEach((field: any) => {
          if (!field.required) return;
          const fieldValue = getDynamicFieldValue(row, field);
          if (fieldValue === undefined || fieldValue === null || String(fieldValue).trim() === '') {
            rowErrors.push(`dynamic field '${field.label || field.name}' is required`);
          }
        });
      }

      if (rowErrors.length > 0) {
        errors.push({ row: index + 2, errors: rowErrors, data: row }); // +2 for header
        console.log(`Row ${index + 1} failed validation:`, rowErrors);
        if (stopOnError) break;
        continue;
      }

      console.log(`Row ${index + 1} passed validation, processing...`);

      const dynamicData: any = {};
      if (category?.fields && Array.isArray(category.fields)) {
        category.fields.forEach((field: any) => {
          const value = getDynamicFieldValue(row, field);
          if (value !== undefined && value !== null && String(value).trim() !== '') {
            if (field.type === 'number') {
              dynamicData[field.name] = toNumber(value);
            } else if (field.type === 'checkbox') {
              dynamicData[field.name] = toBoolean(value);
            } else {
              dynamicData[field.name] = toString(value);
            }
          }
        });
      }

      console.log(`Row ${index + 1} dynamic data:`, dynamicData);

      const propertyDoc: any = {
        title,
        category: categoryName,
        listingPurpose,
        pricingType: pricingType as 'fixed' | 'range',
        priceType,
        city,
        locality,
        status: 1,
        dynamicData,
      };

      // Add optional fields only if they have valid values
      if (pricingType === 'fixed' && price !== undefined && price !== null && price > 0) {
        propertyDoc.price = price;
      }
      if (pricingType === 'range') {
        if (minPrice !== undefined && minPrice !== null && minPrice > 0) propertyDoc.minPrice = minPrice;
        if (maxPrice !== undefined && maxPrice !== null && maxPrice > 0) propertyDoc.maxPrice = maxPrice;
      }

      if (toString(getFieldValue(row, 'address'))) propertyDoc.address = toString(getFieldValue(row, 'address'));
      if (toString(resolveField(row, ['mapLink', 'map-link', 'map link', 'googleMapsLink', 'google-maps-link', 'google maps link']))) propertyDoc.mapLink = toString(resolveField(row, ['mapLink', 'map-link', 'map link', 'googleMapsLink', 'google-maps-link', 'google maps link']));
      if (toNumber(resolveField(row, ['propertyArea', 'property-area', 'property area', 'area'])) !== undefined) propertyDoc.area = toNumber(resolveField(row, ['propertyArea', 'property-area', 'property area', 'area']));
      const furnishingRaw = resolveField(row, ['furnishingStatus', 'furnishing-status', 'furnishing status', 'furnishing', 'furnishingType', 'furnishing-type', 'furnishing type']);
      const normalizedFurnishing = normalizeFurnishingStatus(furnishingRaw);
      if (normalizedFurnishing) {
        propertyDoc.furnishing = normalizedFurnishing;
      } else if (furnishingRaw !== undefined && furnishingRaw !== null && String(furnishingRaw).trim() !== '') {
        propertyDoc.furnishing = String(furnishingRaw).trim();
      }

      const propertyAgeRaw = resolveField(row, ['propertyAge', 'property-age', 'property age', 'age']);
      const normalizedPropertyAge = normalizePropertyAgeValue(propertyAgeRaw);
      if (normalizedPropertyAge) {
        propertyDoc.propertyAge = normalizedPropertyAge;
      } else if (propertyAgeRaw !== undefined && propertyAgeRaw !== null && String(propertyAgeRaw).trim() !== '') {
        propertyDoc.propertyAge = String(propertyAgeRaw).trim();
      }

      const facingRaw = resolveField(row, ['facingDirection', 'facing-direction', 'facing direction', 'facing']);
      const normalizedFacing = normalizeFacingDirection(facingRaw);
      if (normalizedFacing) {
        propertyDoc.facing = normalizedFacing;
      } else if (facingRaw !== undefined && facingRaw !== null && String(facingRaw).trim() !== '') {
        propertyDoc.facing = String(facingRaw).trim();
      }
      if (toArray(getFieldValue(row, 'highlights')).length > 0) propertyDoc.highlights = toArray(getFieldValue(row, 'highlights'));
      if (toArray(getFieldValue(row, 'amenities')).length > 0) propertyDoc.amenities = toArray(getFieldValue(row, 'amenities'));
      if (toArray(resolveField(row, ['imageUrls', 'image-urls', 'image urls', 'images'])).length > 0) propertyDoc.images = toArray(resolveField(row, ['imageUrls', 'image-urls', 'image urls', 'images']));
      if (toArray(resolveField(row, ['videoUrls', 'video-urls', 'video urls', 'videos'])).length > 0) propertyDoc.videos = toArray(resolveField(row, ['videoUrls', 'video-urls', 'video urls', 'videos']));
      if (toArray(resolveField(row, ['documentUrls', 'document-urls', 'document urls', 'documents'])).length > 0) propertyDoc.documents = toArray(resolveField(row, ['documentUrls', 'document-urls', 'document urls', 'documents']));
      if (toString(resolveField(row, ['videoTourLink', 'video-tour-link', 'video tour link', 'videoLink', 'video-link', 'video link']))) propertyDoc.videoLink = toString(resolveField(row, ['videoTourLink', 'video-tour-link', 'video tour link', 'videoLink', 'video-link', 'video link']));
      if (toBoolean(resolveField(row, ['isAvailable', 'is-available', 'is available', 'available'])) !== undefined) propertyDoc.availability = toBoolean(resolveField(row, ['isAvailable', 'is-available', 'is available', 'available']));
      if (assignedAgentId) propertyDoc.assignedAgentId = assignedAgentId;
      if (toBoolean(resolveField(row, ['siteVisitAllowed', 'site-visit-allowed', 'site visit allowed', 'sitevisit'])) !== undefined) propertyDoc.siteVisitAllowed = toBoolean(resolveField(row, ['siteVisitAllowed', 'site-visit-allowed', 'site visit allowed', 'sitevisit']));
      if (toString(getFieldValue(row, 'visitTimings'))) propertyDoc.visitTimings = toString(getFieldValue(row, 'visitTimings'));

      // Add category-specific fields
      if (toString(resolveField(row, ['bhkType', 'bhk-type', 'bhk type', 'bhk']))) propertyDoc.bhkType = toString(resolveField(row, ['bhkType', 'bhk-type', 'bhk type', 'bhk']));
      if (toNumber(resolveField(row, ['propertyFloorNumber', 'property-floor-number', 'property floor number', 'floorNumber', 'floor-number', 'floor number', 'floor'])) !== undefined) propertyDoc.propertyFloorNumber = toNumber(resolveField(row, ['propertyFloorNumber', 'property-floor-number', 'property floor number', 'floorNumber', 'floor-number', 'floor number', 'floor']));
      if (toNumber(resolveField(row, ['totalFloorsInBuilding', 'total-floors-in-building', 'total floors in building', 'totalFloors', 'total-floors', 'total floors'])) !== undefined) propertyDoc.totalFloorsInBuilding = toNumber(resolveField(row, ['totalFloorsInBuilding', 'total-floors-in-building', 'total floors in building', 'totalFloors', 'total-floors', 'total floors']));
      if (toNumber(getFieldValue(row, 'bedrooms')) !== undefined) propertyDoc.bedrooms = toNumber(getFieldValue(row, 'bedrooms'));
      if (toNumber(resolveField(row, ['numberOfFloors', 'number-of-floors', 'number of floors', 'floors'])) !== undefined) propertyDoc.numberOfFloors = toNumber(resolveField(row, ['numberOfFloors', 'number-of-floors', 'number of floors', 'floors']));
      if (toNumber(resolveField(row, ['plotArea', 'plot-area', 'plot area'])) !== undefined) propertyDoc.plotArea = toNumber(resolveField(row, ['plotArea', 'plot-area', 'plot area']));
      if (toString(resolveField(row, ['commercialType', 'commercial-type', 'commercial type', 'commercial']))) propertyDoc.commercialType = toString(resolveField(row, ['commercialType', 'commercial-type', 'commercial type', 'commercial']));
      if (toNumber(getFieldValue(row, 'floorNumber')) !== undefined) propertyDoc.floorNumber = toNumber(getFieldValue(row, 'floorNumber'));
      if (toString(resolveField(row, ['propertyDescription', 'property-description', 'property description', 'description']))) propertyDoc.propertyDescription = toString(resolveField(row, ['propertyDescription', 'property-description', 'property description', 'description']));
      const vastuValue = resolveField(row, ['vastuComplaint', 'vastu-complaint', 'vastu complaint', 'vastu']);
      if (vastuValue !== undefined && vastuValue !== null && vastuValue !== '') {
        const parsedVastu = Number(vastuValue);
        if (parsedVastu === 0 || parsedVastu === 1) propertyDoc.vastuComplaint = parsedVastu;
      }

      console.log(`Row ${index + 1} final property doc:`, propertyDoc);

      validEntries.push(propertyDoc);
    }

    console.log(`Processing complete. Valid entries: ${validEntries.length}, Errors: ${errors.length}`);

    let insertedCount = 0;
    const insertErrors: Array<{ row: number; error: string }> = [];

    if (validEntries.length > 0) {
      console.log(`Attempting to insert ${validEntries.length} properties`);
      console.log('First valid entry keys:', Object.keys(validEntries[0]));
      
      for (let i = 0; i < validEntries.length; i++) {
        console.log(`Creating property ${i + 1}...`);
        try {
          const created = await Property.create(validEntries[i]);
          console.log(`Successfully created property ${i + 1}:`, created._id);
          insertedCount++;
        } catch (createError: any) {
          console.error(`Failed to create property ${i + 1}:`, createError.message);
          console.error('Property data:', validEntries[i]);
          insertErrors.push({ row: i + 1, error: createError.message });
        }
      }
    }

    console.log('Bulk upload completed:', { inserted: insertedCount, failed: errors.length, insertErrors: insertErrors.length, totalRows: rows.length, validEntriesCount: validEntries.length });

    return NextResponse.json({
      inserted: insertedCount,
      failed: errors.length,
      errors,
      insertErrors,
      totalRows: rows.length,
      debug: {
        validEntriesCount: validEntries.length,
        categoriesLoaded: categoryList.length,
        teamMembersLoaded: teamMembers.length
      }
    }, { status: 200 });
  } catch (err: any) {
    console.error('Bulk property upload error:', err);
    console.error('Error stack:', err.stack);
    return NextResponse.json({ error: 'Bulk upload failed. Please check your file and try again.', details: err.message }, { status: 500 });
  }
}
