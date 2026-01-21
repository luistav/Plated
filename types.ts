
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

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  bio?: string;
  lastLogin?: number;
}

export interface Supplier {
  id: string;
  userId?: string; // Data Privacy Field
  name: string;
  
  // Ordering Logistics
  orderMethod?: 'email' | 'sms' | 'online' | 'phone';
  contactEmail: string;
  contactPhone: string;
  deliveryDays: string[]; // e.g. ['Mon', 'Wed', 'Fri']
  minOrder: number;
  
  // Rep Contact
  repName: string;
  repMobile: string;
  repEmail: string;
  
  notes: string;
}

export interface IngredientPricing {
  supplierId: string;
  supplierName: string; // Denormalized for display if supplier is deleted
  price: number;
  packSize: number;
  packUnit: UnitOfMeasure;
  productCode?: string;
}

export interface PriceHistoryEntry {
  date: number;
  price: number;
  supplier: string;
  note?: string; // e.g., "Supplier Change" or "Annual Increase"
}

export interface Ingredient {
  id: string;
  userId?: string; // Data Privacy Field
  name: string;
  category: IngredientCategory;
  
  // These root fields represent the "Standard" or "Preferred" option used for costing
  supplier: string; 
  supplierId?: string; // Link to the Supplier Entity
  packSize: number;
  packUnit: UnitOfMeasure;
  price: number; // Total pack price
  
  yieldPercent: number; // Default 100
  notes: string;
  lastUpdated: number;

  // List of all available suppliers for this item
  alternativeSuppliers?: IngredientPricing[]; 
  
  // Price tracking
  priceHistory?: PriceHistoryEntry[];
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
  userId?: string; // Data Privacy Field
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
  userId?: string; // Data Privacy Field
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

export interface Menu {
  id: string;
  userId?: string; // Data Privacy Field
  name: string;
  description: string;
  dishIds: string[];
  status: 'Draft' | 'Active' | 'Archived';
  lastUpdated: number;
}
