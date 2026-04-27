const fs = require('fs');
const path = require('path');

/**
 * Utility to load property data from various formats
 */
class DataLoader {
  static loadJson(filePath) {
    if (!fs.existsSync(filePath)) return [];
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading JSON from ${filePath}:`, error);
      return [];
    }
  }

  static loadCsv(filePath) {
    if (!fs.existsSync(filePath)) return [];
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length < 2) return [];

      const headers = lines[0].split(',').map(h => h.trim());
      return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index]?.trim() || '';
        });
        return obj;
      });
    } catch (error) {
      console.error(`Error loading CSV from ${filePath}:`, error);
      return [];
    }
  }

  static loadAll(dataDir) {
    const jsonPath = path.join(dataDir, 'properties.json');
    return this.loadJson(jsonPath);
  }

  /**
   * Transforms raw property objects into rich conversational text for indexing
   */
  static toSearchableText(p) {
    return [
      `Title: ${p.title || p.Name || 'Property'}`,
      `Type: ${p.type || p.Type || ''}`,
      `Purpose: ${p.purpose || p.Purpose || ''}`,
      `Location: ${p.location || p.Location || ''}`,
      `Price: ${p.price || p.Price || ''}`,
      `Size: ${p.size || p.Size || ''}`,
      `BHK: ${p.bhk || p.BHK || ''}`,
      `Amenities: ${(p.amenities || p.Amenities || '').toString()}`,
      `Description: ${p.description || p.Description || ''}`,
      `Nearby: ${(p.nearby || p.Nearby || '').toString()}`
    ].filter(line => !line.endsWith(': ')).join('. ');
  }
}

module.exports = { DataLoader };
