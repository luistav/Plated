
import React, { useState } from 'react';
import { Ingredient, IngredientCategory, UnitOfMeasure } from '../types';

interface IngredientModuleProps {
  ingredients: Ingredient[];
  onAdd: (ing: Ingredient) => void;
  onUpdate: (ing: Ingredient) => void;
  getUnitCost: (ing: Ingredient) => number;
}

const IngredientModule: React.FC<IngredientModuleProps> = ({ ingredients, onAdd, onUpdate, getUnitCost }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Ingredient>>({
    category: IngredientCategory.Produce,
    yieldPercent: 100,
    packUnit: 'kg'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newIng: Ingredient = {
      id: `ing-${Date.now()}`,
      name: formData.name || '',
      category: formData.category as IngredientCategory,
      supplier: formData.supplier || '',
      packSize: Number(formData.packSize) || 0,
      packUnit: formData.packUnit as UnitOfMeasure,
      price: Number(formData.price) || 0,
      yieldPercent: Number(formData.yieldPercent) || 100,
      notes: formData.notes || '',
      lastUpdated: Date.now()
    };
    onAdd(newIng);
    setIsAdding(false);
    setFormData({ category: IngredientCategory.Produce, yieldPercent: 100, packUnit: 'kg' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
           <span className="text-xs bg-stone-200 px-3 py-1 rounded text-stone-600 font-medium">Total: {ingredients.length}</span>
           <span className="text-xs bg-stone-200 px-3 py-1 rounded text-stone-600 font-medium">Packaging: {ingredients.filter(i => i.category === 'Packaging').length}</span>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-sm font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1"
          >
            <i className="fas fa-plus-circle"></i> Add Ingredient
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border-2 border-stone-200 shadow-lg space-y-6 animate-in slide-in-from-top duration-300">
           <div className="flex justify-between items-center mb-4 border-b pb-4">
             <h3 className="text-lg font-bold serif">New Ingredient Specification</h3>
             <button type="button" onClick={() => setIsAdding(false)} className="text-stone-400 hover:text-stone-600">
               <i className="fas fa-times"></i>
             </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2">
               <label className="text-xs font-bold uppercase text-stone-500">Ingredient Name</label>
               <input 
                 required
                 className="w-full border-stone-200 border rounded-md p-2 text-sm focus:ring-1 focus:ring-stone-900 outline-none" 
                 type="text" 
                 placeholder="e.g. Maldon Sea Salt" 
                 value={formData.name || ''}
                 onChange={e => setFormData({...formData, name: e.target.value})}
               />
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold uppercase text-stone-500">Category</label>
               <select 
                 className="w-full border-stone-200 border rounded-md p-2 text-sm focus:ring-1 focus:ring-stone-900 outline-none"
                 value={formData.category}
                 onChange={e => setFormData({...formData, category: e.target.value as IngredientCategory})}
               >
                 {Object.values(IngredientCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold uppercase text-stone-500">Supplier</label>
               <input 
                 className="w-full border-stone-200 border rounded-md p-2 text-sm focus:ring-1 focus:ring-stone-900 outline-none" 
                 type="text" 
                 placeholder="Main Wholesaler"
                 value={formData.supplier || ''}
                 onChange={e => setFormData({...formData, supplier: e.target.value})}
               />
             </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <div className="space-y-2">
               <label className="text-xs font-bold uppercase text-stone-500">Pack Size</label>
               <input 
                 required
                 className="w-full border-stone-200 border rounded-md p-2 text-sm outline-none" 
                 type="number" step="0.01" 
                 value={formData.packSize || ''}
                 // Convert input string to number for type safety
                 onChange={e => setFormData({...formData, packSize: Number(e.target.value)})}
               />
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold uppercase text-stone-500">Pack Unit</label>
               <select 
                 className="w-full border-stone-200 border rounded-md p-2 text-sm outline-none"
                 value={formData.packUnit}
                 onChange={e => setFormData({...formData, packUnit: e.target.value as UnitOfMeasure})}
               >
                 <option value="kg">kg</option>
                 <option value="g">g</option>
                 <option value="L">L</option>
                 <option value="ml">ml</option>
                 <option value="unit">unit</option>
               </select>
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold uppercase text-stone-500">Pack Price ($)</label>
               <input 
                 required
                 className="w-full border-stone-200 border rounded-md p-2 text-sm outline-none" 
                 type="number" step="0.01"
                 value={formData.price || ''}
                 // Convert input string to number for type safety
                 onChange={e => setFormData({...formData, price: Number(e.target.value)})}
               />
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold uppercase text-stone-500">Yield (%)</label>
               <input 
                 className="w-full border-stone-200 border rounded-md p-2 text-sm outline-none" 
                 type="number" 
                 value={formData.yieldPercent || 100}
                 // Convert input string to number for type safety
                 onChange={e => setFormData({...formData, yieldPercent: Number(e.target.value)})}
               />
             </div>
           </div>

           <div className="flex justify-end gap-3 pt-4">
             <button type="submit" className="bg-stone-900 text-white px-6 py-2 rounded-md font-semibold text-sm hover:bg-stone-800 transition-all">Save Ingredient</button>
           </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {ingredients.map(ing => (
          <div key={ing.id} className="bg-white p-6 rounded-xl border border-stone-200 hover:shadow-md transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-stone-400 border border-stone-100 px-2 py-0.5 rounded">
                {ing.category}
              </span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-stone-400 hover:text-stone-600"><i className="fas fa-edit text-xs"></i></button>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-stone-800 mb-1">{ing.name}</h4>
            <p className="text-xs text-stone-400 mb-4">{ing.supplier}</p>
            
            <div className="grid grid-cols-2 gap-4 border-t border-stone-50 pt-4">
               <div>
                 <p className="text-[10px] text-stone-400 font-bold uppercase">Pack Info</p>
                 <p className="text-sm font-medium">{ing.packSize}{ing.packUnit} @ ${ing.price.toFixed(2)}</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] text-stone-400 font-bold uppercase">Cost / Base Unit</p>
                 <p className="text-sm font-bold text-amber-700">${(getUnitCost(ing)).toFixed(4)}</p>
               </div>
            </div>

            {ing.notes && (
              <div className="mt-4 pt-2 text-[11px] text-stone-500 italic border-t border-dashed border-stone-100">
                "{ing.notes}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IngredientModule;
