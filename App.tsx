
import React, { useState } from 'react';
import { 
  Ingredient, 
  Recipe, 
  Dish, 
  IngredientCategory, 
  UnitOfMeasure, 
  DishStatus 
} from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import IngredientModule from './components/IngredientModule';
import RecipeModule from './components/RecipeModule';
import DishModule from './components/DishModule';
import LogicDocumentation from './components/LogicDocumentation';

const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', name: 'Maldon Sea Salt', category: IngredientCategory.Spice, supplier: 'Fine Foods Co.', packSize: 1.5, packUnit: 'kg', price: 18.50, yieldPercent: 100, notes: 'Finish salt only', lastUpdated: Date.now() },
  { id: 'ing-2', name: 'Unsalted Butter', category: IngredientCategory.Dairy, supplier: 'Dairy Direct', packSize: 5, packUnit: 'kg', price: 45.00, yieldPercent: 100, notes: 'Keep chilled', lastUpdated: Date.now() },
  { id: 'ing-3', name: 'Wagyu Ribeye MB7+', category: IngredientCategory.Protein, supplier: 'Meat Masters', packSize: 4, packUnit: 'kg', price: 320.00, yieldPercent: 92, notes: 'Aged 21 days', lastUpdated: Date.now() },
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ingredients' | 'recipes' | 'dishes' | 'logic'>('dashboard');
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [dishes, setDishes] = useState<Dish[]>(INITIAL_DISHES);

  const getIngredientUnitCost = (ing: Ingredient): number => {
    let divisor = ing.packSize;
    if (ing.packUnit === 'kg' || ing.packUnit === 'L') divisor *= 1000;
    const baseCost = ing.price / divisor;
    return baseCost * (100 / ing.yieldPercent);
  };

  const getRecipeCost = (recipe: Recipe): number => {
    return recipe.components.reduce((acc, comp) => {
      if (comp.type === 'ingredient') {
        const ing = ingredients.find(i => i.id === comp.id);
        return acc + (ing ? getIngredientUnitCost(ing) * comp.quantity : 0);
      } else {
        const sub = recipes.find(r => r.id === comp.id);
        return acc + (sub ? (getRecipeCost(sub) / sub.yieldQuantity) * comp.quantity : 0);
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
        if (ing) cost = getIngredientUnitCost(ing) * comp.quantity;
      } else {
        const rec = recipes.find(r => r.id === comp.id);
        if (rec) cost = (getRecipeCost(rec) / rec.yieldQuantity) * comp.quantity;
      }

      if (comp.type === 'packaging') packaging += cost;
      else food += cost;
    });

    return { food, packaging, total: food + packaging };
  };

  const addIngredient = (ing: Ingredient) => setIngredients([...ingredients, ing]);
  const updateIngredient = (updated: Ingredient) => setIngredients(ingredients.map(i => i.id === updated.id ? updated : i));
  const addRecipe = (rec: Recipe) => setRecipes([...recipes, rec]);
  const updateRecipe = (updated: Recipe) => setRecipes(recipes.map(r => r.id === updated.id ? updated : r));
  const addDish = (dish: Dish) => setDishes([...dishes, dish]);
  const updateDish = (updated: Dish) => setDishes(dishes.map(d => d.id === updated.id ? updated : d));

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 bg-stone-50 overflow-y-auto max-h-screen px-6 py-8 md:px-12">
        <header className="mb-8 flex justify-between items-center border-b border-stone-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 serif capitalize tracking-tight">
              {activeTab === 'dashboard' ? 'At a Glance' : activeTab}
            </h1>
            <p className="text-stone-500 mt-1">Mise en Place &bull; Culinary R&D Systems</p>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard ingredientsCount={ingredients.length} recipesCount={recipes.length} dishesCount={dishes.length} recentIngredients={ingredients.slice(-3)} />}
        {activeTab === 'ingredients' && <IngredientModule ingredients={ingredients} onAdd={addIngredient} onUpdate={updateIngredient} getUnitCost={getIngredientUnitCost} />}
        {activeTab === 'recipes' && <RecipeModule recipes={recipes} ingredients={ingredients} getRecipeCost={getRecipeCost} getIngredientUnitCost={getIngredientUnitCost} onAdd={addRecipe} onUpdate={updateRecipe} />}
        {activeTab === 'dishes' && <DishModule dishes={dishes} recipes={recipes} ingredients={ingredients} getDishCostBreakdown={getDishCostBreakdown} onAdd={addDish} onUpdate={updateDish} />}
        {activeTab === 'logic' && <LogicDocumentation />}
      </main>
    </div>
  );
};

export default App;
