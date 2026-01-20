
import React, { useState, useRef } from 'react';
import { Dish, Recipe, Ingredient, DishStatus, DishComponent, PlatingStep, UnitOfMeasure } from '../types';
import { GoogleGenAI } from "@google/genai";
import { storage } from '../firebase';
import { ref, uploadString, getDownloadURL } from "firebase/storage";

interface DishModuleProps {
  dishes: Dish[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  getDishCostBreakdown: (dish: Dish) => { food: number, packaging: number, total: number };
  onAdd: (dish: Dish) => void;
  onUpdate: (dish: Dish) => void;
  onDelete: (id: string) => void;
}

const DishModule: React.FC<DishModuleProps> = ({ dishes, recipes, ingredients, getDishCostBreakdown, onAdd, onUpdate, onDelete }) => {
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this dish concept?")) {
      onDelete(id);
      if (selectedDish?.id === id) setSelectedDish(null);
    }
  };

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
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest hidden md:block">Active R&D Concepts</h2>
            <button 
              onClick={() => {
                setEditingDish(null);
                setShowCreator(true);
              }}
              className="w-full md:w-auto text-xs font-bold bg-stone-900 text-white px-4 py-3 rounded-xl md:rounded-lg hover:bg-stone-800 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <i className="fas fa-plus"></i> <span>NEW CONCEPT</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {dishes.map(dish => {
              const { total } = getDishCostBreakdown(dish);
              const foodCost = dish.sellingPrice > 0 ? (total / dish.sellingPrice) * 100 : 0;
              
              return (
                <div key={dish.id} className="group relative bg-white rounded-3xl border border-stone-200 overflow-hidden hover:border-stone-400 hover:shadow-xl transition-all duration-300">
                  {/* Delete Icon (Sibling) */}
                  <button 
                       onClick={() => handleDelete(dish.id)}
                       className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 text-stone-400 hover:text-rose-500 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer"
                  >
                       <i className="fas fa-trash-alt text-xs pointer-events-none"></i>
                  </button>

                  {/* Clickable Content */}
                  <div onClick={() => setSelectedDish(dish)} className="cursor-pointer">
                      <div className="h-48 md:h-56 relative overflow-hidden">
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
                      <div className="p-6 md:p-8">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[.2em] mb-2">{dish.category}</p>
                        <h3 className="text-xl md:text-2xl font-bold serif text-stone-900 mb-2 group-hover:text-stone-700 transition-colors">{dish.name}</h3>
                        <p className="text-xs text-stone-400 line-clamp-2 mb-6 italic leading-relaxed">"{dish.description}"</p>
                        
                        <div className="flex justify-between items-end pt-6 border-t border-stone-100">
                          <div>
                            <p className="text-[10px] text-stone-400 font-bold uppercase mb-1">Plate Cost</p>
                            <p className="text-lg font-black text-stone-900">${total.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-stone-400 font-bold uppercase mb-1">Food Cost</p>
                            <p className={`text-lg font-black ${foodCost > 30 ? 'text-rose-600' : foodCost > 25 ? 'text-amber-500' : 'text-emerald-600'}`}>{foodCost.toFixed(1)}%</p>
                          </div>
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

// ... (Rest of DishConceptView remains unchanged)
// --- Sub Component: DishConceptView ---

interface DishConceptViewProps {
  dish: Dish;
  onBack: () => void;
  onEdit: () => void;
  cost: { food: number, packaging: number, total: number };
  recipes: Recipe[];
  ingredients: Ingredient[];
}

const DishConceptView: React.FC<DishConceptViewProps> = ({ dish, onBack, onEdit, cost, recipes, ingredients }) => {
  const gp = dish.sellingPrice > 0 ? ((dish.sellingPrice - cost.total) / dish.sellingPrice) * 100 : 0;

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-20 md:pb-0">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <button onClick={onBack} className="text-xs font-bold text-stone-400 hover:text-stone-900 flex items-center gap-2 mb-2">
               <i className="fas fa-arrow-left"></i> BACK TO CONCEPTS
             </button>
             <h1 className="text-3xl md:text-4xl font-bold serif text-stone-900">{dish.name}</h1>
             <div className="flex gap-4 mt-2 items-center">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                  dish.status === DishStatus.RD ? 'bg-amber-100 text-amber-700' :
                  dish.status === DishStatus.Testing ? 'bg-blue-100 text-blue-700' :
                  dish.status === DishStatus.Live ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                }`}>
                  {dish.status}
                </span>
                <span className="text-xs font-medium text-stone-500">{dish.category}</span>
             </div>
          </div>
          <button onClick={onEdit} className="bg-stone-900 text-white px-6 py-2 rounded-xl text-xs font-bold shadow hover:bg-stone-800 transition-all">
             EDIT CONCEPT
          </button>
       </div>

       {/* Hero Section */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 md:h-80 rounded-3xl overflow-hidden relative group">
             <img src={dish.heroImage || `https://picsum.photos/seed/${dish.id}/800/600`} className="w-full h-full object-cover" alt={dish.name} />
             <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-8">
                <p className="text-white text-lg md:text-xl font-serif italic max-w-2xl leading-relaxed">"{dish.description}"</p>
             </div>
          </div>
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-3xl border border-stone-200 h-full flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-4">Financials</p>
                <div className="space-y-4">
                   <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
                      <span className="text-xs font-bold text-stone-500">Selling Price</span>
                      <span className="text-2xl font-black text-stone-900">${dish.sellingPrice.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
                      <span className="text-xs font-bold text-stone-500">Total Cost</span>
                      <span className="text-lg font-bold text-stone-700">${cost.total.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-stone-500">Gross Profit</span>
                      <span className={`text-xl font-black ${gp < 70 ? 'text-rose-500' : 'text-emerald-500'}`}>{gp.toFixed(1)}%</span>
                   </div>
                </div>
             </div>
          </div>
       </div>

       {/* Content Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Components */}
          <div className="space-y-6">
             <h3 className="text-lg font-bold serif text-stone-900 border-b border-stone-200 pb-2">Composition</h3>
             <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="divide-y divide-stone-100">
                   {dish.components.map((comp, idx) => {
                      const item = comp.type === 'recipe' 
                        ? recipes.find(r => r.id === comp.id) 
                        : ingredients.find(i => i.id === comp.id);
                      
                      return (
                         <div key={idx} className="p-4 flex justify-between items-center hover:bg-stone-50 transition-colors">
                            <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                  comp.type === 'recipe' ? 'bg-amber-100 text-amber-700' : 
                                  comp.type === 'packaging' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-500'
                               }`}>
                                  {comp.type === 'recipe' ? 'R' : comp.type === 'packaging' ? 'P' : 'I'}
                               </div>
                               <div>
                                  <p className="font-bold text-sm text-stone-800">{item?.name || 'Unknown Item'}</p>
                                  <p className="text-[10px] text-stone-400 uppercase tracking-wider">{comp.type}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="font-mono text-sm font-bold text-stone-600">{comp.quantity}<span className="text-[10px] text-stone-400 ml-0.5">{comp.unit}</span></p>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
          </div>

          {/* Plating */}
          <div className="space-y-6">
             <h3 className="text-lg font-bold serif text-stone-900 border-b border-stone-200 pb-2">Plating Guide</h3>
             <div className="space-y-4">
                {dish.platingSteps.length > 0 ? dish.platingSteps.map((step, idx) => (
                   <div key={idx} className="flex gap-4 p-4 bg-white rounded-2xl border border-stone-200">
                      <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                         {idx + 1}
                      </div>
                      <div>
                         <p className="font-bold text-sm text-stone-800">{step.action}</p>
                         {step.notes && <p className="text-xs text-stone-500 mt-1 italic">{step.notes}</p>}
                      </div>
                   </div>
                )) : (
                  <p className="text-stone-400 italic text-sm">No plating steps defined yet.</p>
                )}
             </div>
          </div>
       </div>
    </div>
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
    heroImage: '',
    gallery: []
  });

  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [isRefiningDesc, setIsRefiningDesc] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateName = async () => {
    // Basic validation to ensure we have context
    const hasContext = form.description || (form.components && form.components.length > 0);
    if (!hasContext) {
      alert("Please add a description or components first so the AI has context.");
      return;
    }

    setIsGeneratingName(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Gather component names for context
        const compNames = form.components?.map(c => {
             if(c.type === 'recipe') return recipes.find(r=>r.id===c.id)?.name;
             return ingredients.find(i=>i.id===c.id)?.name;
        }).filter(Boolean).join(', ');
        
        const prompt = `Generate a short, sophisticated, fine-dining dish name (maximum 5 words) based on this description: "${form.description}" and these components: ${compNames}. Return ONLY the name text, no quotes or explanations.`;
        
        const result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });
        const text = result.text?.trim();
        if (text) setForm({ ...form, name: text.replace(/^"|"$/g, '') });
    } catch (e) {
        console.error(e);
        alert("Failed to generate name. Please try again.");
    } finally {
        setIsGeneratingName(false);
    }
  };

  const refineDescription = async () => {
    if (!form.description) {
      alert("Please enter a draft description first.");
      return;
    }

    setIsRefiningDesc(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Rewrite the following dish description for a high-end Michelin-style menu. Keep it evocative, appetizing, and concise (under 40 words). Input: "${form.description}". Return ONLY the description text.`;
        
        const result = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });
        const text = result.text?.trim();
        if (text) setForm({ ...form, description: text });
    } catch (e) {
        console.error(e);
        alert("Failed to refine description. Please try again.");
    } finally {
        setIsRefiningDesc(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, heroImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

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

  const removePlatingStep = (index: number) => {
    const updated = [...(form.platingSteps || [])];
    updated.splice(index, 1);
    setForm({ ...form, platingSteps: updated });
  };

  const handleSave = async () => {
    if (!form.name || !form.sellingPrice) return alert('Name and Selling Price are mandatory.');
    
    setIsSaving(true);
    
    try {
        let imageUrl = form.heroImage || 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?q=80&w=800&auto=format&fit=crop';

        // Check if image is base64 (needs upload)
        if (imageUrl.startsWith('data:')) {
            const imageRef = ref(storage, `dish_images/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
            await uploadString(imageRef, imageUrl, 'data_url');
            imageUrl = await getDownloadURL(imageRef);
        }

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
          heroImage: imageUrl,
          gallery: form.gallery || [],
          inspirationLinks: form.inspirationLinks || [],
          lastUpdated: Date.now()
        };
        onSave(dish);
    } catch (error) {
        console.error("Error saving dish:", error);
        alert("Failed to save dish. Please check your connection and try again.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-md z-[100] flex items-center justify-center md:p-6">
       <div className="bg-white w-full h-full md:h-auto md:max-w-6xl md:rounded-[2.5rem] shadow-2xl flex flex-col md:max-h-[95vh] overflow-hidden">
          <div className="px-6 py-4 md:px-12 md:py-8 border-b border-stone-100 flex justify-between items-center bg-stone-50 shrink-0">
             <div>
               <h2 className="text-xl md:text-3xl font-bold serif text-stone-900">{existingDish ? 'Edit Concept' : 'Concept Creation'}</h2>
               <p className="text-[10px] md:text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Digital R&D Notebook Entry</p>
             </div>
             <button onClick={onClose} className="w-10 h-10 md:w-12 md:h-12 rounded-full hover:bg-stone-200 flex items-center justify-center transition-all group">
               <i className="fas fa-times text-stone-300 group-hover:text-stone-900"></i>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 md:space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-6">
                   <h3 className="text-xs font-black uppercase text-stone-400 tracking-[.3em]">Identity</h3>
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <div className="flex justify-between items-end">
                            <label className="text-[10px] font-bold text-stone-500 uppercase">Concept Name</label>
                            <button 
                              type="button" 
                              onClick={generateName} 
                              disabled={isGeneratingName || isSaving} 
                              className="text-[10px] font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                               {isGeneratingName ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                               <span>AI GENERATE</span>
                            </button>
                         </div>
                         <input 
                           className="w-full bg-stone-50 border-stone-200 border rounded-2xl p-4 text-sm font-semibold focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                           type="text" 
                           placeholder="e.g. Dry Aged Monkfish with XO"
                           value={form.name}
                           onChange={e => setForm({...form, name: e.target.value})}
                         />
                      </div>
                      
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-stone-500 uppercase">Hero Image</label>
                         <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                         />
                         <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-48 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-stone-100 transition-all overflow-hidden relative group"
                         >
                            {form.heroImage ? (
                               <>
                                 <img src={form.heroImage} alt="Preview" className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                                      <i className="fas fa-camera mr-2"></i> Change Photo
                                    </span>
                                 </div>
                               </>
                            ) : (
                               <div className="text-center text-stone-400">
                                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-2 text-stone-300">
                                     <i className="fas fa-camera text-xl"></i>
                                  </div>
                                  <p className="text-xs font-bold uppercase tracking-wider">Tap to Upload or Take Photo</p>
                                  <p className="text-[10px] mt-1 opacity-60">Supports JPG, PNG</p>
                               </div>
                            )}
                         </div>
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
                         <div className="flex justify-between items-end">
                             <label className="text-[10px] font-bold text-stone-500 uppercase">Menu Description</label>
                             <button 
                               type="button" 
                               onClick={refineDescription} 
                               disabled={isRefiningDesc || isSaving} 
                               className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                                 {isRefiningDesc ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sparkles"></i>}
                                 <span>AI REFINE</span>
                            </button>
                         </div>
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
                   <div className="bg-stone-900 text-white p-6 md:p-8 rounded-[2rem] space-y-6">
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
                <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-stone-100 pb-4 gap-4">
                   <h3 className="text-xl font-bold serif text-stone-900">Composition Build</h3>
                   <div className="flex flex-wrap gap-2">
                      <button onClick={() => addComponent('recipe')} className="text-[10px] font-bold bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full border border-amber-100">+ RECIPE</button>
                      <button onClick={() => addComponent('ingredient')} className="text-[10px] font-bold bg-stone-50 text-stone-600 px-3 py-1.5 rounded-full border border-stone-200">+ INGREDIENT</button>
                      <button onClick={() => addComponent('packaging')} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100">+ PACKAGING</button>
                   </div>
                </div>
                
                <div className="space-y-4">
                  {form.components?.map((comp, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-4 md:items-end bg-stone-50/50 p-4 md:p-6 rounded-3xl border border-stone-100 animate-in slide-in-from-right duration-300">
                       <div className="w-full md:w-24">
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
                       <div className="grid grid-cols-2 md:flex gap-4">
                         <div className="w-full md:w-32 space-y-1">
                            <label className="text-[9px] font-bold text-stone-400 uppercase">Quantity</label>
                            <input 
                              className="w-full bg-white border-stone-200 border rounded-xl p-3 text-sm font-mono outline-none"
                              type="number"
                              value={comp.quantity}
                              onChange={e => updateComponent(idx, 'quantity', Number(e.target.value))}
                            />
                         </div>
                         <div className="w-full md:w-24 space-y-1">
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
                       </div>
                       <button 
                        onClick={() => setForm({...form, components: form.components?.filter((_, i) => i !== idx)})}
                        className="w-full md:w-12 h-12 rounded-xl hover:bg-rose-50 text-rose-400 flex items-center justify-center transition-all bg-white border border-stone-200 md:border-0 md:bg-transparent"
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
                     <div key={idx} className="relative bg-stone-50 p-6 rounded-3xl border border-stone-100 flex gap-4 animate-in fade-in duration-500">
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
                        <button 
                           onClick={() => removePlatingStep(idx)}
                           className="absolute -top-2 -right-2 md:top-2 md:right-2 w-6 h-6 rounded-full bg-stone-200 text-stone-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                           title="Remove step"
                        >
                           <i className="fas fa-times text-[10px]"></i>
                        </button>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="px-6 py-4 md:px-12 md:py-8 border-t border-stone-100 bg-stone-50 flex flex-col md:flex-row justify-end gap-4 shrink-0">
             <button onClick={onClose} disabled={isSaving} className="w-full md:w-auto px-8 py-3 rounded-2xl text-sm font-bold text-stone-400 hover:text-stone-900 transition-all bg-white md:bg-transparent border md:border-0 border-stone-200">Discard</button>
             <button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto bg-stone-900 text-white px-12 py-3 rounded-2xl text-sm font-bold shadow-2xl hover:bg-stone-800 transition-all flex items-center justify-center gap-2">
                {isSaving && <i className="fas fa-circle-notch fa-spin"></i>}
                {existingDish ? 'UPDATE' : 'SAVE CONCEPT'}
             </button>
          </div>
       </div>
    </div>
  );
};

export default DishModule;
