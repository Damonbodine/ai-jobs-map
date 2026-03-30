export interface OccupationCategoryOption {
  label: string;
  slug: string;
  dbValue: string;
}

export const occupationCategoryOptions: OccupationCategoryOption[] = [
  { label: 'Management', slug: 'management', dbValue: 'Management' },
  { label: 'Business & Finance', slug: 'business-and-financial-operations', dbValue: 'Business and Financial Operations' },
  { label: 'Computer & Tech', slug: 'computer-and-mathematical', dbValue: 'Computer and Mathematical' },
  { label: 'Healthcare', slug: 'healthcare-practitioners-and-technical', dbValue: 'Healthcare Practitioners and Technical' },
  { label: 'Education', slug: 'educational-instruction-and-library', dbValue: 'Educational Instruction and Library' },
  { label: 'Legal', slug: 'legal', dbValue: 'Legal' },
  { label: 'Engineering', slug: 'architecture-and-engineering', dbValue: 'Architecture and Engineering' },
  { label: 'Sales & Marketing', slug: 'sales-and-related', dbValue: 'Sales and Related' },
  { label: 'Science', slug: 'life-physical-and-social-science', dbValue: 'Life Physical and Social Science' },
  { label: 'Arts & Media', slug: 'arts-design-entertainment-sports-and-media', dbValue: 'Arts Design Entertainment Sports and Media' },
  { label: 'Social Service', slug: 'community-and-social-service', dbValue: 'Community and Social Service' },
  { label: 'Construction', slug: 'construction-and-extraction', dbValue: 'Construction and Extraction' },
  { label: 'Installation & Maintenance', slug: 'installation-maintenance-and-repair', dbValue: 'Installation Maintenance and Repair' },
  { label: 'Production', slug: 'production', dbValue: 'Production' },
  { label: 'Transportation', slug: 'transportation-and-material-moving', dbValue: 'Transportation and Material Moving' },
  { label: 'Protective Service', slug: 'protective-service', dbValue: 'Protective Service' },
  { label: 'Food & Hospitality', slug: 'food-preparation-and-serving-related', dbValue: 'Food Preparation and Serving' },
  { label: 'Building & Grounds', slug: 'building-and-grounds-cleaning-and-maintenance', dbValue: 'Building and Grounds Cleaning and Maintenance' },
  { label: 'Personal Care', slug: 'personal-care-and-service', dbValue: 'Personal Care and Service' },
];

const categoryLookup = new Map(
  occupationCategoryOptions.flatMap((category) => [
    [category.slug.toLowerCase(), category.dbValue],
    [category.dbValue.toLowerCase(), category.dbValue],
    [category.label.toLowerCase(), category.dbValue],
  ])
);

export function normalizeOccupationCategory(category: string | null | undefined): string {
  if (!category) {
    return '';
  }

  return categoryLookup.get(category.trim().toLowerCase()) ?? category.trim();
}

export function getOccupationCategoryLabel(category: string): string {
  const match = occupationCategoryOptions.find((option) => option.dbValue === category);
  return match?.label ?? category;
}
