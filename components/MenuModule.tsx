
import React, { useState, useMemo, useEffect } from 'react';
import { Menu, Dish, Recipe, Ingredient } from '../types';

interface MenuModuleProps {
  menus: Menu[];
  dishes: Dish[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  getDishCostBreakdown: (dish: Dish) => { food: number, packaging: number, total: number };
  onAdd: (menu: Menu) => void;
  onUpdate: (menu: Menu) => void;
  onDelete: (id: string) => void;
}

const MenuModule: React.FC<MenuModuleProps> = ({ menus, dishes, recipes, ingredients, getDishCostBreakdown, onAdd, onUpdate, onDelete }) => {
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'create' | 'edit'>('list');
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  const handleSave = (menu: Menu) => {
    if (selectedMenu) {
      onUpdate(menu);
      setSelectedMenu(menu);
    } else {
      onAdd(menu);
    }
    setViewMode('list');
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setSelectedMenu(null);
    setViewMode('list');
  };

  return (
    <div className="space-y-6">
      {viewMode === 'list' && (
        <MenuList 
          menus={menus} 
          dishes={dishes}
          onCreate={() => { setSelectedMenu(null); setViewMode('create'); }} 
          onSelect={(menu) => { setSelectedMenu(menu); setViewMode('detail'); }}
          onDelete={handleDelete}
        />
      )}
      
      {viewMode === 'create' && (
        <MenuEditor 
          existingMenu={null}
          dishes={dishes}
          onSave={handleSave}
          onCancel={() => setViewMode('list')}
        />
      )}

      {viewMode === 'detail' && selectedMenu && (
        <MenuDetail 
          menu={selectedMenu}
          dishes={dishes}
          recipes={recipes}
          ingredients={ingredients}
          getDishCostBreakdown={getDishCostBreakdown}
          onBack={() => { setSelectedMenu(null); setViewMode('list'); }}
          onEdit={() => setViewMode('edit')}
          onDelete={() => handleDelete(selectedMenu.id)}
        />
      )}
      
      {viewMode === 'edit' && selectedMenu && (
        <MenuEditor 
          existingMenu={selectedMenu}
          dishes={dishes}
          onSave={(updated) => { 
             onUpdate(updated); 
             setSelectedMenu(updated);
             setViewMode('detail'); 
          }}
          onCancel={() => setViewMode('detail')}
        />
      )}
    </div>
  );
};

const MenuList = ({ menus, dishes, onCreate, onSelect, onDelete }: { menus: Menu[], dishes: Dish[], onCreate: () => void, onSelect: (m: Menu) => void, onDelete: (id: string) => void }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-stone-500 italic hidden md:block">Menu Collections</h3>
        <button 
          type="button"
          onClick={onCreate}
          className="w-full md:w-auto bg-stone-900 text-white px-4 py-3 rounded-xl md:rounded-lg text-xs font-bold hover:bg-stone-800 transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <i className="fas fa-plus"></i> NEW MENU
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus.map(menu => {
          const dishCount = menu.dishIds.length;
          return (
             <div key={menu.id} className="group relative bg-white rounded-2xl border border-stone-200 hover:shadow-md transition-all">
                <button 
                   type="button"
                   onClick={(e) => { e.stopPropagation(); onDelete(menu.id); }}
                   className="absolute top-4 right-12 w-8 h-8 rounded-full bg-white border border-stone-200 text-stone-300 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all z-50 cursor-pointer"
                >
                   <i className="fas fa-trash-alt text-xs pointer-events-none"></i>
                </button>

                <div onClick={() => onSelect(menu)} className="p-6 cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                       <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                         menu.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
                       }`}>
                         {menu.status}
                       </div>
                       <span className="text-stone-300 group-hover:text-stone-900 transition-colors">
                         <i className="fas fa-arrow-right"></i>
                       </span>
                    </div>
                    <h3 className="text-xl font-bold serif text-stone-900 mb-2">{menu.name}</h3>
                    <p className="text-sm text-stone-500 line-clamp-2 mb-6">{menu.description}</p>
                    <div className="border-t border-stone-100 pt-4 flex gap-4 text-xs font-medium text-stone-600">
                       <span className="flex items-center gap-2">
                         <i className="fas fa-utensils text-stone-400"></i> {dishCount} Dish{dishCount !== 1 ? 'es' : ''}
                       </span>
                    </div>
                </div>
             </div>
          );
        })}
      </div>
    </div>
  );
};

const MenuEditor = ({ existingMenu, dishes, onSave, onCancel }: { existingMenu: Menu | null, dishes: Dish[], onSave: (m: Menu) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<Partial<Menu>>(existingMenu || {
    name: '', description: '', dishIds: [], status: 'Draft'
  });

  const toggleDish = (id: string) => {
    const current = formData.dishIds || [];
    if (current.includes(id)) {
      setFormData({ ...formData, dishIds: current.filter(d => d !== id) });
    } else {
      setFormData({ ...formData, dishIds: [...current, id] });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
       <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h2 className="text-2xl font-bold serif text-stone-900">{existingMenu ? 'Edit Menu' : 'Curate New Menu'}</h2>
          <button type="button" onClick={onCancel} className="w-8 h-8 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-400 transition-colors">
            <i className="fas fa-times"></i>
          </button>
       </div>
       <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <div className="space-y-2"><label className="text-xs font-bold uppercase text-stone-500">Menu Title</label><input className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-stone-900" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Winter Degustation" /></div>
                <div className="space-y-2"><label className="text-xs font-bold uppercase text-stone-500">Overview</label><textarea className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm outline-none h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Concept notes..." /></div>
                <div className="space-y-2"><label className="text-xs font-bold uppercase text-stone-500">Status</label><select className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}><option value="Draft">Draft</option><option value="Active">Active</option><option value="Archived">Archived</option></select></div>
             </div>
             <div className="space-y-4 h-full flex flex-col"><label className="text-xs font-bold uppercase text-stone-500">Select Dishes</label><div className="flex-1 bg-stone-50 rounded-xl border border-stone-200 overflow-y-auto max-h-[300px] p-4 space-y-2">{dishes.map(dish => (<div key={dish.id} onClick={() => toggleDish(dish.id)} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.dishIds?.includes(dish.id) ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white border-stone-200 hover:border-stone-400'}`}><div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.dishIds?.includes(dish.id) ? 'border-white' : 'border-stone-400'}`}>{formData.dishIds?.includes(dish.id) && <div className="w-2 h-2 rounded-full bg-white"></div>}</div><div className="flex-1"><p className="text-sm font-bold">{dish.name}</p><p className={`text-xs ${formData.dishIds?.includes(dish.id) ? 'text-stone-400' : 'text-stone-500'}`}>{dish.category}</p></div><div className="text-right"><p className="text-xs font-mono">${dish.sellingPrice}</p></div></div>))}</div></div>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t border-stone-100"><button type="button" onClick={onCancel} className="px-6 py-2 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-100 transition-all">Cancel</button><button type="button" onClick={() => onSave({ id: existingMenu?.id || `menu-${Date.now()}`, name: formData.name || 'Untitled Menu', description: formData.description || '', dishIds: formData.dishIds || [], status: formData.status as any, lastUpdated: Date.now() })} className="bg-stone-900 text-white px-8 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-stone-800 transition-all">Save Menu</button></div>
       </div>
    </div>
  );
};

const MenuDetail = ({ 
  menu, dishes, recipes, ingredients, getDishCostBreakdown, onBack, onEdit, onDelete 
}: any) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bible'>('overview');
  const [bibleGrouping, setBibleGrouping] = useState<'dish' | 'type'>('dish');
  const [isPrinting, setIsPrinting] = useState(false);
  const menuDishes = useMemo(() => menu.dishIds.map((id: string) => dishes.find((d: Dish) => d.id === id)).filter(Boolean) as Dish[], [menu, dishes]);
  const financials = useMemo(() => {
    let totalRev = 0; let totalCost = 0;
    menuDishes.forEach(d => { totalRev += d.sellingPrice; totalCost += getDishCostBreakdown(d).total; });
    const avgGp = totalRev > 0 ? ((totalRev - totalCost) / totalRev) * 100 : 0;
    return { totalRev, totalCost, avgGp };
  }, [menuDishes, getDishCostBreakdown]);

  useEffect(() => {
    if (isPrinting && activeTab === 'bible') {
      const timer = setTimeout(() => { window.print(); setIsPrinting(false); }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrinting, activeTab]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-20 md:pb-0">
        <style>{`@media print {.no-print { display: none !important; } .print-only { display: block !important; } .page-break-after { break-after: page; } .avoid-break { break-inside: avoid; } } .print-only { display: none; }`}</style>
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
          <div><button type="button" onClick={onBack} className="text-xs font-bold text-stone-400 hover:text-stone-900 flex items-center gap-2 mb-2"><i className="fas fa-arrow-left"></i> BACK TO MENUS</button><h1 className="text-3xl md:text-4xl font-bold serif text-stone-900">{menu.name}</h1><p className="text-stone-500 text-sm mt-1">{menu.description}</p></div>
          <div className="flex gap-3">
             <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="bg-white border border-rose-200 text-rose-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all z-50">DELETE</button>
             <button type="button" onClick={onEdit} className="bg-white border border-stone-200 text-stone-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-stone-50 transition-all">EDIT MENU</button>
             <button type="button" onClick={() => { setActiveTab('bible'); setIsPrinting(true); }} className="bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow hover:bg-stone-800 transition-all flex items-center justify-center gap-2"><i className="fas fa-print"></i> PRINT BOOK</button>
          </div>
       </div>
       <div className="flex gap-6 border-b border-stone-200 no-print">
          <button onClick={() => setActiveTab('overview')} className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'overview' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-600'}`}>Overview</button>
          <button onClick={() => setActiveTab('bible')} className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'bible' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-600'}`}>Recipe Book</button>
       </div>
       {activeTab === 'overview' && (
         <div className="space-y-8"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-6 rounded-2xl border border-stone-200"><p className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-1">Total Rev</p><p className="text-3xl font-black text-stone-900">${financials.totalRev.toFixed(2)}</p></div><div className="bg-white p-6 rounded-2xl border border-stone-200"><p className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-1">Total Cost</p><p className="text-3xl font-black text-stone-900">${financials.totalCost.toFixed(2)}</p></div><div className="bg-stone-900 p-6 rounded-2xl text-white"><p className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-1">Avg Margin</p><p className={`text-3xl font-black ${financials.avgGp < 70 ? 'text-rose-400' : 'text-emerald-400'}`}>{financials.avgGp.toFixed(1)}%</p></div></div><div className="bg-white rounded-3xl border border-stone-200 overflow-hidden"><div className="bg-stone-50 px-8 py-4 border-b border-stone-200"><h3 className="font-bold serif text-lg">Course Composition</h3></div><div className="divide-y divide-stone-100">{menuDishes.map(dish => {const cost = getDishCostBreakdown(dish); const gp = ((dish.sellingPrice - cost.total) / dish.sellingPrice) * 100; return (<div key={dish.id} className="p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-stone-50 transition-colors"><div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-200 shrink-0">{dish.heroImage && <img src={dish.heroImage} className="w-full h-full object-cover" alt="" />}</div><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-500 px-2 py-0.5 rounded">{dish.category}</span><h4 className="font-bold text-lg text-stone-900">{dish.name}</h4></div><p className="text-xs text-stone-500 italic">{dish.description}</p></div><div className="flex gap-8 md:text-right"><div><p className="text-[9px] font-bold uppercase text-stone-400">Cost</p><p className="font-mono font-bold text-stone-700">${cost.total.toFixed(2)}</p></div><div><p className="text-[9px] font-bold uppercase text-stone-400">Price</p><p className="font-mono font-bold text-stone-700">${dish.sellingPrice.toFixed(2)}</p></div><div><p className="text-[9px] font-bold uppercase text-stone-400">GP%</p><p className={`font-mono font-black ${gp < 70 ? 'text-rose-600' : 'text-emerald-600'}`}>{gp.toFixed(0)}%</p></div></div></div>);})}</div></div></div>
       )}
       {activeTab === 'bible' && (
         <div className="space-y-6 print:space-y-0"><div className="flex justify-between items-center bg-stone-100 p-2 rounded-xl no-print"><div className="flex gap-2"><button type="button" onClick={() => setBibleGrouping('dish')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${bibleGrouping === 'dish' ? 'bg-white shadow text-stone-900' : 'text-stone-500'}`}>Dish</button><button type="button" onClick={() => setBibleGrouping('type')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${bibleGrouping === 'type' ? 'bg-white shadow text-stone-900' : 'text-stone-500'}`}>Station</button></div></div><div className="bg-white min-h-screen print:bg-transparent print:text-black">{bibleGrouping === 'dish' ? (<div className="space-y-12 print:space-y-0">{menuDishes.map(dish => (<div key={dish.id} className="avoid-break page-break-after"><div className="border-b-2 border-stone-200 pb-4 mb-6 print:border-black print:mb-8"><h2 className="text-2xl font-black serif uppercase text-stone-900">{dish.name}</h2><p className="text-stone-500 text-sm mt-1 uppercase tracking-widest">{dish.category}</p></div><div className="grid grid-cols-1 gap-8 print:gap-8">{dish.components.filter(c => c.type === 'recipe').map((comp, idx) => {const recipe = recipes.find(r => r.id === comp.id); return recipe ? <RecipePrintCard key={idx} recipe={recipe} ingredients={ingredients} recipes={recipes} /> : null;})}</div></div>))}</div>) : (<div className="space-y-12 print:space-y-0">{['Prep', 'Sauce', 'Base', 'Garnish'].map(type => {const usedRecipes = new Set(); menuDishes.forEach(d => d.components.forEach(c => {if (c.type === 'recipe') usedRecipes.add(c.id);})); const typeRecipes = recipes.filter(r => r.type === type && usedRecipes.has(r.id)); if (typeRecipes.length === 0) return null; return (<div key={type} className="avoid-break page-break-after"><div className="bg-stone-900 text-white p-4 mb-6 print:bg-stone-200 print:text-stone-900"><h2 className="text-xl font-black uppercase tracking-widest">{type} Station</h2></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-1">{typeRecipes.map(recipe => (<RecipePrintCard key={recipe.id} recipe={recipe} ingredients={ingredients} recipes={recipes} />))}</div></div>);})}</div>)}</div></div>
       )}
    </div>
  );
};

const RecipePrintCard = ({ recipe, ingredients, recipes }: any) => {
  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden print:border-2 print:border-stone-900 print:rounded-none print:break-inside-avoid">
       <div className="bg-stone-50 p-4 border-b border-stone-100 flex justify-between items-center print:bg-stone-100 print:border-stone-900">
          <h3 className="font-bold text-lg serif uppercase tracking-tight text-stone-900">{recipe.name}</h3>
          <div className="text-right"><span className="text-[10px] font-bold uppercase bg-white border border-stone-200 px-2 py-1 text-stone-500 print:border-stone-900 print:text-stone-900">{recipe.type}</span><p className="text-xs font-mono mt-1 text-stone-500 print:text-stone-900 font-bold">Yield: {recipe.yieldQuantity}{recipe.yieldUnit}</p></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-stone-100 print:divide-stone-900"><div className="md:col-span-4 p-4 bg-white"><h4 className="text-[10px] font-black uppercase text-stone-400 mb-3 tracking-widest border-b border-stone-100 pb-2 print:text-stone-900 print:border-stone-400">Ingredients</h4><ul className="text-xs space-y-2 font-mono">{recipe.components.map((c: any, i: number) => {const item = c.type === 'ingredient' ? ingredients.find((ing: any) => ing.id === c.id) : recipes.find((r: any) => r.id === c.id); return (<li key={i} className="flex justify-between items-end border-b border-dotted border-stone-100 pb-1 print:border-stone-400"><span className="font-medium text-stone-700 print:text-black mr-2 leading-tight">{item?.name || 'Item'}</span><span className="font-bold whitespace-nowrap">{c.quantity}<span className="text-[10px] text-stone-400 ml-0.5">{c.unit}</span></span></li>);})}</ul></div><div className="md:col-span-8 p-4 bg-white"><h4 className="text-[10px] font-black uppercase text-stone-400 mb-3 tracking-widest border-b border-stone-100 pb-2 print:text-stone-900 print:border-stone-400">Execution</h4><ol className="text-sm space-y-3 list-decimal list-outside ml-4 serif text-stone-800 print:text-black">{recipe.method.map((step: string, i: number) => (<li key={i} className="leading-relaxed pl-2 marker:font-sans marker:text-stone-400 marker:font-bold">{step}</li>))}</ol>{recipe.notes && (<div className="mt-6 p-3 bg-stone-50 border-l-4 border-stone-300 text-xs italic text-stone-600 print:bg-stone-100 print:text-black print:border-stone-600"><span className="font-bold not-italic text-stone-900 mr-1">CHEF NOTE:</span> {recipe.notes}</div>)}</div></div>
    </div>
  );
};

export default MenuModule;
