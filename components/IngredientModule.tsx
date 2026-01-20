
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Ingredient, IngredientCategory, UnitOfMeasure, Supplier, IngredientPricing, PriceHistoryEntry } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface IngredientModuleProps {
  ingredients: Ingredient[];
  suppliers: Supplier[]; 
  onAdd: (ing: Ingredient) => void;
  onUpdate: (ing: Ingredient) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  getUnitCost: (ing: Ingredient) => number;
  onAddSupplier: (s: Supplier) => void;
}

const IngredientModule: React.FC<IngredientModuleProps> = ({ ingredients, suppliers, onAdd, onUpdate, onDelete, onBulkDelete, getUnitCost, onAddSupplier }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('All');
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<Partial<Ingredient>>({
    category: IngredientCategory.Produce,
    yieldPercent: 100,
    packUnit: 'kg',
    alternativeSuppliers: [],
    priceHistory: []
  });

  const uniqueSupplierNames = useMemo(() => {
    const set = new Set(ingredients.map(i => i.supplier).filter(Boolean));
    suppliers.forEach(s => set.add(s.name));
    return Array.from(set).sort();
  }, [ingredients, suppliers]);

  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ing => {
      const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSupplier = selectedSupplierFilter === 'All' || ing.supplier === selectedSupplierFilter;
      return matchesSearch && matchesSupplier;
    });
  }, [ingredients, searchQuery, selectedSupplierFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const linkedSupplier = suppliers.find(s => s.id === formData.supplierId || s.name === formData.supplier);
    const currentPrice = Number(formData.price) || 0;
    const currentSupplierName = formData.supplier || linkedSupplier?.name || '';
    
    let history = [...(formData.priceHistory || [])];
    if (editingId) {
       const original = ingredients.find(i => i.id === editingId);
       if (original && original.price !== currentPrice) {
          history.push({ date: Date.now(), price: currentPrice, supplier: currentSupplierName, note: 'Price Update' });
       }
    } else {
       history.push({ date: Date.now(), price: currentPrice, supplier: currentSupplierName, note: 'Initial Entry' });
    }
    history.sort((a, b) => b.date - a.date);

    const newIng: Ingredient = {
      id: editingId || `ing-${Date.now()}`,
      name: formData.name || '',
      category: formData.category as IngredientCategory,
      supplier: currentSupplierName,
      supplierId: formData.supplierId || linkedSupplier?.id || '',
      packSize: Number(formData.packSize) || 0,
      packUnit: formData.packUnit as UnitOfMeasure,
      price: currentPrice,
      yieldPercent: Number(formData.yieldPercent) || 100,
      notes: formData.notes || '',
      lastUpdated: Date.now(),
      alternativeSuppliers: formData.alternativeSuppliers || [],
      priceHistory: history
    };
    
    if (editingId) onUpdate(newIng);
    else onAdd(newIng);
    resetForm();
  };

  const handleEdit = (ing: Ingredient) => {
    setFormData({ ...ing });
    setEditingId(ing.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ category: IngredientCategory.Produce, yieldPercent: 100, packUnit: 'kg', alternativeSuppliers: [], priceHistory: [] });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredIngredients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredIngredients.map(i => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedIds.length} ingredients? This cannot be undone.`)) {
      if (onBulkDelete) {
        onBulkDelete(selectedIds);
      } else {
        selectedIds.forEach(id => onDelete(id));
      }
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-0 relative">
      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && !isAdding && !showScanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
           <div className="bg-stone-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-stone-700">
              <span className="text-xs font-black uppercase tracking-widest text-stone-400">
                {selectedIds.length} Selected
              </span>
              <div className="w-px h-4 bg-stone-700"></div>
              <button 
                onClick={handleBulkDelete}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-2"
              >
                <i className="fas fa-trash-alt"></i> DELETE ALL
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold text-stone-300 hover:text-white"
              >
                CANCEL
              </button>
           </div>
        </div>
      )}

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
            <button onClick={() => setShowScanner(true)} className="bg-stone-100 text-stone-600 border border-stone-200 px-6 py-3 rounded-xl text-xs font-bold hover:bg-stone-200 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-file-invoice-dollar"></i> <span className="hidden md:inline">ADD FROM INVOICE</span>
            </button>
            <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-stone-900 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-2">
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
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
             <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Name</label>
               <input 
                 required
                 className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-stone-900 outline-none transition-all" 
                 type="text" 
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

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
              <div className="space-y-2 lg:col-span-1">
                <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Supplier</label>
                <input 
                  className="w-full bg-white border-stone-200 border rounded-xl p-3 text-sm outline-none" 
                  type="text" 
                  value={formData.supplier || ''}
                  onChange={e => setFormData({...formData, supplier: e.target.value})}
                />
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
                <select className="w-full bg-white border-stone-200 border rounded-xl p-3 text-sm outline-none" value={formData.packUnit} onChange={e => setFormData({...formData, packUnit: e.target.value as UnitOfMeasure})}>
                  <option value="kg">kg</option><option value="g">g</option><option value="L">L</option><option value="ml">ml</option><option value="unit">unit</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Price ($)</label>
                <input required className="w-full bg-white border-stone-200 border rounded-xl p-3 text-sm font-mono outline-none" type="number" step="0.01" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
              </div>
           </div>

           <div className="flex justify-between pt-4 border-t border-stone-100">
             {editingId && <button type="button" onClick={() => { if(window.confirm("Delete?")) onDelete(editingId); resetForm(); }} className="text-rose-500 px-6 py-3 rounded-xl font-bold text-sm hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 uppercase tracking-widest">Delete Item</button>}
             <button type="submit" className="bg-stone-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-stone-800 transition-all shadow-lg ml-auto uppercase tracking-widest">Save Item</button>
           </div>
        </form>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
           <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-stone-50 border-b border-stone-200 text-[10px] font-bold uppercase text-stone-400 tracking-wider">
              <div className="col-span-1 flex items-center justify-center">
                 <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900" 
                  checked={filteredIngredients.length > 0 && selectedIds.length === filteredIngredients.length}
                  onChange={toggleSelectAll}
                 />
              </div>
              <div className="col-span-3 md:col-span-3">Ingredient</div>
              <div className="hidden md:block md:col-span-2">Category</div>
              <div className="hidden md:block md:col-span-2">Standard Supplier</div>
              <div className="col-span-4 md:col-span-2 text-right">Pack Cost</div>
              <div className="col-span-4 md:col-span-2 text-right">Base Cost</div>
           </div>
           
           <div className="divide-y divide-stone-100">
              {filteredIngredients.length > 0 ? filteredIngredients.map(ing => (
                <SwipeableIngredientItem 
                  key={ing.id} 
                  ingredient={ing} 
                  getUnitCost={getUnitCost}
                  onEdit={() => handleEdit(ing)}
                  onDelete={() => { if(window.confirm("Delete this ingredient?")) onDelete(ing.id); }}
                  isSelected={selectedIds.includes(ing.id)}
                  onSelect={() => toggleSelectOne(ing.id)}
                  isSwiped={swipedId === ing.id}
                  setSwiped={(swiped) => setSwipedId(swiped ? ing.id : null)}
                />
              )) : (
                <div className="p-8 text-center text-stone-400 italic">No ingredients found.</div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

// --- Swipeable Sub-Component (MODERN MOBILE INTERACTION) ---
const SwipeableIngredientItem = ({ ingredient: ing, getUnitCost, onEdit, onDelete, isSelected, onSelect, isSwiped, setSwiped }: any) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchCurrent, setTouchCurrent] = useState<number | null>(null);
  const threshold = 70;

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => touchStart !== null && setTouchCurrent(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStart !== null && touchCurrent !== null) {
      const diff = touchStart - touchCurrent;
      if (diff > threshold) setSwiped(true);
      else if (diff < -threshold) setSwiped(false);
    }
    setTouchStart(null);
    setTouchCurrent(null);
  };

  const getOffset = () => {
    if (isSwiped) return -threshold;
    if (touchStart !== null && touchCurrent !== null) {
      const diff = touchStart - touchCurrent;
      return diff > 0 ? -Math.min(diff, threshold + 20) : 0;
    }
    return 0;
  };

  return (
    <div className={`relative overflow-hidden bg-rose-600 select-none ${isSelected ? 'ring-2 ring-stone-900 ring-inset' : ''}`}>
      {/* Action Layer */}
      <div className="absolute inset-0 flex justify-end items-center px-6 pointer-events-none">
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="pointer-events-auto flex items-center justify-center text-white gap-2 font-bold text-xs h-full">
          <i className="fas fa-trash-alt"></i>
          <span>DELETE</span>
        </button>
      </div>

      {/* Main Layer */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
           // If we click the checkbox area, just select.
           // If we click the rest, edit.
           if ((e.target as HTMLElement).closest('.select-area')) return;
           onEdit();
        }}
        style={{ transform: `translateX(${getOffset()}px)` }}
        className={`relative bg-white grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer hover:bg-stone-50 z-10 ${touchStart === null ? 'swipe-transition' : ''}`}
      >
        <div className="col-span-1 flex items-center justify-center select-area">
           <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900" 
            checked={isSelected}
            onChange={(e) => { e.stopPropagation(); onSelect(); }}
           />
        </div>

        <div className="col-span-11 grid grid-cols-1 md:grid-cols-11 gap-2 md:gap-4 items-center">
            <div className="md:col-span-3 flex justify-between items-center md:block">
              <span className="font-semibold text-stone-900 text-sm">{ing.name}</span>
              <span className="md:hidden text-[9px] font-bold uppercase bg-stone-100 px-2 py-0.5 rounded text-stone-400">{ing.category}</span>
            </div>
            <div className="hidden md:block col-span-2 text-[10px] font-bold uppercase text-stone-400">{ing.category}</div>
            <div className="hidden md:block col-span-2 text-xs text-stone-500">{ing.supplier}</div>
            <div className="col-span-5 md:col-span-2 text-right font-mono text-xs text-stone-500 flex justify-between md:block">
               <span className="md:hidden text-stone-400 uppercase text-[9px]">Pack Cost</span>
               <span>${ing.price.toFixed(2)} / {ing.packSize}{ing.packUnit}</span>
            </div>
            <div className="col-span-5 md:col-span-2 text-right font-mono text-xs font-bold text-emerald-700 flex justify-between md:block">
               <span className="md:hidden text-stone-400 uppercase text-[9px]">Base Cost</span>
               <span>${getUnitCost(ing).toFixed(2)} / {ing.packUnit === 'kg' ? 'g' : ing.packUnit === 'L' ? 'ml' : ing.packUnit}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

// ... InvoiceScanner Component ...
interface InvoiceScannerProps {
  onClose: () => void;
  ingredients: Ingredient[];
  suppliers: Supplier[];
  onProcessBatch: (newIngredients: Ingredient[], updatedIngredients: Ingredient[], newSupplier?: Supplier) => void;
}

const InvoiceScanner: React.FC<InvoiceScannerProps> = ({ onClose, ingredients, suppliers, onProcessBatch }) => {
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl p-8 flex flex-col items-center text-center">
          <i className="fas fa-file-invoice text-4xl text-stone-200 mb-6"></i>
          <h2 className="text-2xl font-bold serif mb-2">Invoice Scanner</h2>
          <p className="text-sm text-stone-500 mb-8">Upload a food supplier invoice to automatically detect ingredients and update pricing.</p>
          
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          
          <button onClick={() => fileInputRef.current?.click()} className="w-full bg-stone-100 border-2 border-dashed border-stone-300 rounded-2xl py-12 hover:bg-stone-50 transition-all">
             {image ? <img src={image} className="max-h-32 mx-auto rounded" /> : <span className="text-xs font-bold text-stone-400">TAP TO UPLOAD</span>}
          </button>
          
          <div className="grid grid-cols-2 gap-4 w-full mt-8">
             <button onClick={onClose} className="py-3 rounded-xl text-xs font-bold text-stone-400">Cancel</button>
             <button disabled className="bg-stone-900 text-white py-3 rounded-xl text-xs font-bold opacity-50">Coming Soon</button>
          </div>
       </div>
    </div>
  );
};

export default IngredientModule;
