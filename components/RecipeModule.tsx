
import React, { useState } from 'react';
import { Recipe, Ingredient, RecipeType, UnitOfMeasure, RecipeComponent } from '../types';

interface RecipeModuleProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  getRecipeCost: (recipe: Recipe) => number;
  getIngredientUnitCost: (ing: Ingredient) => number;
  onAdd: (rec: Recipe) => void;
  onUpdate: (rec: Recipe) => void;
  onDelete: (id: string) => void;
}

const RecipeModule: React.FC<RecipeModuleProps> = ({ recipes, ingredients, getRecipeCost, getIngredientUnitCost, onAdd, onUpdate, onDelete }) => {
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    name: '',
    type: 'Prep',
    components: [],
    yieldQuantity: 1000,
    yieldUnit: 'g',
    method: [''],
    notes: ''
  });

  const getComponentUnitCost = (comp: RecipeComponent): number => {
    if (comp.type === 'ingredient') {
      const ing = ingredients.find(i => i.id === comp.id);
      if (!ing) return 0;
      const baseCost = getIngredientUnitCost(ing);
      if (comp.unit === 'kg' && (ing.packUnit === 'kg' || ing.packUnit === 'g')) return baseCost * 1000;
      if (comp.unit === 'L' && (ing.packUnit === 'L' || ing.packUnit === 'ml')) return baseCost * 1000;
      return baseCost;
    } else {
      const rec = recipes.find(r => r.id === comp.id);
      if (!rec || !rec.yieldQuantity) return 0;
      const subTotalCost = getRecipeCost(rec);
      let yieldBase = rec.yieldQuantity;
      if (rec.yieldUnit === 'kg' || rec.yieldUnit === 'L') yieldBase *= 1000;
      const costPerBase = subTotalCost / yieldBase;
      if (comp.unit === 'kg' || comp.unit === 'L') return costPerBase * 1000;
      return costPerBase;
    }
  };

  const getComponentTotalCost = (comp: RecipeComponent): number => {
    return getComponentUnitCost(comp) * comp.quantity;
  };

  const getNewRecipeTotalCost = (): number => {
    return (newRecipe.components || []).reduce((acc, comp) => acc + getComponentTotalCost(comp), 0);
  };

  const addComponent = () => {
    setNewRecipe({
      ...newRecipe,
      components: [...(newRecipe.components || []), { id: '', type: 'ingredient', quantity: 0, unit: 'g' }]
    });
  };

  const updateComponent = (index: number, field: keyof RecipeComponent, value: any) => {
    const updated = [...(newRecipe.components || [])];
    updated[index] = { ...updated[index], [field]: value };
    setNewRecipe({ ...newRecipe, components: updated });
  };

  const removeComponent = (index: number) => {
    setNewRecipe({
      ...newRecipe,
      components: (newRecipe.components || []).filter((_, i) => i !== index)
    });
  };

  const startEdit = (recipe: Recipe) => {
    setEditingId(recipe.id);
    setNewRecipe({ ...recipe });
    setShowEditor(true);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
  };

  const handleSave = () => {
    if (!newRecipe.name) return alert('Recipe name is required');
    const rec: Recipe = {
      id: editingId || `rec-${Date.now()}`,
      name: newRecipe.name || '',
      type: newRecipe.type as RecipeType,
      components: newRecipe.components as RecipeComponent[],
      yieldQuantity: Number(newRecipe.yieldQuantity) || 1,
      yieldUnit: newRecipe.yieldUnit as UnitOfMeasure,
      method: (newRecipe.method || []).filter(m => m.trim() !== ''),
      notes: newRecipe.notes || '',
      lastUpdated: Date.now()
    };
    if (editingId) onUpdate(rec);
    else onAdd(rec);
    setShowEditor(false);
    setEditingId(null);
    setNewRecipe({ name: '', type: 'Prep', components: [], yieldQuantity: 1000, yieldUnit: 'g', method: [''], notes: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-stone-500 italic hidden md:block">Component Recipes & Sub-Preps</h3>
        <button 
          type="button"
          onClick={() => {
            setEditingId(null);
            setNewRecipe({ name: '', type: 'Prep', components: [], yieldQuantity: 1000, yieldUnit: 'g', method: [''], notes: '' });
            setShowEditor(true);
          }}
          className="w-full md:w-auto bg-stone-900 text-white px-4 py-3 rounded-xl md:rounded-lg text-xs font-bold hover:bg-stone-800 transition-all shadow-sm flex items-center justify-center"
        >
          <i className="fas fa-plus mr-2"></i> NEW COMPONENT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {recipes.map(recipe => (
          <div key={recipe.id} className="group relative bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition-all flex flex-col">
             <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDelete(recipe.id); }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white border border-stone-200 text-stone-300 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all z-50 cursor-pointer"
             >
                <i className="fas fa-trash-alt text-xs pointer-events-none"></i>
             </button>

             <div onClick={() => startEdit(recipe)} className="flex-1 cursor-pointer">
                 <div className="bg-stone-50 px-6 py-4 flex justify-between items-center border-b border-stone-100">
                    <div>
                       <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{recipe.type}</span>
                       <h4 className="text-xl font-bold serif text-stone-900">{recipe.name}</h4>
                    </div>
                    <div className="flex gap-4 items-center">
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-stone-400 uppercase">Total Yield</p>
                          <p className="text-sm font-semibold text-stone-700">{recipe.yieldQuantity}{recipe.yieldUnit}</p>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-stone-200 transition-all">
                         <i className="fas fa-edit text-xs"></i>
                       </div>
                    </div>
                 </div>

                 <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[300px]">
                        <thead>
                          <tr className="border-b border-stone-100 text-stone-400 font-bold uppercase">
                            <th className="pb-2">Ingredient</th>
                            <th className="pb-2 text-right">Qty</th>
                            <th className="pb-2 text-right">Cost / Unit</th>
                            <th className="pb-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recipe.components.map((comp, idx) => {
                            const ingOrRec = comp.type === 'ingredient' 
                              ? ingredients.find(i => i.id === comp.id) 
                              : recipes.find(r => r.id === comp.id);
                            const unitCost = getComponentUnitCost(comp);
                            const lineTotal = getComponentTotalCost(comp);
                            return (
                              <tr key={idx} className="border-b border-stone-50 last:border-0 group-hover:bg-stone-50 transition-colors">
                                <td className="py-2 font-medium text-stone-700">{ingOrRec?.name || 'Unknown Item'}</td>
                                <td className="py-2 text-right text-stone-500 font-mono">{comp.quantity}{comp.unit}</td>
                                <td className="py-2 text-right text-stone-400 font-mono">${unitCost.toFixed(3)}</td>
                                <td className="py-2 text-right font-bold text-stone-800 font-mono">${lineTotal.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {recipe.method.length > 0 && (
                       <div className="mt-6 pt-6 border-t border-stone-100">
                         <p className="text-[10px] font-bold text-stone-400 uppercase mb-2">Method</p>
                         <p className="text-xs text-stone-600 line-clamp-2 italic leading-relaxed">{recipe.method[0]}</p>
                       </div>
                    )}
                 </div>

                 <div className="px-6 py-4 bg-stone-50 flex justify-between items-center border-t border-stone-100">
                    <div>
                       <p className="text-[10px] font-bold text-stone-400 uppercase">Cost / Yield Unit</p>
                       <p className="text-lg font-black text-stone-800">${(getRecipeCost(recipe) / recipe.yieldQuantity).toFixed(3)}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-stone-400 uppercase text-right">Total Batch</p>
                       <p className="text-sm font-bold text-stone-600 text-right">${getRecipeCost(recipe).toFixed(2)}</p>
                    </div>
                 </div>
             </div>
          </div>
        ))}
      </div>
      
      {showEditor && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center md:p-4">
           <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:max-h-[90vh]">
              <div className="px-6 py-4 md:px-8 md:py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50 shrink-0">
                 <h2 className="text-xl md:text-2xl font-bold serif text-stone-900">{editingId ? 'Edit Recipe' : 'New Recipe Specification'}</h2>
                 <button type="button" onClick={() => setShowEditor(false)} className="w-10 h-10 rounded-full hover:bg-stone-200 flex items-center justify-center transition-colors">
                   <i className="fas fa-times text-stone-400"></i>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                     <div className="space-y-2">
                       <label className="text-xs font-bold uppercase text-stone-500">Recipe Name</label>
                       <input 
                         className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm focus:ring-2 focus:ring-stone-900 outline-none transition-all" 
                         type="text" 
                         placeholder="e.g. Jus de Veau"
                         value={newRecipe.name}
                         onChange={e => setNewRecipe({...newRecipe, name: e.target.value})}
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-xs font-bold uppercase text-stone-500">Type</label>
                         <select 
                           className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm outline-none"
                           value={newRecipe.type}
                           onChange={e => setNewRecipe({...newRecipe, type: e.target.value as RecipeType})}
                         >
                           <option value="Prep">Prep</option>
                           <option value="Sauce">Sauce</option>
                           <option value="Base">Base</option>
                           <option value="Garnish">Garnish</option>
                         </select>
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-bold uppercase text-stone-500">Yield Quantity</label>
                         <div className="flex gap-2">
                            <input 
                              className="flex-1 bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm outline-none" 
                              type="number"
                              value={newRecipe.yieldQuantity}
                              onChange={e => setNewRecipe({...newRecipe, yieldQuantity: Number(e.target.value)})}
                            />
                            <select 
                              className="bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm outline-none w-20"
                              value={newRecipe.yieldUnit}
                              onChange={e => setNewRecipe({...newRecipe, yieldUnit: e.target.value as UnitOfMeasure})}
                            >
                              <option value="g">g</option>
                              <option value="ml">ml</option>
                              <option value="portion">portion</option>
                            </select>
                         </div>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase text-stone-500">Method Steps</label>
                     <textarea 
                       className="w-full h-full min-h-[120px] bg-stone-50 border-stone-200 border rounded-xl p-4 text-sm outline-none"
                       placeholder="1. Sear bones until dark brown..."
                       value={newRecipe.method?.[0] || ''}
                       onChange={e => setNewRecipe({...newRecipe, method: [e.target.value]})}
                     />
                   </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                       <h3 className="text-sm font-bold uppercase text-stone-900">Composition & Costing</h3>
                       <button type="button" onClick={addComponent} className="text-xs font-bold text-amber-600 hover:text-amber-700">
                         <i className="fas fa-plus-circle mr-1"></i> ADD INGREDIENT
                       </button>
                    </div>
                    
                    <div className="space-y-3">
                       <div className="flex gap-3 px-2 text-stone-400 font-bold uppercase text-[10px]">
                           <div className="flex-[0.5]">Type</div>
                           <div className="flex-1">Item</div>
                           <div className="w-24 hidden md:block">Qty</div>
                           <div className="w-20 hidden md:block">Unit</div>
                           <div className="w-20 text-right hidden md:block">Unit Cost</div>
                           <div className="w-20 text-right hidden md:block">Total</div>
                           <div className="w-10"></div>
                       </div>
                       {newRecipe.components?.map((comp, idx) => {
                         const unitCost = getComponentUnitCost(comp);
                         const lineTotal = getComponentTotalCost(comp);
                         return (
                           <div key={idx} className="flex flex-col md:flex-row gap-3 md:items-center bg-stone-50 p-4 md:p-0 rounded-lg md:rounded-none md:bg-transparent animate-in slide-in-from-left duration-200">
                              <div className="flex gap-3 items-center w-full">
                                  <div className="flex-[0.5] md:w-auto">
                                     <select 
                                       className="w-full bg-stone-50 border-stone-200 border rounded-lg p-2 text-xs outline-none"
                                       value={comp.type}
                                       onChange={e => updateComponent(idx, 'type', e.target.value)}
                                     >
                                       <option value="ingredient">Ing</option>
                                       <option value="recipe">Rec</option>
                                     </select>
                                  </div>
                                  <div className="flex-1">
                                     <select 
                                       className="w-full bg-stone-50 border-stone-200 border rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-stone-400"
                                       value={comp.id}
                                       onChange={e => updateComponent(idx, 'id', e.target.value)}
                                     >
                                       <option value="">Select Item...</option>
                                       {comp.type === 'ingredient' ? ingredients.map(ing => (
                                         <option key={ing.id} value={ing.id}>{ing.name}</option>
                                       )) : recipes.filter(r => r.id !== editingId).map(rec => (
                                         <option key={rec.id} value={rec.id}>{rec.name}</option>
                                       ))}
                                     </select>
                                  </div>
                                  <button type="button" onClick={() => removeComponent(idx)} className="md:hidden w-8 h-8 rounded-lg bg-rose-50 text-rose-400 flex items-center justify-center">
                                     <i className="fas fa-trash-alt text-xs"></i>
                                  </button>
                              </div>
                              
                              <div className="flex gap-2 w-full md:w-auto">
                                  <div className="w-1/2 md:w-24">
                                     <input 
                                       className="w-full bg-stone-50 border-stone-200 border rounded-lg p-2 text-xs outline-none focus:ring-1 focus:ring-stone-400 text-right font-mono" 
                                       type="number"
                                       placeholder="Qty"
                                       value={comp.quantity}
                                       onChange={e => updateComponent(idx, 'quantity', Number(e.target.value))}
                                     />
                                  </div>
                                  <div className="w-1/2 md:w-20">
                                     <select 
                                       className="w-full bg-stone-50 border-stone-200 border rounded-lg p-2 text-xs outline-none"
                                       value={comp.unit}
                                       onChange={e => updateComponent(idx, 'unit', e.target.value)}
                                     >
                                       <option value="g">g</option>
                                       <option value="kg">kg</option>
                                       <option value="ml">ml</option>
                                       <option value="L">L</option>
                                       <option value="unit">unit</option>
                                     </select>
                                  </div>
                              </div>

                              <div className="flex justify-between md:contents text-xs mt-2 md:mt-0">
                                  <span className="md:hidden text-stone-400 font-bold uppercase">Cost</span>
                                  <div className="flex gap-4">
                                      <div className="w-20 text-right text-stone-500 font-mono hidden md:block">
                                        ${unitCost.toFixed(3)}
                                      </div>
                                      <div className="w-20 text-right font-bold text-stone-800 font-mono">
                                        ${lineTotal.toFixed(2)}
                                      </div>
                                  </div>
                              </div>
                              
                              <button type="button" onClick={() => removeComponent(idx)} className="hidden md:flex w-10 h-10 rounded-lg hover:bg-rose-50 text-rose-400 transition-colors items-center justify-center">
                                 <i className="fas fa-trash-alt text-xs"></i>
                              </button>
                           </div>
                         );
                       })}
                    </div>
                 </div>
              </div>

              {/* Total Calculation Footer */}
              <div className="px-6 py-4 md:px-8 md:py-6 border-t border-stone-100 bg-stone-50 flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0">
                 <div className="flex justify-between md:gap-8">
                    <div>
                       <p className="text-[10px] font-bold text-stone-400 uppercase">Total Batch Cost</p>
                       <p className="text-xl font-black text-stone-900">${getNewRecipeTotalCost().toFixed(2)}</p>
                    </div>
                    <div className="text-right md:text-left">
                       <p className="text-[10px] font-bold text-stone-400 uppercase">Cost Per {newRecipe.yieldUnit}</p>
                       <p className="text-xl font-bold text-stone-500">
                         ${(newRecipe.yieldQuantity ? getNewRecipeTotalCost() / newRecipe.yieldQuantity : 0).toFixed(3)}
                       </p>
                    </div>
                 </div>
                 <div className="flex gap-3 w-full md:w-auto">
                   <button 
                    type="button"
                    onClick={() => setShowEditor(false)}
                    className="flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-200 transition-all border border-stone-200 md:border-0"
                   >
                     Discard
                   </button>
                   <button 
                    type="button"
                    onClick={handleSave}
                    className="flex-1 md:flex-none bg-stone-900 text-white px-8 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-stone-800 transition-all"
                   >
                     Save
                   </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default RecipeModule;
