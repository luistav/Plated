
export type UnitOfMeasure = 'g' | 'kg' | 'ml' | 'L' | 'unit' | 'sheet' | 'bottle' | 'pinch' | 'portion';

export enum IngredientCategory {
  Produce = 'Produce',
  Protein = 'Protein',
  DryGoods = 'Dry Goods',
  Dairy = 'Dairy',
  Spice = 'Spice',
  Packaging = 'Packaging',
  Other = 'Other'
}

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  supplier: string;
  packSize: number;
  packUnit: UnitOfMeasure;
  price: number; // Total pack price
  yieldPercent: number; // Default 100
  notes: string;
  lastUpdated: number;
}

export type RecipeType = 'Prep' | 'Sauce' | 'Base' | 'Garnish' | 'Full Recipe';

export interface RecipeComponent {
  id: string; // References Ingredient or Sub-recipe ID
  type: 'ingredient' | 'recipe';
  quantity: number;
  unit: UnitOfMeasure;
}

export interface Recipe {
  id: string;
  name: string;
  type: RecipeType;
  components: RecipeComponent[];
  yieldQuantity: number;
  yieldUnit: UnitOfMeasure;
  method: string[];
  notes: string;
  photoUrl?: string;
  lastUpdated: number;
}

export enum DishStatus {
  RD = 'R&D',
  Testing = 'Testing',
  Live = 'Live',
  Archived = 'Archived'
}

export interface PlatingStep {
  action: string;
  notes?: string;
  imageUrl?: string;
}

export interface DishComponent {
  id: string;
  type: 'ingredient' | 'recipe' | 'packaging';
  quantity: number;
  unit: UnitOfMeasure;
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  description: string; // Menu-ready
  internalNotes: string; // Creative intent
  status: DishStatus;
  flavorProfile: string[]; // e.g. ["Acidic", "Umami", "Rich"]
  components: DishComponent[];
  platingSteps: PlatingStep[];
  heroImage?: string;
  gallery: string[];
  inspirationLinks: string[];
  sellingPrice: number;
  lastUpdated: number;
}
