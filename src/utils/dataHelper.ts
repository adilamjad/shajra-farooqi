import { Person, Gender, CustomField, PersonalPageData } from '../types';

const cleanString = (val: string | undefined): string | undefined => {
  if (!val) return undefined;
  const trimmed = val.trim();
  if (/^[_\s.-]+$/.test(trimmed) || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
    return undefined;
  }
  return trimmed;
};

/**
 * Parses CSV file contents into Person array
 */
export function parseCSV(csvText: string): Person[] {
  if (!csvText.trim()) return [];

  // Detect line breaks
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0) return [];

  // Detect delimiter (comma vs semicolon)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  // Helper to split row and handle quotes
  const splitRow = (rowText: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < rowText.length; i++) {
      const char = rowText[i];
      if (char === '"') {
        if (inQuotes && rowText[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    // Strip surrounding quotes
    return result.map(val => val.replace(/^["']|["']$/g, '').trim());
  };

  const headers = splitRow(lines[0]).map(h => 
    h.replace(/^\uFEFF/, '').toLowerCase().replace(/[\s_-]/g, '').trim()
  );
  const parsedPeople: Person[] = [];

  // Check for metadata comments (e.g. # pinnedPersonId: grandpa-arthur)
  let commentPinnedId: string | undefined;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      const match = trimmed.match(/^#\s*(?:pinnedPersonId|pinned_person_id|pinned|defaultPin)\s*[:=]\s*(.+)$/i);
      if (match) {
        commentPinnedId = match[1].trim();
      }
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    const values = splitRow(line);
    const rowData: Record<string, string> = {};

    headers.forEach((header, index) => {
      if (index < values.length) {
        rowData[header] = values[index];
      }
    });

    const id = rowData.id || `member-${Math.random().toString(36).substr(2, 9)}`;
    const name = cleanString(rowData.name || rowData.fullname || rowData.الاسم || rowData.الاسمالكامل) || 'Unnamed Member';
    const arabicName = cleanString(rowData.arabicname || rowData.arabicName || rowData.الاسمبالعربية || rowData.الاسمالعربي || rowData.الاسمبالكاملباللغةالعربية);
    const maidenName = cleanString(rowData.maidenname || rowData.namebeforemarriage || rowData.الاسمقبلالزواج || rowData.اللقبقبلالزواج || rowData.اسمعائلةالزوجة || rowData.اسمالعائلةقبلالزواج);
    
    // Normalize gender
    let gender: Gender = 'other';
    const gVal = (rowData.gender || rowData.الجنس || rowData.النوع || '').toLowerCase();
    if (gVal.startsWith('m') || gVal.startsWith('ذ') || gVal === 'ذكر') gender = 'male';
    else if (gVal.startsWith('f') || gVal.startsWith('أ') || gVal.startsWith('ا') || gVal === 'أنثى' || gVal === 'انثى') gender = 'female';

    const birthDate = cleanString(rowData.birthdate || rowData.dob || rowData.تاريخالميلاد || rowData.تاريخالولادة);
    const deathDate = cleanString(rowData.deathdate || rowData.dod || rowData.تاريخالوفاة);
    
    // Deceased calculation
    const decVal = (rowData.isdeceased || rowData.متوفى || rowData.متوفيه || rowData.هلمتوفى || '').toLowerCase();
    const isDeceased = !!deathDate || decVal === 'true' || decVal === 'yes' || decVal === '1' || decVal === 'نعم' || decVal === 'صح';

    // Pinned status calculation
    const pinVal = (rowData.ispinned || rowData.pinned || rowData.isdefaultpinned || rowData.مثبت || rowData.تثبيت || '').toLowerCase();
    const isPinned = pinVal === 'true' || pinVal === 'yes' || pinVal === '1' || pinVal === 'نعم' || pinVal === 'صح';

    const photoUrl = cleanString(rowData.photourl || rowData.photo || rowData.الصورة);
    const photoFitVal = (rowData.photofit || rowData.fit || '').toLowerCase();
    const photoFit = (photoFitVal === 'fill' || photoFitVal === 'contain' || photoFitVal === 'cover') ? (photoFitVal as 'cover' | 'fill' | 'contain') : undefined;

    const fatherId = cleanString(rowData.fatherid || rowData.father || rowData.الأب || rowData.الاب);
    const motherId = cleanString(rowData.motherid || rowData.mother || rowData.الأم || rowData.الام);
    const spouseId = cleanString(rowData.spouseid || rowData.spouse || rowData.الزوج || rowData.الزوجة);
    const birthPlace = cleanString(rowData.birthplace || rowData.مكانالميلاد || rowData.مكانالولادة);
    const occupation = cleanString(rowData.occupation || rowData.المهنة || rowData.العمل);
    const bio = cleanString(rowData.bio || rowData.biography || rowData.السيرة || rowData.نبذة || rowData.السيرةالذاتية);

    // Parse optional personalPage JSON string if exported
    let personalPage: PersonalPageData | undefined;
    if (rowData.personalpage) {
      try {
        personalPage = JSON.parse(rowData.personalpage);
      } catch {
        // ignore invalid json
      }
    }

    // Handle any extra/custom columns as customFields
    const standardFields = [
      'id', 'name', 'fullname', 'arabicname', 'arabicName', 'maidenname', 'namebeforemarriage', 'gender',
      'birthdate', 'dob', 'deathdate', 'dod', 'isdeceased', 'ispinned', 'pinned', 'isdefaultpinned',
      'photourl', 'photo', 'photofit', 'fit',
      'fatherid', 'father', 'motherid', 'mother', 'spouseid', 'spouse',
      'birthplace', 'occupation', 'bio', 'biography', 'personalpage',
      // Arabic keys:
      'الاسم', 'الاسمالكامل', 'الاسمقبلالزواج', 'اللقبقبلالزواج', 'اسمعائلةالزوجة', 'اسمالعائلةقبلالزواج',
      'الجنس', 'النوع', 'تاريخالميلاد', 'تاريخالولادة', 'تاريخالوفاة', 'متوفى', 'متوفيه', 'هلمتوفى',
      'مثبت', 'تثبيت', 'الصورة', 'الأب', 'الاب', 'الأم', 'الام', 'الزوج', 'الزوجة', 'مكانالميلاد', 'مكانالولادة',
      'المهنة', 'العمل', 'السيرة', 'نبذة', 'السيرةالذاتية', 'الاسمبالعربية', 'الاسمالعربي', 'الاسمبالكاملباللغةالعربية'
    ];

    const customFields: CustomField[] = [];
    Object.keys(rowData).forEach(key => {
      if (!standardFields.includes(key) && rowData[key]) {
        customFields.push({
          label: key.charAt(0).toUpperCase() + key.slice(1),
          value: rowData[key]
        });
      }
    });

    parsedPeople.push({
      id,
      name,
      arabicName,
      maidenName,
      gender,
      birthDate,
      deathDate,
      isDeceased,
      isPinned: isPinned ? true : undefined,
      photoUrl,
      photoFit,
      fatherId,
      motherId,
      spouseId,
      birthPlace,
      occupation,
      bio,
      customFields: customFields.length > 0 ? customFields : undefined,
      personalPage
    });
  }

  if (commentPinnedId) {
    const target = parsedPeople.find(p => p.id === commentPinnedId);
    if (target) {
      target.isPinned = true;
    }
  }

  return parsedPeople;
}

/**
 * Converts Person array to CSV string
 */
export function exportToCSV(people: Person[], pinnedPersonId?: string | null): string {
  const headers = [
    'id', 'name', 'arabicName', 'maidenName', 'gender', 'birthDate', 'deathDate',
    'isDeceased', 'isPinned', 'photoUrl', 'photoFit', 'fatherId', 'motherId', 'spouseId',
    'birthPlace', 'occupation', 'bio', 'personalPage'
  ];

  // Find all custom fields across all people to include as columns
  const allCustomLabels = new Set<string>();
  people.forEach(p => {
    p.customFields?.forEach(cf => {
      allCustomLabels.add(cf.label);
    });
  });

  const customHeaders = Array.from(allCustomLabels);
  const fullHeaders = [...headers, ...customHeaders];

  const escapeCSV = (val: string | undefined | boolean | number): string => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = people.map(p => {
    const isThisPinned = (pinnedPersonId && p.id === pinnedPersonId) || Boolean(p.isPinned);
    const standardValues = [
      p.id,
      p.name,
      p.arabicName || '',
      p.maidenName || '',
      p.gender,
      p.birthDate || '',
      p.deathDate || '',
      p.isDeceased,
      isThisPinned ? 'true' : 'false',
      p.photoUrl || '',
      p.photoFit || 'cover',
      p.fatherId || '',
      p.motherId || '',
      p.spouseId || '',
      p.birthPlace || '',
      p.occupation || '',
      p.bio || '',
      p.personalPage ? JSON.stringify(p.personalPage) : ''
    ];

    const customValues = customHeaders.map(label => {
      const found = p.customFields?.find(cf => cf.label === label);
      return found ? found.value : '';
    });

    return [...standardValues, ...customValues].map(escapeCSV).join(',');
  });

  return [fullHeaders.join(','), ...rows].join('\n');
}

/**
 * Generate a template CSV string for user reference download
 */
export function getCSVTemplate(): string {
  return [
    'id,name,arabicName,maidenName,gender,birthDate,deathDate,isDeceased,isPinned,photoUrl,photoFit,fatherId,motherId,spouseId,birthPlace,occupation,bio,Nickname',
    'grandpa-arthur,Arthur Pendelton,آرثر بيندلتون,,male,1940-05-12,2015-11-20,true,true,,cover,,,grandma-eleanor,London,Clockmaker,Master craftsman,Artie',
    'grandma-eleanor,Eleanor Vance,إلينور فانس,Vance,female,1943-08-24,,false,false,,cover,,,grandpa-arthur,Edinburgh,Botanist,Studied rare flora,',
    'father-robert,Robert Pendelton,روبرت بيندلتون,,male,1968-02-14,,false,false,,cover,grandpa-arthur,grandma-eleanor,mother-sarah,London,Architect,Designs eco skyscrapers,Rob',
    'mother-sarah,Sarah Miller,سارة ميلر,Miller,female,1971-09-05,,false,false,,cover,,,father-robert,Boston,Pediatrician,,Sarah'
  ].join('\n');
}

export interface PersonAgeInfo {
  ageText: string;
  ageNum?: number;
  statusText: string;
  isDeceased: boolean;
  lifespanText: string;
}

/**
 * Calculates human-readable age and alive status for a person
 */
export function getPersonAgeInfo(person: {
  birthDate?: string;
  deathDate?: string;
  isDeceased?: boolean;
}): PersonAgeInfo {
  const isDeceased = Boolean(person.isDeceased || person.deathDate);
  const statusText = isDeceased ? 'Deceased' : 'Living';

  if (!person.birthDate) {
    const lifespanText = isDeceased
      ? (person.deathDate ? `Passed ${person.deathDate.substring(0, 4)}` : 'Deceased')
      : 'Living';
    return {
      ageText: 'Age: —',
      statusText,
      isDeceased,
      lifespanText
    };
  }

  const birthYear = parseInt(person.birthDate.substring(0, 4), 10);
  if (isNaN(birthYear)) {
    return {
      ageText: 'Age: —',
      statusText,
      isDeceased,
      lifespanText: isDeceased ? 'Deceased' : 'Living'
    };
  }

  if (isDeceased) {
    if (person.deathDate) {
      const deathYear = parseInt(person.deathDate.substring(0, 4), 10);
      if (!isNaN(deathYear) && deathYear >= birthYear) {
        const ageAtDeath = deathYear - birthYear;
        return {
          ageText: `${ageAtDeath} yrs`,
          ageNum: ageAtDeath,
          statusText: 'Deceased',
          isDeceased: true,
          lifespanText: `${birthYear} – ${deathYear}`
        };
      }
    }
    return {
      ageText: `b. ${birthYear}`,
      statusText: 'Deceased',
      isDeceased: true,
      lifespanText: `${birthYear} – Passed`
    };
  }

  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  return {
    ageText: `${age} yrs`,
    ageNum: age,
    statusText: 'Living',
    isDeceased: false,
    lifespanText: `${birthYear} – Present`
  };
}
