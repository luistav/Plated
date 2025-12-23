
import React, { useState } from 'react';
import { Dish, Recipe, Ingredient, DishStatus, DishComponent, PlatingStep, UnitOfMeasure } from '../types';

interface DishModuleProps {
  dishes: Dish[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  getDishCostBreakdown: (dish: Dish) => { food: number, packaging: number, total: number };
  onAdd: (dish: Dish) => void;
  onUpdate: (dish: Dish) => void;
}

const DishModule: React.FC<DishModuleProps> = ({ dishes, recipes, ingredients, getDishCostBreakdown, onAdd, onUpdate }) => {
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  return (
    <>
      {selectedDish ? (
        <DishConceptView 
          dish={selectedDish} 
          onBack={() => setSelectedDish(null)} 
          onEdit={() => {
            setEditingDish(selectedDish);
            setShowCreator(true);
          }}
          cost={getDishCostBreakdown(selectedDish)}
          recipes={recipes}
          ingredients={ingredients}
        />
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Active R&D Concepts</h2>
            <button 
              onClick={() => {
                setEditingDish(null);
                setShowCreator(true);
              }}
              className="text-xs font-bold bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-all shadow-md"
            >
              <i className="fas fa-plus mr-2"></i> NEW CONCEPT DOCUMENT
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dishes.map(dish => {
              const { total } = getDishCostBreakdown(dish);
              const gp = ((dish.sellingPrice - total) / dish.sellingPrice) * 100;
              
              return (
                <div 
                  key={dish.id} 
                  onClick={() => setSelectedDish(dish)}
                  className="group bg-white rounded-3xl border border-stone-200 overflow-hidden cursor-pointer hover:border-stone-400 hover:shadow-xl transition-all duration-300"
                >
                  <div className="h-56 relative overflow-hidden">
                    <img 
                      src={dish.heroImage || `https://picsum.photos/seed/${dish.id}/600/400`} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000" 
                      alt={dish.name}
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase text-white shadow-lg ${
                        dish.status === DishStatus.RD ? 'bg-amber-500' :
                        dish.status === DishStatus.Testing ? 'bg-blue-500' :
                        dish.status === DishStatus.Live ? 'bg-emerald-600' : 'bg-stone-400'
                      }`}>
                        {dish.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-8">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[.2em] mb-2">{dish.category}</p>
                    <h3 className="text-2xl font-bold serif text-stone-900 mb-2 group-hover:text-stone-700 transition-colors">{dish.name}</h3>
                    <p className="text-xs text-stone-400 line-clamp-2 mb-6 italic leading-relaxed">"{dish.description}"</p>
                    
                    <div className="flex justify-between items-end pt-6 border-t border-stone-100">
                      <div>
                        <p className="text-[10px] text-stone-400 font-bold uppercase mb-1">Plate Cost</p>
                        <p className="text-lg font-black text-stone-900">${total.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-stone-400 font-bold uppercase mb-1">Margin</p>
                        <p className={`text-lg font-black ${gp < 70 ? 'text-rose-600' : 'text-emerald-600'}`}>{gp.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showCreator && (
        <DishCreator 
          recipes={recipes} 
          ingredients={ingredients} 
          existingDish={editingDish}
          onSave={(dish) => {
            if (editingDish) {
              onUpdate(dish);
              // Update the selected view if it's the one we're editing
              if (selectedDish && selectedDish.id === dish.id) {
                setSelectedDish(dish);
              }
            } else {
              onAdd(dish);
            }
            setShowCreator(false);
            setEditingDish(null);
          }}
          onClose={() => {
            setShowCreator(false);
            setEditingDish(null);
          }}
        />
      )}
    </>
  );
};

interface DishCreatorProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  existingDish: Dish | null;
  onSave: (dish: Dish) => void;
  onClose: () => void;
}

const DishCreator: React.FC<DishCreatorProps> = ({ recipes, ingredients, existingDish, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<Dish>>(existingDish ? { ...existingDish } : {
    name: '',
    category: 'Mains',
    description: '',
    internalNotes: '',
    status: DishStatus.RD,
    flavorProfile: [],
    components: [],
    platingSteps: [],
    sellingPrice: 0,
    inspirationLinks: [],
    gallery: []
  });

  const addComponent = (type: 'recipe' | 'ingredient' | 'packaging') => {
    setForm({
      ...form,
      components: [...(form.components || []), { id: '', type, quantity: 0, unit: 'g' }]
    });
  };

  const updateComponent = (idx: number, field: keyof DishComponent, val: any) => {
    const updated = [...(form.components || [])];
    updated[idx] = { ...updated[idx], [field]: val };
    setForm({ ...form, components: updated });
  };

  const addPlatingStep = () => {
    setForm({
      ...form,
      platingSteps: [...(form.platingSteps || []), { action: '', notes: '' }]
    });
  };

  const handleSave = () => {
    if (!form.name || !form.sellingPrice) return alert('Name and Selling Price are mandatory.');
    const dish: Dish = {
      id: form.id || `dish-${Date.now()}`,
      name: form.name || '',
      category: form.category || 'Mains',
      description: form.description || '',
      internalNotes: form.internalNotes || '',
      status: form.status as DishStatus,
      flavorProfile: form.flavorProfile || [],
      components: (form.components || []) as DishComponent[],
      platingSteps: (form.platingSteps || []) as PlatingStep[],
      sellingPrice: Number(form.sellingPrice) || 0,
      heroImage: form.heroImage || 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?q=80&w=800&auto=format&fit=crop',
      gallery: form.gallery || [],
      inspirationLinks: form.inspirationLinks || [],
      lastUpdated: Date.now()
    };
    onSave(dish);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-6">
       <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
          <div className="px-12 py-8 border-b border-stone-100 flex justify-between items-center bg-stone-50">
             <div>
               <h2 className="text-3xl font-bold serif text-stone-900">{existingDish ? 'Edit Concept' : 'Concept Creation'}</h2>
               <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Digital R&D Notebook Entry</p>
             </div>
             <button onClick={onClose} className="w-12 h-12 rounded-full hover:bg-stone-200 flex items-center justify-center transition-all group">
               <i className="fas fa-times text-stone-300 group-hover:text-stone-900"></i>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-12 space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                   <h3 className="text-xs font-black uppercase text-stone-400 tracking-[.3em]">Identity</h3>
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-stone-500 uppercase">Concept Name</label>
                         <input 
                           className="w-full bg-stone-50 border-stone-200 border rounded-2xl p-4 text-sm font-semibold focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                           type="text" 
                           placeholder="e.g. Dry Aged Monkfish with XO"
                           value={form.name}
                           onChange={e => setForm({...form, name: e.target.value})}
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-stone-500 uppercase">Category</label>
                           <select 
                            className="w-full bg-stone-50 border-stone-200 border rounded-2xl p-4 text-sm outline-none"
                            value={form.category}
                            onChange={e => setForm({...form, category: e.target.value})}
                           >
                             <option>Starters</option>
                             <option>Mains</option>
                             <option>Desserts</option>
                             <option>Sides</option>
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-stone-500 uppercase">Status</label>
                           <select 
                            className="w-full bg-stone-50 border-stone-200 border rounded-2xl p-4 text-sm outline-none"
                            value={form.status}
                            onChange={e => setForm({...form, status: e.target.value as DishStatus})}
                           >
                             <option value={DishStatus.RD}>R&D Phase</option>
                             <option value={DishStatus.Testing}>Testing</option>
                             <option value={DishStatus.Live}>Live on Menu</option>
                           </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-stone-500 uppercase">Menu Description</label>
                         <textarea 
                          className="w-full bg-stone-50 border-stone-200 border rounded-2xl p-4 text-sm min-h-[100px] outline-none"
                          placeholder="Public-facing description..."
                          value={form.description}
                          onChange={e => setForm({...form, description: e.target.value})}
                         />
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-xs font-black uppercase text-stone-400 tracking-[.3em]">Commercials</h3>
                   <div className="bg-stone-900 text-white p-8 rounded-[2rem] space-y-6">
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-stone-500 uppercase">Target Selling Price</label>
                         <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 font-bold">$</span>
                           <input 
                            className="w-full bg-stone-800 border-stone-700 border rounded-xl p-4 pl-8 text-2xl font-black focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            type="number"
                            value={form.sellingPrice}
                            onChange={e => setForm({...form, sellingPrice: Number(e.target.value)})}
                           />
                         </div>
                      </div>
                      <div className="p-4 bg-stone-800 rounded-xl">
                        <p className="text-[9px] font-bold text-stone-500 uppercase mb-1">Financial Tip</p>
                        <p className="text-xs leading-relaxed text-stone-400">Aim for >75% GP on signature dishes to offset waste and labor costs.</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                   <h3 className="text-xl font-bold serif text-stone-900">Composition Build</h3>
                   <div className="flex gap-2">
                      <button onClick={() => addComponent('recipe')} className="text-[10px] font-bold bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full border border-amber-100">+ RECIPE</button>
                      <button onClick={() => addComponent('ingredient')} className="text-[10px] font-bold bg-stone-50 text-stone-600 px-3 py-1.5 rounded-full border border-stone-200">+ INGREDIENT</button>
                      <button onClick={() => addComponent('packaging')} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100">+ PACKAGING</button>
                   </div>
                </div>
                
                <div className="space-y-4">
                  {form.components?.map((comp, idx) => (
                    <div key={idx} className="flex gap-4 items-end bg-stone-50/50 p-6 rounded-3xl border border-stone-100 animate-in slide-in-from-right duration-300">
                       <div className="w-24">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Type</label>
                          <div className={`mt-1 text-[10px] font-black uppercase text-center py-2 rounded-lg border ${
                            comp.type === 'recipe' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            comp.type === 'packaging' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-stone-200 text-stone-700 border-stone-300'
                          }`}>
                            {comp.type}
                          </div>
                       </div>
                       <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Reference Item</label>
                          <select 
                            className="w-full bg-white border-stone-200 border rounded-xl p-3 text-sm outline-none"
                            value={comp.id}
                            onChange={e => updateComponent(idx, 'id', e.target.value)}
                          >
                            <option value="">Select...</option>
                            {comp.type === 'recipe' 
                              ? recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                              : ingredients.filter(i => comp.type === 'packaging' ? i.category === 'Packaging' : i.category !== 'Packaging').map(ing => (
                                <option key={ing.id} value={ing.id}>{ing.name}</option>
                              ))
                            }
                          </select>
                       </div>
                       <div className="w-32 space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Quantity</label>
                          <input 
                            className="w-full bg-white border-stone-200 border rounded-xl p-3 text-sm font-mono outline-none"
                            type="number"
                            value={comp.quantity}
                            onChange={e => updateComponent(idx, 'quantity', Number(e.target.value))}
                          />
                       </div>
                       <div className="w-24 space-y-1">
                          <label className="text-[9px] font-bold text-stone-400 uppercase">Unit</label>
                          <select 
                            className="w-full bg-white border-stone-200 border rounded-xl p-3 text-sm outline-none"
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
                       <button 
                        onClick={() => setForm({...form, components: form.components?.filter((_, i) => i !== idx)})}
                        className="w-12 h-12 rounded-xl hover:bg-rose-50 text-rose-400 flex items-center justify-center transition-all"
                       >
                         <i className="fas fa-trash-alt"></i>
                       </button>
                    </div>
                  ))}
                </div>
             </div>

             <div className="space-y-8">
                <div className="flex justify-between items-center border-b border-stone-100 pb-4">
                   <h3 className="text-xl font-bold serif text-stone-900">Plating Logic</h3>
                   <button onClick={addPlatingStep} className="text-[10px] font-bold text-stone-900 border-b-2 border-stone-900">+ ADD STEP</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {form.platingSteps?.map((step, idx) => (
                     <div key={idx} className="bg-stone-50 p-6 rounded-3xl border border-stone-100 flex gap-4 animate-in fade-in duration-500">
                        <div className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-3">
                           <input 
                             className="w-full bg-white border-stone-200 border rounded-xl p-3 text-sm font-bold outline-none" 
                             placeholder="Primary Action (e.g. Quenelle of Puree)"
                             value={step.action}
                             onChange={e => {
                               const updated = [...(form.platingSteps || [])];
                               updated[idx].action = e.target.value;
                               setForm({...form, platingSteps: updated});
                             }}
                           />
                           <textarea 
                             className="w-full bg-white border-stone-200 border rounded-xl p-3 text-xs outline-none min-h-[80px]" 
                             placeholder="Internal notes (Temp, specific placement...)"
                             value={step.notes}
                             onChange={e => {
                               const updated = [...(form.platingSteps || [])];
                               updated[idx].notes = e.target.value;
                               setForm({...form, platingSteps: updated});
                             }}
                           />
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="px-12 py-8 border-t border-stone-100 bg-stone-50 flex justify-end gap-4">
             <button onClick={onClose} className="px-8 py-3 rounded-2xl text-sm font-bold text-stone-400 hover:text-stone-900 transition-all">Discard Concepts</button>
             <button onClick={handleSave} className="bg-stone-900 text-white px-12 py-3 rounded-2xl text-sm font-bold shadow-2xl hover:bg-stone-800 transition-all">
                {existingDish ? 'UPDATE CONCEPT' : 'ARCHIVE & DOCUMENT CONCEPT'}
             </button>
          </div>
       </div>
    </div>
  );
};

interface DishConceptViewProps {
  dish: Dish;
  onBack: () => void;
  onEdit: () => void;
  cost: { food: number, packaging: number, total: number };
  recipes: Recipe[];
  ingredients: Ingredient[];
}

const DishConceptView: React.FC<DishConceptViewProps> = ({ dish, onBack, onEdit, cost, recipes, ingredients }) => {
  const gp = ((dish.sellingPrice - cost.total) / dish.sellingPrice) * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-sm font-bold text-stone-400 hover:text-stone-900 flex items-center gap-2 transition-colors">
          <i className="fas fa-arrow-left"></i> BACK TO CATALOG
        </button>
        <button 
          onClick={onEdit}
          className="bg-stone-900 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-stone-800 transition-all flex items-center gap-2"
        >
          <i className="fas fa-edit"></i> EDIT CONCEPT
        </button>
      </div>

      {/* Header Section */}
      <section className="flex flex-col lg:flex-row gap-16">
        <div className="lg:w-1/2 rounded-[3rem] overflow-hidden shadow-2xl h-[600px] border border-stone-100">
          <img src={dish.heroImage} className="w-full h-full object-cover" alt={dish.name} />
        </div>
        <div className="lg:w-1/2 flex flex-col justify-center">
          <div className="flex gap-2 mb-6">
             {dish.flavorProfile.map(p => (
               <span key={p} className="text-[10px] font-black px-3 py-1 bg-stone-200 rounded-full text-stone-600 uppercase tracking-widest">{p}</span>
             ))}
             <span className="text-[10px] font-black px-3 py-1 bg-amber-100 rounded-full text-amber-700 uppercase tracking-widest">{dish.status}</span>
          </div>
          <h1 className="text-6xl font-bold serif text-stone-900 mb-6 leading-[1.1]">{dish.name}</h1>
          <p className="text-xl text-stone-400 italic mb-8 leading-relaxed max-w-lg">"{dish.description}"</p>
          <div className="p-8 bg-stone-900 text-stone-300 rounded-[2.5rem] shadow-lg border border-stone-800">
             <h4 className="text-[10px] font-bold uppercase tracking-[.3em] text-amber-500 mb-3">Creative Intent</h4>
             <p className="text-sm leading-relaxed italic">"{dish.internalNotes || 'No specific creative notes added yet.'}"</p>
          </div>
        </div>
      </section>

      {/* Build & Costing Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-end border-b-2 border-stone-900 pb-4">
            <h3 className="text-3xl font-bold serif text-stone-900">Concept Build</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Revision: {new Date(dish.lastUpdated).toLocaleDateString()}</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-stone-400 font-bold uppercase text-[10px] border-b border-stone-100">
                <th className="pb-6">Component Name</th>
                <th className="pb-6">Type</th>
                <th className="pb-6 text-right">Service Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {dish.components.map((comp, idx) => {
                const details = comp.type === 'recipe' 
                  ? recipes.find(r => r.id === comp.id) 
                  : ingredients.find(i => i.id === comp.id);
                return (
                  <tr key={idx} className="group hover:bg-stone-50 transition-colors">
                    <td className="py-6 font-bold text-stone-800 text-base">{details?.name || 'Undefined Reference'}</td>
                    <td className="py-6">
                       <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                         comp.type === 'recipe' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                         comp.type === 'packaging' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-stone-100 text-stone-600 border-stone-200'
                       }`}>
                         {comp.type}
                       </span>
                    </td>
                    <td className="py-6 text-right font-mono text-stone-400 font-bold">{comp.quantity}{comp.unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-10 rounded-[2.5rem] border border-stone-200 shadow-xl sticky top-8">
             <h4 className="text-[10px] font-black uppercase tracking-[.3em] text-stone-400 mb-8">Concept Economics</h4>
             
             <div className="space-y-5 mb-10">
                <div className="flex justify-between">
                  <span className="text-stone-400 font-bold text-xs uppercase">Food Cost</span>
                  <span className="font-bold text-stone-900">${cost.food.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-bold text-xs uppercase">Packaging</span>
                  <span className="font-bold text-stone-900">${cost.packaging.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-stone-100 pt-6 text-2xl">
                  <span className="font-black text-stone-900 serif">Plate Cost</span>
                  <span className="font-black text-stone-900">${cost.total.toFixed(2)}</span>
                </div>
             </div>

             <div className="p-6 bg-stone-50 rounded-2xl mb-8 border border-stone-100">
                <p className="text-[10px] text-stone-400 font-bold uppercase mb-2">Standard Sales Price</p>
                <p className="text-4xl font-black text-stone-900">${dish.sellingPrice.toFixed(2)}</p>
             </div>

             <div className="relative pt-2">
                <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                   <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${gp}%` }}></div>
                </div>
                <div className="flex justify-between mt-3">
                   <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Concept Profitability</span>
                   <span className={`text-sm font-black ${gp < 70 ? 'text-rose-600' : 'text-emerald-600'}`}>{gp.toFixed(1)}% GP</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Plating Documentation */}
      <section className="space-y-12">
        <h3 className="text-4xl font-bold serif text-stone-900 border-b border-stone-100 pb-6">Plating Execution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {dish.platingSteps.length > 0 ? dish.platingSteps.map((step, idx) => (
            <div key={idx} className="space-y-6 group animate-in slide-in-from-bottom duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-stone-100 border border-stone-200 shadow-sm">
                 {step.imageUrl ? (
                   <img src={step.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt={`Step ${idx+1}`} />
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full text-stone-300">
                      <i className="fas fa-camera text-3xl mb-3"></i>
                      <span className="text-[10px] font-bold uppercase tracking-widest">No Reference Frame</span>
                   </div>
                 )}
              </div>
              <div className="px-2">
                <span className="text-[10px] font-black bg-stone-900 text-white px-3 py-1 rounded-full mb-3 inline-block">SEQUENCE {idx+1}</span>
                <p className="font-bold text-xl text-stone-900 leading-tight">{step.action}</p>
                <p className="text-sm text-stone-400 mt-3 italic leading-relaxed">{step.notes || 'No specific operational notes.'}</p>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 bg-stone-50 rounded-[3rem] border border-dashed border-stone-200 text-center">
               <p className="text-stone-400 font-bold serif italic text-xl">Operational logic not yet defined.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer References */}
      <section className="pt-16 border-t border-stone-100 flex flex-wrap gap-12 text-stone-400">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
              <i className="fas fa-link"></i>
           </div>
           <div>
             <p className="text-[9px] font-black uppercase tracking-[.2em] text-stone-300">Creative Benchmark</p>
             <span className="text-xs font-bold text-stone-500">{dish.inspirationLinks[0] || 'Internal Original'}</span>
           </div>
         </div>
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
              <i className="fas fa-fingerprint"></i>
           </div>
           <div>
             <p className="text-[9px] font-black uppercase tracking-[.2em] text-stone-300">System ID</p>
             <span className="text-xs font-bold text-stone-500">{dish.id.toUpperCase()}</span>
           </div>
         </div>
      </section>
    </div>
  );
};

export default DishModule;
