
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Ingredient, IngredientCategory, UnitOfMeasure, Supplier, IngredientPricing, PriceHistoryEntry } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface IngredientModuleProps {
  ingredients: Ingredient[];
  suppliers: Supplier[]; 
  onAdd: (ing: Ingredient) => void;
  onUpdate: (ing: Ingredient) => void;
  onDelete: (id: string) => void;
  getUnitCost: (ing: Ingredient) => number;
  onAddSupplier: (s: Supplier) => void;
}

// Scanned raw data from AI
interface ScannedItem {
  id: string; // temp id for list management
  name: string;
  quantity: number; // Number of packs purchased
  packSize: number;
  packUnit: string;
  unitPrice: number; // Price per pack
  totalLinePrice: number; // Total cost on invoice line
  category: string;
}

// The rich state item used in the reconciliation form
interface ReconciledItem extends ScannedItem {
  selected: boolean; // Checkbox state
  status: 'new' | 'update' | 'match_found';
  linkedIngredientId?: string; // If updating existing
  matchConfidence: number; // 0-1
}

const IngredientModule: React.FC<IngredientModuleProps> = ({ ingredients, suppliers, onAdd, onUpdate, onDelete, getUnitCost, onAddSupplier }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('All');
  
  const [formData, setFormData] = useState<Partial<Ingredient>>({
    category: IngredientCategory.Produce,
    yieldPercent: 100,
    packUnit: 'kg',
    alternativeSuppliers: [],
    priceHistory: []
  });

  // Extract unique suppliers for the filter dropdown
  const uniqueSupplierNames = useMemo(() => {
    // Merge existing text-based suppliers and new Supplier Entities
    const set = new Set(ingredients.map(i => i.supplier).filter(Boolean));
    suppliers.forEach(s => set.add(s.name));
    return Array.from(set).sort();
  }, [ingredients, suppliers]);

  // Filter ingredients based on search and supplier
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ing => {
      const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSupplier = selectedSupplierFilter === 'All' || ing.supplier === selectedSupplierFilter;
      return matchesSearch && matchesSupplier;
    });
  }, [ingredients, searchQuery, selectedSupplierFilter]);

  // Helper to generate a new supplier object on the fly
  const createNewSupplier = (name: string): Supplier => ({
      id: `sup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: name,
      contactEmail: '', contactPhone: '', deliveryDays: [], minOrder: 0, 
      repName: '', repMobile: '', repEmail: '', notes: 'Quick created from Ingredient Editor'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- LOGIC FLOW 1: IMPLICIT CREATION & SAFETY NET ---
    
    // 1. Resolve Standard Supplier
    let finalSupplierId = formData.supplierId;
    let finalSupplierName = formData.supplier?.trim() || '';

    // Check if the typed name matches an existing supplier (case-insensitive check)
    const existingStandard = suppliers.find(s => s.name.toLowerCase() === finalSupplierName.toLowerCase());
    
    if (existingStandard) {
        // User typed a known name, bind to that ID
        finalSupplierId = existingStandard.id;
        finalSupplierName = existingStandard.name; 
    } else if (finalSupplierName && !existingStandard) {
        // "Ghost Supplier" - User typed a new name. Create it on the fly.
        const newSup = createNewSupplier(finalSupplierName);
        onAddSupplier(newSup); // Fire async save
        finalSupplierId = newSup.id;
        // Don't need to change name, it's already set
    } else {
        // Empty name? Fallback to Unknown (Safety Net)
        const unknownSup = suppliers.find(s => s.name.trim().toLowerCase() === 'unknown');
        if (unknownSup) {
            finalSupplierId = unknownSup.id;
            finalSupplierName = unknownSup.name;
        } else {
            // Create "Unknown"
            const newSup = createNewSupplier('Unknown');
            newSup.notes = 'System generated for orphaned ingredients';
            onAddSupplier(newSup);
            finalSupplierId = newSup.id;
            finalSupplierName = 'Unknown';
        }
    }

    // 2. Resolve Alternative Suppliers
    const finalAlternatives = (formData.alternativeSuppliers || []).map(alt => {
        let altId = alt.supplierId;
        let altName = alt.supplierName?.trim() || '';

        const existingAlt = suppliers.find(s => s.name.toLowerCase() === altName.toLowerCase());
        
        if (existingAlt) {
            altId = existingAlt.id;
            altName = existingAlt.name;
        } else if (altName && !existingAlt) {
            // Create new supplier for alternative
            const newSup = createNewSupplier(altName);
            onAddSupplier(newSup);
            altId = newSup.id;
        }

        return {
            ...alt,
            supplierId: altId,
            supplierName: altName
        };
    });

    const currentPrice = Number(formData.price) || 0;
    
    // --- LOGIC FLOW 3: AUDIT TRAIL (History Triggers) ---
    let history = [...(formData.priceHistory || [])];
    
    if (editingId) {
       const original = ingredients.find(i => i.id === editingId);
       if (original) {
          const hasPriceChange = original.price !== currentPrice;
          const hasSupplierChange = original.supplierId !== finalSupplierId; // Check ID stability

          if (hasPriceChange || hasSupplierChange) {
             history.push({
                date: Date.now(),
                price: currentPrice,
                supplier: finalSupplierName || 'Unknown',
                note: hasSupplierChange ? 'Supplier Change' : 'Price Update'
             });
          }
       }
    } else {
       // New Item - Initial History Point
       history.push({
          date: Date.now(),
          price: currentPrice,
          supplier: finalSupplierName || 'Unknown',
          note: 'Initial Entry'
       });
    }

    // Sort history by date descending just in case
    history.sort((a, b) => b.date - a.date);

    const newIng: Ingredient = {
      id: editingId || `ing-${Date.now()}`,
      name: formData.name || '',
      category: formData.category as IngredientCategory,
      
      // Root fields (Standard/Active)
      supplier: finalSupplierName,
      supplierId: finalSupplierId || '',
      packSize: Number(formData.packSize) || 0,
      packUnit: formData.packUnit as UnitOfMeasure,
      price: currentPrice,
      
      yieldPercent: Number(formData.yieldPercent) || 100,
      notes: formData.notes || '',
      lastUpdated: Date.now(),
      alternativeSuppliers: finalAlternatives,
      priceHistory: history
    };
    
    if (editingId) {
      onUpdate(newIng);
    } else {
      onAdd(newIng);
    }
    
    resetForm();
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    if (editingId === id) resetForm();
  };

  const handleEdit = (ing: Ingredient) => {
    setFormData({ 
       ...ing, 
       // Ensure arrays are initialized
       alternativeSuppliers: ing.alternativeSuppliers || [],
       priceHistory: ing.priceHistory || []
    });
    setEditingId(ing.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ category: IngredientCategory.Produce, yieldPercent: 100, packUnit: 'kg', alternativeSuppliers: [], priceHistory: [] });
  };

  const addAlternativeSupplier = () => {
    setFormData({
      ...formData,
      alternativeSuppliers: [
        ...(formData.alternativeSuppliers || []),
        { supplierId: '', supplierName: '', price: 0, packSize: 0, packUnit: 'kg' }
      ]
    });
  };

  const updateAlternative = (index: number, field: keyof IngredientPricing, value: any) => {
     const updated = [...(formData.alternativeSuppliers || [])];
     updated[index] = { ...updated[index], [field]: value };
     
     // Live-match ID if name changes
     if (field === 'supplierName') {
        const s = suppliers.find(sup => sup.name.toLowerCase() === value.toString().toLowerCase());
        updated[index].supplierId = s ? s.id : ''; // Clear ID if not found (implies new creation)
     }

     setFormData({ ...formData, alternativeSuppliers: updated });
  };

  const removeAlternative = (index: number) => {
     const updated = [...(formData.alternativeSuppliers || [])];
     updated.splice(index, 1);
     setFormData({ ...formData, alternativeSuppliers: updated });
  };

  // --- LOGIC FLOW 2: PROMOTION SYSTEM (Swapping) ---
  const makeStandard = (index: number) => {
     const alt = formData.alternativeSuppliers?.[index];
     if (!alt) return;

     // 1. Snapshot Current Standard
     const currentStandardAsAlternative: IngredientPricing = {
       supplierId: formData.supplierId || '',
       supplierName: formData.supplier || 'Previous Standard',
       price: Number(formData.price) || 0,
       packSize: Number(formData.packSize) || 0,
       packUnit: (formData.packUnit || 'kg') as UnitOfMeasure
     };

     // 2. Prepare Array: Swap the selected alt with the current standard snapshot
     const updatedAlternatives = [...(formData.alternativeSuppliers || [])];
     updatedAlternatives[index] = currentStandardAsAlternative;

     // 3. Promote & Update State
     setFormData({
        ...formData,
        supplier: alt.supplierName,
        supplierId: alt.supplierId,
        price: alt.price,
        packSize: alt.packSize,
        packUnit: alt.packUnit,
        alternativeSuppliers: updatedAlternatives
     });
  };

  const getPriceTrend = (history: PriceHistoryEntry[]) => {
    if (!history || history.length < 2) return null;
    const latest = history[0];
    const previous = history[1];
    const diff = latest.price - previous.price;
    const percent = (diff / previous.price) * 100;
    return {
       direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
       percent: Math.abs(percent).toFixed(1)
    };
  };

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        {!isAdding && !showScanner && (
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
             <div className="relative flex-1 max-w-md">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-xs"></i>
                <input 
                  type="text" 
                  placeholder="Search ingredients..." 
                  className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <div className="relative w-full md:w-48">
                <select 
                  className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none appearance-none"
                  value={selectedSupplierFilter}
                  onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                >
                  <option value="All">All Suppliers</option>
                  {uniqueSupplierNames.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-xs pointer-events-none"></i>
             </div>
          </div>
        )}
        
        {!isAdding && !showScanner && (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowScanner(true)}
              className="bg-stone-100 text-stone-600 border border-stone-200 px-6 py-3 rounded-xl text-xs font-bold hover:bg-stone-200 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <i className="fas fa-file-invoice-dollar"></i> <span className="hidden md:inline">ADD FROM INVOICE</span>
            </button>
            <button 
              onClick={() => {
                resetForm();
                setIsAdding(true);
              }}
              className="bg-stone-900 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <i className="fas fa-plus"></i> ADD ITEM
            </button>
          </div>
        )}
      </div>

      {showScanner ? (
        <InvoiceScanner 
          onClose={() => setShowScanner(false)} 
          ingredients={ingredients}
          suppliers={suppliers}
          onProcessBatch={(newIngs, updatedIngs, newSup) => {
             if (newSup) onAddSupplier(newSup);
             newIngs.forEach(i => onAdd(i));
             updatedIngs.forEach(i => onUpdate(i));
             setShowScanner(false);
          }}
        />
      ) : isAdding ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-[2rem] border border-stone-200 shadow-xl space-y-8 animate-in slide-in-from-top duration-300">
           <div className="flex justify-between items-center border-b border-stone-100 pb-6">
             <div>
               <h3 className="text-2xl font-bold serif text-stone-900">{editingId ? 'Edit Item' : 'New Item'}</h3>
               <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mt-1">Inventory Specification</p>
             </div>
             <button type="button" onClick={resetForm} className="w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors">
               <i className="fas fa-times text-stone-400"></i>
             </button>
           </div>
           
           {/* Basic Info */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
             <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Name</label>
               <input 
                 required
                 className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-stone-900 outline-none transition-all" 
                 type="text" 
                 placeholder="e.g. Maldon Sea Salt" 
                 value={formData.name || ''}
                 onChange={e => setFormData({...formData, name: e.target.value})}
               />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Category</label>
               <select 
                 className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm outline-none"
                 value={formData.category}
                 onChange={e => setFormData({...formData, category: e.target.value as IngredientCategory})}
               >
                 {Object.values(IngredientCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
               </select>
             </div>
           </div>
           
           <hr className="border-stone-100" />

           {/* Active / Standard Supplier Section */}
           <div>
               <h4 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
                 <i className="fas fa-star text-amber-500"></i> Standard Pricing (Active)
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Supplier</label>
                    <div className="relative">
                      <input 
                        className="w-full bg-white border-stone-200 border rounded-xl p-3 text-sm outline-none" 
                        type="text" 
                        list="supplier-list"
                        placeholder="Type to search or create..."
                        value={formData.supplier || ''}
                        onChange={e => {
                           const val = e.target.value;
                           const s = suppliers.find(sup => sup.name === val);
                           setFormData({...formData, supplier: val, supplierId: s?.id});
                        }}
                      />
                      <datalist id="supplier-list">
                         {suppliers.map(s => <option key={s.id} value={s.name} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Pack Size</label>
                    <input 
                      required
                      className="w-full bg-white border-stone-200 border rounded-xl p-3 text-sm font-mono outline-none" 
                      type="number" step="0.01" 
                      value={formData.packSize || ''}
                      onChange={e => setFormData({...formData, packSize: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Unit</label>
                    <select 
                      className="w-full bg-white border-stone-200 border rounded-xl p-3 text-sm outline-none"
                      value={formData.packUnit}
                      onChange={e => setFormData({...formData, packUnit: e.target.value as UnitOfMeasure})}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                      <option value="unit">unit</option>
                      <option value="bottle">bottle</option>
                      <option value="sheet">sheet</option>
                      <option value="pinch">pinch</option>
                      <option value="portion">portion</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Price ($)</label>
                    <input 
                      required
                      className="w-full bg-white border-stone-200 border rounded-xl p-3 text-sm font-mono outline-none" 
                      type="number" step="0.01"
                      value={formData.price || ''}
                      onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    />
                  </div>
               </div>
               <div className="mt-4 flex gap-4">
                  <div className="space-y-2 w-32">
                     <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Yield (%)</label>
                     <input 
                       className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm font-mono outline-none" 
                       type="number" 
                       value={formData.yieldPercent || 100}
                       onChange={e => setFormData({...formData, yieldPercent: Number(e.target.value)})}
                     />
                  </div>
               </div>
           </div>

           {/* Price History & Trends Analysis */}
           {editingId && formData.priceHistory && formData.priceHistory.length > 0 && (
             <div className="animate-in slide-in-from-left duration-500">
                <h4 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-chart-line text-blue-500"></i> Price Trend Analysis
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Visualization */}
                   <div className="bg-stone-900 rounded-xl p-6 text-white flex flex-col justify-between h-48">
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="text-[10px] font-bold uppercase text-stone-400 tracking-widest">Latest Movement</p>
                            {(() => {
                               const trend = getPriceTrend(formData.priceHistory!);
                               if (!trend) return <p className="text-sm font-bold mt-1">Insufficient Data</p>;
                               return (
                                  <div className="flex items-center gap-2 mt-1">
                                     <span className={`text-2xl font-black ${
                                        trend.direction === 'up' ? 'text-rose-400' : 
                                        trend.direction === 'down' ? 'text-emerald-400' : 'text-stone-300'
                                     }`}>
                                        {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '—'} {trend.percent}%
                                     </span>
                                     <span className="text-xs text-stone-400 font-medium">vs previous</span>
                                  </div>
                               );
                            })()}
                         </div>
                         <div className="text-right">
                             <p className="text-[10px] font-bold uppercase text-stone-400 tracking-widest">Current</p>
                             <p className="text-xl font-bold font-mono">${Number(formData.price).toFixed(2)}</p>
                         </div>
                      </div>

                      {/* CSS Bar Chart */}
                      <div className="flex items-end gap-2 h-20 w-full pt-4">
                         {formData.priceHistory.slice(0, 12).reverse().map((entry, idx, arr) => {
                            // Simple scaling
                            const max = Math.max(...arr.map(e => e.price)) * 1.1;
                            const height = (entry.price / max) * 100;
                            const isLatest = idx === arr.length - 1;
                            return (
                               <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-white text-stone-900 text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 font-bold transition-opacity">
                                     ${entry.price.toFixed(2)} ({new Date(entry.date).toLocaleDateString()})
                                  </div>
                                  <div 
                                    className={`w-full rounded-t-sm transition-all ${isLatest ? 'bg-blue-500' : 'bg-stone-700 hover:bg-stone-600'}`} 
                                    style={{ height: `${height}%` }}
                                  ></div>
                               </div>
                            );
                         })}
                      </div>
                   </div>

                   {/* History List */}
                   <div className="bg-stone-50 rounded-xl border border-stone-100 overflow-hidden flex flex-col h-48">
                      <div className="px-4 py-3 border-b border-stone-200 bg-stone-100">
                         <h5 className="text-[10px] font-bold uppercase text-stone-500">History Log</h5>
                      </div>
                      <div className="overflow-y-auto flex-1 p-2 space-y-1">
                         {formData.priceHistory.map((entry, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 hover:bg-white rounded text-xs transition-colors">
                               <div>
                                  <p className="font-bold text-stone-700">{entry.supplier}</p>
                                  <p className="text-[10px] text-stone-400">{new Date(entry.date).toLocaleDateString()}</p>
                               </div>
                               <div className="text-right">
                                  <p className="font-mono font-bold">${entry.price.toFixed(2)}</p>
                                  {entry.note && <p className="text-[9px] text-stone-400 italic">{entry.note}</p>}
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* Alternative Suppliers */}
           <div>
               <div className="flex justify-between items-center mb-4">
                 <h4 className="text-sm font-bold text-stone-500">Alternative Suppliers</h4>
                 <button type="button" onClick={addAlternativeSupplier} className="text-xs font-bold text-stone-900 border-b-2 border-stone-900 hover:text-amber-600 transition-colors">
                    + ADD SUPPLIER
                 </button>
               </div>
               
               <div className="space-y-3">
                  {formData.alternativeSuppliers?.length === 0 && (
                     <p className="text-xs text-stone-400 italic">No alternative suppliers listed.</p>
                  )}
                  {formData.alternativeSuppliers?.map((alt, idx) => (
                     <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-stone-50 p-3 rounded-lg border border-stone-100 animate-in slide-in-from-left duration-200">
                        <div className="col-span-3">
                           <input 
                              list="supplier-list"
                              className="w-full bg-white border border-stone-200 rounded p-2 text-xs outline-none"
                              placeholder="Supplier Name"
                              value={alt.supplierName}
                              onChange={(e) => updateAlternative(idx, 'supplierName', e.target.value)}
                           />
                        </div>
                        <div className="col-span-2">
                           <input 
                             placeholder="Size"
                             type="number"
                             className="w-full bg-white border border-stone-200 rounded p-2 text-xs outline-none"
                             value={alt.packSize}
                             onChange={(e) => updateAlternative(idx, 'packSize', Number(e.target.value))}
                           />
                        </div>
                        <div className="col-span-2">
                           <select 
                             className="w-full bg-white border border-stone-200 rounded p-2 text-xs outline-none"
                             value={alt.packUnit}
                             onChange={(e) => updateAlternative(idx, 'packUnit', e.target.value)}
                           >
                             <option value="kg">kg</option>
                             <option value="g">g</option>
                             <option value="L">L</option>
                             <option value="ml">ml</option>
                             <option value="unit">unit</option>
                             <option value="bottle">bottle</option>
                           </select>
                        </div>
                        <div className="col-span-2">
                           <input 
                             placeholder="Price"
                             type="number"
                             className="w-full bg-white border border-stone-200 rounded p-2 text-xs outline-none font-mono"
                             value={alt.price}
                             onChange={(e) => updateAlternative(idx, 'price', Number(e.target.value))}
                           />
                        </div>
                        <div className="col-span-3 flex justify-end gap-2">
                           <button 
                             type="button" 
                             onClick={() => makeStandard(idx)}
                             className="px-2 py-1 bg-white border border-stone-200 rounded text-[10px] font-bold text-stone-500 hover:text-amber-600 hover:border-amber-300 transition-colors"
                             title="Set as Standard Price"
                           >
                              Make Std
                           </button>
                           <button 
                              type="button"
                              onClick={() => removeAlternative(idx)}
                              className="w-6 h-6 flex items-center justify-center text-stone-300 hover:text-rose-500 transition-colors"
                           >
                              <i className="fas fa-trash-alt text-xs"></i>
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
           </div>

            <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Internal Notes</label>
               <textarea 
                 className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm outline-none min-h-[80px]" 
                 placeholder="Specific brand preference, storage requirements, etc..."
                 value={formData.notes || ''}
                 onChange={e => setFormData({...formData, notes: e.target.value})}
               />
             </div>

           <div className="flex justify-between pt-4 border-t border-stone-100">
             {editingId && (
               <button 
                  type="button" 
                  onClick={() => handleDelete(editingId)}
                  className="text-rose-500 px-6 py-3 rounded-xl font-bold text-sm hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 z-50"
               >
                 DELETE ITEM
               </button>
             )}
             <button type="submit" className="bg-stone-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-stone-800 transition-all shadow-lg ml-auto">
               {editingId ? 'UPDATE ITEM' : 'SAVE ITEM'}
             </button>
           </div>
        </form>
      ) : (
        /* Simplified List View */
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
           <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-stone-50 border-b border-stone-200 text-[10px] font-bold uppercase text-stone-400 tracking-wider">
              <div className="col-span-3">Ingredient</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-3">Standard Supplier</div>
              <div className="col-span-2 text-right">Pack Cost</div>
              <div className="col-span-2 text-right">Base Cost (Yielded)</div>
           </div>
           
           <div className="divide-y divide-stone-100">
              {filteredIngredients.length > 0 ? filteredIngredients.map(ing => (
                <div key={ing.id} className="group relative hover:bg-stone-50 transition-colors">
                   {/* Clickable Area for Edit */}
                   <div 
                      onClick={() => handleEdit(ing)}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 items-center cursor-pointer"
                   >
                       {/* Content */}
                       <div className="md:col-span-3 flex justify-between md:block">
                          <span className="font-semibold text-stone-900 text-sm md:text-sm">{ing.name}</span>
                          <span className="md:hidden text-[10px] font-bold uppercase bg-stone-100 px-2 py-1 rounded text-stone-500">{ing.category}</span>
                       </div>
                       
                       <div className="hidden md:block col-span-2">
                          <span className="text-[10px] font-bold uppercase bg-stone-100 px-2 py-1 rounded text-stone-500">{ing.category}</span>
                       </div>
                       
                       <div className="md:col-span-3 text-xs text-stone-500">
                          <span className="md:hidden font-bold mr-1 text-stone-400">Supplier:</span>
                          {ing.supplier}
                          {ing.alternativeSuppliers && ing.alternativeSuppliers.length > 0 && (
                             <span className="ml-2 text-[9px] bg-stone-100 text-stone-400 px-1 rounded-full px-1.5" title={`${ing.alternativeSuppliers.length} alternatives available`}>+{ing.alternativeSuppliers.length}</span>
                          )}
                       </div>
                       
                       <div className="md:col-span-2 text-left md:text-right text-xs md:text-sm font-mono text-stone-600 flex justify-between md:block mt-1 md:mt-0">
                          <span className="md:hidden text-stone-400">Pack:</span>
                          <span>${ing.price.toFixed(2)} / {ing.packSize}{ing.packUnit}</span>
                       </div>
                       
                       <div className="md:col-span-2 text-left md:text-right text-xs md:text-sm font-mono font-bold text-emerald-700 flex justify-between md:block">
                          <span className="md:hidden text-stone-400">Unit Base:</span>
                          <span>${getUnitCost(ing).toFixed(2)} / {ing.packUnit === 'kg' ? 'g' : ing.packUnit === 'L' ? 'ml' : ing.packUnit}</span>
                       </div>
                   </div>

                   {/* Delete Button (Sibling, not child of clickable area) */}
                   <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(ing.id); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center shadow-sm z-50 md:opacity-0 md:group-hover:opacity-100 transition-all cursor-pointer"
                   >
                     <i className="fas fa-trash-alt text-xs pointer-events-none"></i>
                   </button>
                </div>
              )) : (
                <div className="p-8 text-center text-stone-400 italic">No ingredients found matching your search.</div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

interface InvoiceScannerProps {
  onClose: () => void;
  ingredients: Ingredient[];
  suppliers: Supplier[];
  onProcessBatch: (newIngredients: Ingredient[], updatedIngredients: Ingredient[], newSupplier?: Supplier) => void;
}

// ... (InvoiceScanner component remains unchanged)
const InvoiceScanner: React.FC<InvoiceScannerProps> = ({ onClose, ingredients, suppliers, onProcessBatch }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reconciledItems, setReconciledItems] = useState<ReconciledItem[]>([]);
  const [detectedSupplierName, setDetectedSupplierName] = useState('');
  const [matchedSupplierId, setMatchedSupplierId] = useState<string>('new');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    try {
      // FIX 1: Safe API Key Access
      const apiKey = typeof process !== "undefined" ? process.env.API_KEY : "";
      
      if (!apiKey) {
        alert("Configuration Error: API_KEY is missing. Please ensure your environment is set up correctly.");
        setIsAnalyzing(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // FIX 2: Dynamic MIME Type Extraction
      // Extracts "image/png" from "data:image/png;base64,..."
      const mimeType = base64Image.substring(base64Image.indexOf(":") + 1, base64Image.indexOf(";"));
      const base64Data = base64Image.split(',')[1];
      
      const prompt = `
        Analyze this food supplier invoice image. Extract the Supplier Name and a list of line items. 
        For each item, extract:
        - Item Name
        - Quantity (number of packs purchased, defaults to 1 if not specified)
        - Pack Size (numeric volume/weight per pack)
        - Pack Unit (string)
        - Unit Price (The price for a SINGLE pack/unit. If only Total is shown, calculate Unit Price = Total / Quantity)
        - Total Line Price (total cost for this line)
        - Category (Produce, Protein, Dairy, Dry Goods, Spice, Packaging, Other)

        Map units strictly to: kg, g, L, ml, unit, bottle, sheet, pinch, portion.
        
        Return JSON structure: 
        { 
          "supplier": string, 
          "items": [ 
            { 
              "name": string, 
              "quantity": number,
              "packSize": number, 
              "packUnit": string, 
              "unitPrice": number, 
              "totalLinePrice": number,
              "category": string 
            } 
          ] 
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: mimeType, data: base64Data } },
            { text: prompt }
          ]
        },
        config: {
           responseMimeType: "application/json",
           responseSchema: {
              type: Type.OBJECT,
              properties: {
                 supplier: { type: Type.STRING },
                 items: {
                    type: Type.ARRAY,
                    items: {
                       type: Type.OBJECT,
                       properties: {
                          name: { type: Type.STRING },
                          quantity: { type: Type.NUMBER },
                          packSize: { type: Type.NUMBER },
                          packUnit: { type: Type.STRING },
                          unitPrice: { type: Type.NUMBER },
                          totalLinePrice: { type: Type.NUMBER },
                          category: { type: Type.STRING }
                       }
                    }
                 }
              }
           }
        }
      });

      const text = response.text;
      if (text) {
        const data = JSON.parse(text);
        
        setDetectedSupplierName(data.supplier || 'Unknown Supplier');
        autoMatchSupplier(data.supplier || '');

        const items: ScannedItem[] = (data.items || []).map((item: any, i: number) => ({
           id: `scan-${i}`,
           name: item.name,
           quantity: Number(item.quantity) || 1,
           packSize: Number(item.packSize) || 1,
           packUnit: item.packUnit,
           unitPrice: Number(item.unitPrice) || (Number(item.totalLinePrice) && Number(item.quantity) ? Number(item.totalLinePrice) / Number(item.quantity) : 0),
           totalLinePrice: Number(item.totalLinePrice) || 0,
           category: item.category
        }));
        
        autoMatchItems(items);
      }

    } catch (e) {
      console.error("Invoice Analysis Failed:", e);
      alert('Failed to analyze invoice.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const autoMatchSupplier = (name: string) => {
     if (!name) return;
     const lower = name.toLowerCase();
     const found = suppliers.find(s => s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase()));
     if (found) {
        setMatchedSupplierId(found.id);
     } else {
        setMatchedSupplierId('new');
     }
  };

  const autoMatchItems = (scanned: ScannedItem[]) => {
     const reconciled: ReconciledItem[] = scanned.map(item => {
        const lowerName = item.name.toLowerCase();
        const match = ingredients.find(ing => 
           ing.name.toLowerCase().includes(lowerName) || 
           lowerName.includes(ing.name.toLowerCase())
        );
        
        if (match) {
           return {
              ...item,
              selected: true,
              status: 'match_found',
              linkedIngredientId: match.id,
              matchConfidence: 0.9
           };
        } else {
           return {
              ...item,
              selected: true,
              status: 'new',
              matchConfidence: 0
           };
        }
     });
     setReconciledItems(reconciled);
  };

  const updateReconciledItem = (index: number, updates: Partial<ReconciledItem>) => {
     const newItems = [...reconciledItems];
     newItems[index] = { ...newItems[index], ...updates };
     if (updates.linkedIngredientId) {
        newItems[index].status = 'update';
     }
     setReconciledItems(newItems);
  };

  const toggleSelection = (index: number) => {
     const newItems = [...reconciledItems];
     newItems[index].selected = !newItems[index].selected;
     setReconciledItems(newItems);
  };

  const handleProcess = () => {
    let finalSupplierId = matchedSupplierId;
    let finalSupplierName = detectedSupplierName;
    let newSupplierObj: Supplier | undefined;

    if (matchedSupplierId === 'new') {
       const newId = `sup-${Date.now()}`;
       finalSupplierId = newId;
       newSupplierObj = {
          id: newId,
          name: detectedSupplierName,
          contactEmail: '',
          contactPhone: '',
          deliveryDays: [],
          minOrder: 0,
          repName: '',
          repMobile: '',
          repEmail: '',
          notes: 'Created via Invoice Scan'
       };
    } else {
       const existing = suppliers.find(s => s.id === matchedSupplierId);
       if (existing) finalSupplierName = existing.name;
    }

    const newIngredients: Ingredient[] = [];
    const updatedIngredients: Ingredient[] = [];

    reconciledItems.forEach(item => {
       if (!item.selected) return;

       if (item.status === 'new') {
          newIngredients.push({
             id: `ing-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
             name: item.name,
             category: (Object.values(IngredientCategory).includes(item.category as any) ? item.category : 'Other') as IngredientCategory,
             supplier: finalSupplierName,
             supplierId: finalSupplierId,
             packSize: Number(item.packSize),
             packUnit: (['kg','g','L','ml','unit','bottle','sheet','pinch','portion'].includes(item.packUnit) ? item.packUnit : 'unit') as UnitOfMeasure,
             price: Number(item.unitPrice),
             yieldPercent: 100,
             notes: 'Imported from Invoice',
             lastUpdated: Date.now(),
             alternativeSuppliers: [],
             priceHistory: [{ date: Date.now(), price: Number(item.unitPrice), supplier: finalSupplierName, note: 'Initial Import' }]
          });
       } else if (item.status === 'update' || item.status === 'match_found') {
          if (!item.linkedIngredientId) return;
          const original = ingredients.find(i => i.id === item.linkedIngredientId);
          if (original) {
             const updated = { ...original };
             let historyNote = '';
             let shouldUpdate = false;

             // --- LOGIC FLOW 4: INVOICE SCANNER SOURCE AWARENESS ---
             // Check if Supplier changed
             if (original.supplierId !== finalSupplierId) {
                updated.supplier = finalSupplierName;
                updated.supplierId = finalSupplierId;
                historyNote = 'Supplier Change (Invoice)';
                shouldUpdate = true;
             }

             // Check if Price changed
             if (Number(item.unitPrice) !== original.price) {
                updated.price = Number(item.unitPrice);
                if (!historyNote) historyNote = 'Invoice Update';
                shouldUpdate = true;
             }

             if (shouldUpdate) {
                updated.lastUpdated = Date.now();
                updated.priceHistory = [
                   ...(updated.priceHistory || []),
                   { 
                      date: Date.now(), 
                      price: Number(item.unitPrice), 
                      supplier: finalSupplierName, 
                      note: historyNote
                   }
                ].sort((a,b) => b.date - a.date);
                updatedIngredients.push(updated);
             }
          }
       }
    });

    onProcessBatch(newIngredients, updatedIngredients, newSupplierObj);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-stone-200 shadow-xl overflow-hidden animate-in slide-in-from-top duration-300 flex flex-col h-[90vh] md:h-[85vh] w-full max-w-7xl mx-auto z-50 fixed inset-0 md:relative md:inset-auto">
       <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50 shrink-0">
          <div>
            <h2 className="text-2xl font-bold serif text-stone-900">Add from Invoice</h2>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mt-1">AI Reconciliation Engine</p>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full hover:bg-stone-200 flex items-center justify-center transition-colors">
             <i className="fas fa-times text-stone-400"></i>
          </button>
       </div>

       <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-1/3 bg-stone-900 p-6 flex flex-col justify-center items-center relative overflow-hidden border-r border-stone-800">
             {image ? (
               <div className="relative w-full h-full flex items-center justify-center">
                 <img src={image} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" alt="Invoice" />
                 {isAnalyzing && (
                    <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                       <i className="fas fa-circle-notch fa-spin text-4xl mb-4 text-amber-500"></i>
                       <p className="font-bold tracking-widest uppercase text-sm">Extracting Data...</p>
                    </div>
                 )}
               </div>
             ) : (
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="border-2 border-dashed border-stone-700 rounded-2xl w-full h-64 flex flex-col items-center justify-center text-stone-500 hover:text-stone-300 transition-all cursor-pointer hover:border-amber-500/50"
               >
                 <i className="fas fa-file-invoice text-4xl mb-4"></i>
                 <p className="font-bold uppercase text-xs tracking-widest">Upload Invoice</p>
                 <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
               </div>
             )}
          </div>

          <div className="w-full md:w-2/3 bg-stone-50 flex flex-col h-full overflow-hidden">
             {reconciledItems.length > 0 ? (
               <div className="flex flex-col h-full">
                  <div className="p-6 bg-white border-b border-stone-200 shadow-sm z-10">
                     <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="flex-1">
                           <p className="text-[10px] font-bold uppercase text-stone-400 tracking-wider mb-1">Detected Supplier</p>
                           <input 
                              className="text-xl font-bold text-stone-900 bg-transparent outline-none w-full"
                              value={detectedSupplierName}
                              onChange={(e) => setDetectedSupplierName(e.target.value)}
                           />
                        </div>
                        <div className="flex-1 w-full">
                           <p className="text-[10px] font-bold uppercase text-stone-400 tracking-wider mb-1">Action</p>
                           <select 
                              className={`w-full p-2 rounded-lg text-sm font-bold border outline-none ${matchedSupplierId === 'new' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}
                              value={matchedSupplierId}
                              onChange={(e) => setMatchedSupplierId(e.target.value)}
                           >
                              <option value="new">+ Create New Supplier</option>
                              {suppliers.map(s => <option key={s.id} value={s.id}>Map to: {s.name}</option>)}
                           </select>
                        </div>
                     </div>
                  </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {reconciledItems.map((item, idx) => {
                       const linkedIngredient = ingredients.find(i => i.id === item.linkedIngredientId);
                       return (
                         <div key={idx} className={`flex gap-4 p-4 rounded-xl border transition-all ${
                            !item.selected ? 'opacity-50 bg-stone-100 border-stone-200 grayscale' :
                            item.status === 'new' ? 'bg-white border-stone-200 hover:shadow-md' :
                            'bg-blue-50/30 border-blue-100 hover:shadow-md'
                         }`}>
                            <div className="pt-2">
                               <input 
                                 type="checkbox" 
                                 checked={item.selected} 
                                 onChange={() => toggleSelection(idx)}
                                 className="w-5 h-5 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                               />
                            </div>
                            <div className="flex-1">
                               <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-3">
                                  <div className="w-32 shrink-0">
                                     <select 
                                        disabled={!item.selected}
                                        className={`w-full text-[10px] font-black uppercase py-1.5 px-2 rounded border outline-none ${
                                           item.status === 'new' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                           'bg-blue-100 text-blue-700 border-blue-200'
                                        }`}
                                        value={item.status}
                                        onChange={(e) => updateReconciledItem(idx, { status: e.target.value as any })}
                                     >
                                        <option value="new">Create New</option>
                                        <option value="update">Update Existing</option>
                                        <option value="match_found">Match Found</option>
                                     </select>
                                  </div>
                                  <div className="flex-1 w-full">
                                     {item.status === 'new' ? (
                                        <input 
                                           disabled={!item.selected}
                                           className="w-full font-bold text-stone-900 bg-transparent border-b border-dashed border-stone-300 focus:border-stone-900 outline-none pb-1"
                                           value={item.name}
                                           onChange={(e) => updateReconciledItem(idx, { name: e.target.value })}
                                        />
                                     ) : (
                                        <div className="relative">
                                           <select 
                                              disabled={!item.selected}
                                              className="w-full font-bold text-stone-900 bg-transparent border-b border-dashed border-blue-300 focus:border-blue-900 outline-none pb-1 appearance-none"
                                              value={item.linkedIngredientId || ''}
                                              onChange={(e) => updateReconciledItem(idx, { linkedIngredientId: e.target.value, status: 'update' })}
                                           >
                                              <option value="">Select Ingredient...</option>
                                              {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                                           </select>
                                           <i className="fas fa-link absolute right-0 top-1 text-blue-300 text-xs pointer-events-none"></i>
                                        </div>
                                     )}
                                  </div>
                               </div>
                               <div className="grid grid-cols-4 gap-3">
                                  <div className="col-span-1 space-y-1">
                                     <label className="text-[9px] font-bold text-stone-400 uppercase">Pack Size</label>
                                     <input 
                                        type="number" 
                                        disabled={!item.selected}
                                        className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs" 
                                        value={item.packSize} 
                                        onChange={(e) => updateReconciledItem(idx, { packSize: Number(e.target.value) })} 
                                     />
                                  </div>
                                  <div className="col-span-1 space-y-1">
                                     <label className="text-[9px] font-bold text-stone-400 uppercase">Unit</label>
                                     <select 
                                        disabled={!item.selected}
                                        className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs"
                                        value={item.packUnit}
                                        onChange={(e) => updateReconciledItem(idx, { packUnit: e.target.value })} 
                                     >
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="L">L</option>
                                        <option value="ml">ml</option>
                                        <option value="unit">unit</option>
                                        <option value="bottle">bottle</option>
                                     </select>
                                  </div>
                                  <div className="col-span-1 space-y-1">
                                     <label className="text-[9px] font-bold text-stone-400 uppercase">Unit Price</label>
                                     <input 
                                        type="number" 
                                        disabled={!item.selected}
                                        className="w-full bg-white border border-stone-200 rounded p-1.5 text-xs font-mono font-bold" 
                                        value={item.unitPrice} 
                                        onChange={(e) => updateReconciledItem(idx, { unitPrice: Number(e.target.value) })} 
                                     />
                                  </div>
                                  <div className="col-span-1 space-y-1">
                                     <label className="text-[9px] font-bold text-stone-400 uppercase">Total Line</label>
                                     <div className="p-1.5 text-xs font-mono text-stone-500 bg-stone-50 rounded border border-stone-100">
                                        ${item.totalLinePrice.toFixed(2)}
                                     </div>
                                  </div>
                                  {(item.status === 'update' || item.status === 'match_found') && linkedIngredient && item.selected && (
                                     <div className="col-span-4 flex items-center gap-3 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 mt-2">
                                        <div className="text-[10px] text-blue-400 font-bold uppercase">Variance Analysis</div>
                                        <div className="flex-1 text-right">
                                           <span className="text-xs font-mono text-stone-400 line-through mr-2">${linkedIngredient.price.toFixed(2)}</span>
                                           <span className={`text-xs font-mono font-bold ${
                                              item.unitPrice > linkedIngredient.price ? 'text-rose-500' : 
                                              item.unitPrice < linkedIngredient.price ? 'text-emerald-500' : 'text-stone-500'
                                           }`}>
                                              {item.unitPrice > linkedIngredient.price ? '▲' : item.unitPrice < linkedIngredient.price ? '▼' : ''} 
                                              ${Math.abs(item.unitPrice - linkedIngredient.price).toFixed(2)}
                                           </span>
                                        </div>
                                     </div>
                                  )}
                               </div>
                            </div>
                         </div>
                       );
                    })}
                 </div>

                 <div className="p-6 border-t border-stone-100 bg-white flex justify-end gap-4 shadow-lg z-20">
                    <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100">Cancel</button>
                    <button type="button" onClick={handleProcess} className="bg-stone-900 text-white px-8 py-3 rounded-xl text-xs font-bold shadow-lg hover:bg-stone-800 flex items-center gap-2">
                       <i className="fas fa-check-circle"></i>
                       PROCESS ({reconciledItems.filter(i => i.selected).length})
                    </button>
                 </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-stone-300 p-12 text-center">
                  <i className="fas fa-receipt text-6xl mb-6 text-stone-200"></i>
                  <p className="font-serif text-xl text-stone-400">Ready to Scan</p>
                  <p className="text-sm mt-2 max-w-xs mx-auto">Upload an invoice to detect items, match suppliers, and update prices automatically.</p>
               </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default IngredientModule;
