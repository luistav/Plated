
import React, { useState, useEffect } from 'react';
import { 
  Ingredient, 
  Recipe, 
  Dish, 
  Menu,
  Supplier,
  IngredientCategory, 
  DishStatus,
  UserProfile
} from './types';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import IngredientModule from './components/IngredientModule';
import RecipeModule from './components/RecipeModule';
import DishModule from './components/DishModule';
import MenuModule from './components/MenuModule';
import SupplierModule from './components/SupplierModule';
import LogicDocumentation from './components/LogicDocumentation';
import ProfileModule from './components/ProfileModule';
import Auth from './components/Auth';
import { auth, db } from './firebase';
import { DbService } from './services/db';
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { 
  doc, 
  getDoc, 
  collection, 
  writeBatch,
  getDocs
} from "firebase/firestore";

// --- INITIAL SEED DATA ---
const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Fine Foods Co.', deliveryDays: ['Mon', 'Thu'], minOrder: 150, contactEmail: 'orders@finefoods.com', contactPhone: '0400000000', repName: 'Sarah Jenkins', repMobile: '0411111111', repEmail: 'sarah@finefoods.com', notes: 'Cutoff 10pm prior day.' },
  { id: 'sup-2', name: 'Dairy Direct', deliveryDays: ['Mon', 'Wed', 'Fri'], minOrder: 50, contactEmail: 'orders@dairydirect.com', contactPhone: '0299999999', repName: 'Mike Ross', repMobile: '0422222222', repEmail: 'mike@dairydirect.com', notes: '' },
  { id: 'sup-3', name: 'Meat Masters', deliveryDays: ['Tue', 'Fri'], minOrder: 300, contactEmail: '', contactPhone: '', repName: '', repMobile: '', repEmail: '', notes: 'High grade wagyu only.' }
];

const INITIAL_INGREDIENTS: Ingredient[] = [
  { 
    id: 'ing-1', 
    name: 'Maldon Sea Salt', 
    category: IngredientCategory.Spice, 
    supplier: 'Fine Foods Co.', 
    supplierId: 'sup-1', 
    packSize: 1.5, 
    packUnit: 'kg', 
    price: 18.50, 
    yieldPercent: 100, 
    notes: 'Finish salt only', 
    lastUpdated: Date.now(),
    priceHistory: [
       { date: Date.now(), price: 18.50, supplier: 'Fine Foods Co.', note: 'Current' },
       { date: Date.now() - 86400000 * 30, price: 16.50, supplier: 'Fine Foods Co.', note: 'Price hike' },
       { date: Date.now() - 86400000 * 90, price: 16.00, supplier: 'Fine Foods Co.', note: 'Initial' }
    ]
  },
  { 
    id: 'ing-2', 
    name: 'Unsalted Butter', 
    category: IngredientCategory.Dairy, 
    supplier: 'Dairy Direct', 
    supplierId: 'sup-2', 
    packSize: 5, 
    packUnit: 'kg', 
    price: 45.00, 
    yieldPercent: 100, 
    notes: 'Keep chilled', 
    lastUpdated: Date.now(),
    priceHistory: [
       { date: Date.now(), price: 45.00, supplier: 'Dairy Direct', note: 'Current' },
       { date: Date.now() - 86400000 * 60, price: 42.00, supplier: 'Dairy Direct', note: 'Contract renewal' }
    ]
  },
  { id: 'ing-3', name: 'Wagyu Ribeye MB7+', category: IngredientCategory.Protein, supplier: 'Meat Masters', supplierId: 'sup-3', packSize: 4, packUnit: 'kg', price: 320.00, yieldPercent: 92, notes: 'Aged 21 days', lastUpdated: Date.now() },
  { id: 'ing-4', name: 'Eco-Box Large', category: IngredientCategory.Packaging, supplier: 'Green Pack', packSize: 50, packUnit: 'unit', price: 35.00, yieldPercent: 100, notes: 'Biodegradable', lastUpdated: Date.now() }
];

const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec-1',
    name: 'Beurre Monte',
    type: 'Base',
    components: [
      { id: 'ing-2', type: 'ingredient', quantity: 250, unit: 'g' },
      { id: 'ing-1', type: 'ingredient', quantity: 2, unit: 'g' }
    ],
    yieldQuantity: 250,
    yieldUnit: 'g',
    method: ['Warm water in pan', 'Whisk in cold butter cubes until emulsified.'],
    notes: 'Keep at 50-60C',
    lastUpdated: Date.now()
  }
];

const INITIAL_DISHES: Dish[] = [
  {
    id: 'dish-1',
    name: 'Butter Poached Ribeye',
    category: 'Mains',
    description: '250g MB7+ Wagyu Ribeye, emulsified butter, sea salt finish.',
    internalNotes: 'The goal is extreme tenderness through low-temp poaching. Contrast with heavy finish of Maldon.',
    status: DishStatus.Testing,
    flavorProfile: ['Rich', 'Savory', 'Buttery'],
    components: [
      { id: 'ing-3', type: 'ingredient', quantity: 250, unit: 'g' },
      { id: 'rec-1', type: 'recipe', quantity: 40, unit: 'g' },
      { id: 'ing-4', type: 'packaging', quantity: 1, unit: 'unit' }
    ],
    platingSteps: [
      { action: 'Rest protein', notes: 'Ensure core temp hits 52C', imageUrl: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?q=80&w=800&auto=format&fit=crop' },
      { action: 'Spoon Beurre Monte', notes: 'Apply generously to center', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop' },
      { action: 'Garnish with Maldon', notes: 'Focus on fat cap', imageUrl: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd679?q=80&w=800&auto=format&fit=crop' }
    ],
    heroImage: 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?q=80&w=800&auto=format&fit=crop',
    gallery: [],
    inspirationLinks: ['https://chefsteps.com/steak'],
    sellingPrice: 85.00,
    lastUpdated: Date.now()
  }
];

const INITIAL_MENUS: Menu[] = [
  {
    id: 'menu-1',
    name: 'Summer Tasting 2024',
    description: 'Focus on lighter proteins and acidic profiles.',
    dishIds: ['dish-1'],
    status: 'Active',
    lastUpdated: Date.now()
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ingredients' | 'recipes' | 'dishes' | 'menus' | 'suppliers' | 'logic' | 'profile'>('dashboard');
  
  // Data State - Initially empty, populated by Firestore
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // 1. Auth & User Profile Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
         try {
           const docRef = doc(db, "users", currentUser.uid);
           const docSnap = await getDoc(docRef);
           if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserProfile);
           } else {
             setUserProfile({
               uid: currentUser.uid,
               email: currentUser.email || '',
               displayName: currentUser.displayName || '',
               photoURL: currentUser.photoURL || '',
               role: 'Chef'
             });
           }
         } catch (e) {
           console.error("Error fetching user profile", e);
         }
      } else {
         setUserProfile(null);
         // Clear data on logout
         setIngredients([]);
         setRecipes([]);
         setDishes([]);
         setMenus([]);
         setSuppliers([]);
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Subscriptions via DbService
  useEffect(() => {
    if (!user) return;

    const unsubIngredients = DbService.subscribe(user.uid, 'ingredients', setIngredients);
    const unsubRecipes = DbService.subscribe(user.uid, 'recipes', setRecipes);
    const unsubDishes = DbService.subscribe(user.uid, 'dishes', setDishes);
    const unsubMenus = DbService.subscribe(user.uid, 'menus', setMenus);
    const unsubSuppliers = DbService.subscribe(user.uid, 'suppliers', setSuppliers);

    return () => {
      unsubIngredients();
      unsubRecipes();
      unsubDishes();
      unsubMenus();
      unsubSuppliers();
    };
  }, [user]);

  // 3. Initial Seeding Logic (Run once when user loads)
  useEffect(() => {
    const seedData = async () => {
      if (!user) return;
      
      try {
        const ingsRef = collection(db, "users", user.uid, "ingredients");
        const snapshot = await getDocs(ingsRef);
        
        if (snapshot.empty) {
          console.log("Seeding initial data for new user...");
          const batch = writeBatch(db);

          // Use DbService helper logic manually or directly via batch
          await DbService.seed(user.uid, 'suppliers', INITIAL_SUPPLIERS, batch);
          await DbService.seed(user.uid, 'ingredients', INITIAL_INGREDIENTS, batch);
          await DbService.seed(user.uid, 'recipes', INITIAL_RECIPES, batch);
          await DbService.seed(user.uid, 'dishes', INITIAL_DISHES, batch);
          await DbService.seed(user.uid, 'menus', INITIAL_MENUS, batch);

          await batch.commit();
          console.log("Seeding complete.");
        }
      } catch (e) {
        console.error("Error seeding data:", e);
      }
    };

    if (user && !loading) {
      seedData();
    }
  }, [user, loading]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  // --- Calculations ---

  const getIngredientUnitCost = (ing: Ingredient): number => {
    let divisor = ing.packSize;
    if (ing.packUnit === 'kg' || ing.packUnit === 'L') divisor *= 1000;
    if (divisor === 0) return 0;
    const baseCost = ing.price / divisor;
    return baseCost * (100 / (ing.yieldPercent || 100));
  };

  const getRecipeCost = (recipe: Recipe): number => {
    return recipe.components.reduce((acc, comp) => {
      if (comp.type === 'ingredient') {
        const ing = ingredients.find(i => i.id === comp.id);
        if (!ing) return acc;
        
        const baseCost = getIngredientUnitCost(ing);
        let quantityInBase = comp.quantity;
        
        if (comp.unit === 'kg' && (ing.packUnit === 'kg' || ing.packUnit === 'g')) {
          quantityInBase *= 1000;
        } else if (comp.unit === 'L' && (ing.packUnit === 'L' || ing.packUnit === 'ml')) {
          quantityInBase *= 1000;
        }
        
        return acc + (baseCost * quantityInBase);
      } else {
        const sub = recipes.find(r => r.id === comp.id);
        if (!sub) return acc;
        
        const subTotalCost = getRecipeCost(sub);
        
        let subYieldInBase = sub.yieldQuantity;
        if (sub.yieldUnit === 'kg' || sub.yieldUnit === 'L') subYieldInBase *= 1000;
        if (subYieldInBase === 0) return acc;

        const costPerBaseUnit = subTotalCost / subYieldInBase;
        
        let quantityInBase = comp.quantity;
        if (comp.unit === 'kg' || comp.unit === 'L') quantityInBase *= 1000;

        return acc + (costPerBaseUnit * quantityInBase);
      }
    }, 0);
  };

  const getDishCostBreakdown = (dish: Dish) => {
    let food = 0;
    let packaging = 0;

    dish.components.forEach(comp => {
      let cost = 0;
      if (comp.type === 'ingredient' || comp.type === 'packaging') {
        const ing = ingredients.find(i => i.id === comp.id);
        if (ing) {
          const baseCost = getIngredientUnitCost(ing);
          let quantityInBase = comp.quantity;
          if (comp.unit === 'kg' && (ing.packUnit === 'kg' || ing.packUnit === 'g')) quantityInBase *= 1000;
          else if (comp.unit === 'L' && (ing.packUnit === 'L' || ing.packUnit === 'ml')) quantityInBase *= 1000;
          cost = baseCost * quantityInBase;
        }
      } else {
        const rec = recipes.find(r => r.id === comp.id);
        if (rec) {
          const subTotalCost = getRecipeCost(rec);
          let subYieldInBase = rec.yieldQuantity;
          if (rec.yieldUnit === 'kg' || rec.yieldUnit === 'L') subYieldInBase *= 1000;
          
          if (subYieldInBase > 0) {
            let quantityInBase = comp.quantity;
            if (comp.unit === 'kg' || comp.unit === 'L') quantityInBase *= 1000;
            cost = (subTotalCost / subYieldInBase) * quantityInBase;
          }
        }
      }

      if (comp.type === 'packaging') packaging += cost;
      else food += cost;
    });

    return { food, packaging, total: food + packaging };
  };

  // --- CRUD Wrappers ---

  const addIngredient = (ing: Ingredient) => user && DbService.add(user.uid, 'ingredients', ing);
  const updateIngredient = (updated: Ingredient) => user && DbService.update(user.uid, 'ingredients', updated);
  const deleteIngredient = async (id: string) => {
    if (user) {
      try {
        await DbService.delete(user.uid, 'ingredients', id);
      } catch (error: any) {
        alert("Failed to delete ingredient: " + error.message);
      }
    }
  }

  const addRecipe = (rec: Recipe) => user && DbService.add(user.uid, 'recipes', rec);
  const updateRecipe = (updated: Recipe) => user && DbService.update(user.uid, 'recipes', updated);
  const deleteRecipe = async (id: string) => {
    if (user) {
      try {
        await DbService.delete(user.uid, 'recipes', id);
      } catch (error: any) {
        alert("Failed to delete recipe: " + error.message);
      }
    }
  }

  const addDish = (dish: Dish) => user && DbService.add(user.uid, 'dishes', dish);
  const updateDish = (updated: Dish) => user && DbService.update(user.uid, 'dishes', updated);
  const deleteDish = async (id: string) => {
    if (user) {
      try {
        await DbService.delete(user.uid, 'dishes', id);
      } catch (error: any) {
        alert("Failed to delete dish: " + error.message);
      }
    }
  }

  const addMenu = (menu: Menu) => user && DbService.add(user.uid, 'menus', menu);
  const updateMenu = (updated: Menu) => user && DbService.update(user.uid, 'menus', updated);
  const deleteMenu = async (id: string) => {
    if (user) {
      try {
        await DbService.delete(user.uid, 'menus', id);
      } catch (error: any) {
        alert("Failed to delete menu: " + error.message);
      }
    }
  }

  const addSupplier = (sup: Supplier) => user && DbService.add(user.uid, 'suppliers', sup);
  const updateSupplier = (updated: Supplier) => user && DbService.update(user.uid, 'suppliers', updated);
  
  // Smart Delete with Cascading Ingredient Cleanup
  const deleteSupplier = async (id: string) => {
    if (user) {
      try {
        // 1. Identify "Unknown" supplier or determine fallback
        let unknownSupplierId = suppliers.find(s => s.name === 'Unknown')?.id;
        
        // If "Unknown" doesn't exist, we'll need to handle it. 
        // For simplicity, if we don't have an ID, we'll just set supplierId to empty string 
        // and let the UI handle the "Unknown" display logic or the user can re-assign.
        // Or we could create one on the fly, but that's complex here.

        // 2. Scan and Sanitize Ingredients
        ingredients.forEach(ing => {
          let needsUpdate = false;
          let updatedIng = { ...ing };

          // Case A: Deleting the Standard Supplier
          if (ing.supplierId === id) {
             updatedIng.supplierId = unknownSupplierId || ''; 
             updatedIng.supplier = 'Unknown'; // Fallback name
             // Add history entry for the forced change
             updatedIng.priceHistory = [
               ...(updatedIng.priceHistory || []),
               { date: Date.now(), price: updatedIng.price, supplier: 'Unknown', note: 'Supplier Deleted' }
             ];
             needsUpdate = true;
          }

          // Case B: Deleting an Alternative Supplier
          if (ing.alternativeSuppliers && ing.alternativeSuppliers.some(alt => alt.supplierId === id)) {
             updatedIng.alternativeSuppliers = ing.alternativeSuppliers.filter(alt => alt.supplierId !== id);
             needsUpdate = true;
          }

          if (needsUpdate) {
             DbService.update(user.uid, 'ingredients', updatedIng);
          }
        });

        // 3. Delete the Supplier itself
        await DbService.delete(user.uid, 'suppliers', id);
        
      } catch (error: any) {
        alert("Failed to delete supplier: " + error.message);
      }
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50"><i className="fas fa-circle-notch fa-spin text-stone-300 text-2xl"></i></div>;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-stone-50 text-stone-900">
      {/* Sidebar hidden on mobile, visible on medium+ screens */}
      <div className="hidden md:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onSignOut={handleSignOut} userProfile={userProfile} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto max-h-[calc(100vh-64px)] md:max-h-screen px-4 py-6 md:px-12 md:py-8 mb-16 md:mb-0 print:overflow-visible print:max-h-none print:p-0 print:m-0">
        <header className="mb-6 md:mb-8 flex justify-between items-center border-b border-stone-200 pb-4 md:pb-6 print:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-900 serif capitalize tracking-tight">
              {activeTab === 'dashboard' ? 'At a Glance' : activeTab}
            </h1>
            <p className="text-xs md:text-base text-stone-500 mt-1">Mise en Place &bull; Culinary R&D Systems</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('profile')} className="md:hidden">
              <img src={userProfile?.photoURL || "https://ui-avatars.com/api/?name=Chef&background=random"} className="w-8 h-8 rounded-full bg-stone-200" alt="Profile" />
            </button>
            <button onClick={handleSignOut} className="md:hidden text-stone-400 hover:text-stone-900">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard ingredientsCount={ingredients.length} recipesCount={recipes.length} dishesCount={dishes.length} recentIngredients={ingredients.slice(-3)} />}
        {activeTab === 'ingredients' && <IngredientModule ingredients={ingredients} suppliers={suppliers} onAdd={addIngredient} onUpdate={updateIngredient} onDelete={deleteIngredient} getUnitCost={getIngredientUnitCost} onAddSupplier={addSupplier} />}
        {activeTab === 'recipes' && <RecipeModule recipes={recipes} ingredients={ingredients} getRecipeCost={getRecipeCost} getIngredientUnitCost={getIngredientUnitCost} onAdd={addRecipe} onUpdate={updateRecipe} onDelete={deleteRecipe} />}
        {activeTab === 'dishes' && <DishModule dishes={dishes} recipes={recipes} ingredients={ingredients} getDishCostBreakdown={getDishCostBreakdown} onAdd={addDish} onUpdate={updateDish} onDelete={deleteDish} />}
        {activeTab === 'menus' && <MenuModule menus={menus} dishes={dishes} recipes={recipes} ingredients={ingredients} getDishCostBreakdown={getDishCostBreakdown} onAdd={addMenu} onUpdate={updateMenu} onDelete={deleteMenu} />}
        {activeTab === 'suppliers' && (
          <SupplierModule 
            suppliers={suppliers} 
            ingredients={ingredients} 
            onAdd={addSupplier} 
            onUpdate={updateSupplier} 
            onDelete={deleteSupplier}
            onIngredientUpdate={updateIngredient}
            onIngredientDelete={deleteIngredient} 
          />
        )}
        {activeTab === 'logic' && <LogicDocumentation />}
        {activeTab === 'profile' && userProfile && <ProfileModule userProfile={userProfile} onUpdateProfile={(p) => setUserProfile(p)} />}
      </main>

      {/* Mobile Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
