
import React, { useState } from 'react';
import { Supplier, Ingredient } from '../types';

interface SupplierModuleProps {
  suppliers: Supplier[];
  ingredients: Ingredient[];
  onAdd: (s: Supplier) => void;
  onUpdate: (s: Supplier) => void;
  onDelete: (id: string) => void;
}

const SupplierModule: React.FC<SupplierModuleProps> = ({ suppliers, ingredients, onAdd, onUpdate, onDelete }) => {
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({});

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleEdit = (s: Supplier) => {
    setSelectedSupplier(s);
    setFormData(s);
    setView('form');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
       onDelete(id);
       if (selectedSupplier?.id === id) setView('list');
    }
  };

  const handleCreate = () => {
    setSelectedSupplier(null);
    setFormData({
      deliveryDays: [],
      minOrder: 0
    });
    setView('form');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const supplier: Supplier = {
      id: selectedSupplier?.id || `sup-${Date.now()}`,
      name: formData.name,
      contactEmail: formData.contactEmail || '',
      contactPhone: formData.contactPhone || '',
      deliveryDays: formData.deliveryDays || [],
      minOrder: Number(formData.minOrder) || 0,
      repName: formData.repName || '',
      repMobile: formData.repMobile || '',
      repEmail: formData.repEmail || '',
      notes: formData.notes || '',
    };

    if (selectedSupplier) {
      onUpdate(supplier);
    } else {
      onAdd(supplier);
    }
    setView('list');
  };

  const toggleDay = (day: string) => {
    const current = formData.deliveryDays || [];
    if (current.includes(day)) {
      setFormData({ ...formData, deliveryDays: current.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, deliveryDays: [...current, day] });
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {view === 'list' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-stone-500 italic hidden md:block">Supplier Directory</h3>
            <button 
              onClick={handleCreate}
              className="w-full md:w-auto bg-stone-900 text-white px-4 py-3 rounded-xl md:rounded-lg text-xs font-bold hover:bg-stone-800 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <i className="fas fa-plus"></i> NEW SUPPLIER
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(sup => (
              <div key={sup.id} className="bg-white p-6 rounded-2xl border border-stone-200 hover:shadow-md transition-all group relative">
                {/* Delete Button (Sibling) */}
                <button 
                   onClick={() => handleDelete(sup.id)}
                   className="absolute top-4 right-14 w-8 h-8 rounded-full bg-white border border-stone-200 text-stone-300 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer"
                >
                   <i className="fas fa-trash-alt text-xs pointer-events-none"></i>
                </button>

                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-lg text-stone-900">{sup.name}</h4>
                  <button onClick={() => handleEdit(sup)} className="text-stone-300 hover:text-stone-900 transition-colors">
                    <i className="fas fa-edit"></i>
                  </button>
                </div>
                
                <div className="space-y-3 text-sm text-stone-600 mb-6">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-truck text-stone-300 w-4"></i>
                    <div className="flex gap-1 flex-wrap">
                      {sup.deliveryDays.length > 0 ? sup.deliveryDays.map(d => (
                        <span key={d} className="bg-stone-100 text-[10px] font-bold px-1.5 py-0.5 rounded text-stone-500 uppercase">{d}</span>
                      )) : <span className="text-stone-400 italic text-xs">No days set</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <i className="fas fa-dollar-sign text-stone-300 w-4"></i>
                     <span>Min Order: ${sup.minOrder}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <i className="fas fa-user-tie text-stone-300 w-4"></i>
                     <span>{sup.repName || 'No Rep Info'}</span>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-4 flex justify-between items-center">
                   <button 
                     onClick={() => { setSelectedSupplier(sup); setView('detail'); }}
                     className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-2"
                   >
                     VIEW CATALOG <i className="fas fa-arrow-right"></i>
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'form' && (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-[2rem] border border-stone-200 shadow-xl animate-in slide-in-from-bottom duration-300">
           <div className="flex justify-between items-center mb-8 border-b border-stone-100 pb-4">
              <h2 className="text-2xl font-bold serif text-stone-900">{selectedSupplier ? 'Edit Supplier' : 'New Supplier'}</h2>
              <button onClick={() => setView('list')} className="w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400">
                 <i className="fas fa-times"></i>
              </button>
           </div>
           
           <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest">Company Details</h3>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-stone-500">Company Name</label>
                       <input 
                         required
                         className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-stone-900"
                         value={formData.name || ''}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-stone-500">Min Order ($)</label>
                         <input 
                           type="number"
                           className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm outline-none"
                           value={formData.minOrder || ''}
                           onChange={e => setFormData({...formData, minOrder: Number(e.target.value)})}
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-stone-500">Office Phone</label>
                         <input 
                           className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm outline-none"
                           value={formData.contactPhone || ''}
                           onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                         />
                       </div>
                    </div>
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-stone-500">Orders Email</label>
                         <input 
                           type="email"
                           className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm outline-none"
                           value={formData.contactEmail || ''}
                           onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                         />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest">Rep Contact</h3>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-stone-500">Rep Name</label>
                       <input 
                         className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm outline-none"
                         value={formData.repName || ''}
                         onChange={e => setFormData({...formData, repName: e.target.value})}
                         />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-stone-500">Rep Mobile</label>
                         <input 
                           className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm outline-none"
                           value={formData.repMobile || ''}
                           onChange={e => setFormData({...formData, repMobile: e.target.value})}
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-stone-500">Rep Email</label>
                         <input 
                           type="email"
                           className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm outline-none"
                           value={formData.repEmail || ''}
                           onChange={e => setFormData({...formData, repEmail: e.target.value})}
                         />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                 <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest">Delivery Schedule</h3>
                 <div className="flex gap-2 flex-wrap">
                    {days.map(day => (
                       <button
                         key={day}
                         type="button"
                         onClick={() => toggleDay(day)}
                         className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            formData.deliveryDays?.includes(day)
                            ? 'bg-stone-900 text-white shadow-lg'
                            : 'bg-stone-50 text-stone-400 hover:bg-stone-200'
                         }`}
                       >
                          {day}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-stone-500">Internal Notes</label>
                 <textarea 
                    className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm outline-none h-24"
                    value={formData.notes || ''}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                 />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-stone-100">
                 <button type="button" onClick={() => setView('list')} className="px-6 py-3 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-100">Cancel</button>
                 <button type="submit" className="bg-stone-900 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-stone-800">Save Supplier</button>
              </div>
           </form>
        </div>
      )}

      {view === 'detail' && selectedSupplier && (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
           <div className="flex items-center gap-4">
              <button onClick={() => setView('list')} className="text-stone-400 hover:text-stone-900 transition-colors">
                 <i className="fas fa-arrow-left text-xl"></i>
              </button>
              <div className="flex-1">
                 <h1 className="text-3xl font-bold serif text-stone-900">{selectedSupplier.name}</h1>
                 <p className="text-stone-500 text-sm">Supplier Profile & Catalog</p>
              </div>
              <button 
                onClick={() => handleDelete(selectedSupplier.id)} 
                className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
              >
                 DELETE
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* ... (Existing Detail View Code) ... */}
              <div className="md:col-span-1 space-y-6">
                 <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest">Contact Info</h3>
                    <div className="space-y-3 text-sm">
                       {selectedSupplier.contactPhone && (
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400"><i className="fas fa-phone"></i></div>
                             <span>{selectedSupplier.contactPhone}</span>
                          </div>
                       )}
                       {selectedSupplier.contactEmail && (
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400"><i className="fas fa-envelope"></i></div>
                             <a href={`mailto:${selectedSupplier.contactEmail}`} className="text-blue-600 hover:underline">{selectedSupplier.contactEmail}</a>
                          </div>
                       )}
                    </div>
                 </div>

                 <div className="bg-stone-900 p-6 rounded-2xl text-white space-y-4">
                    <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest">Representative</h3>
                    <div className="space-y-1">
                       <p className="font-bold text-lg">{selectedSupplier.repName || 'N/A'}</p>
                       <p className="text-stone-400 text-sm">{selectedSupplier.repMobile}</p>
                       <a href={`mailto:${selectedSupplier.repEmail}`} className="text-amber-500 text-sm hover:underline">{selectedSupplier.repEmail}</a>
                    </div>
                 </div>
              </div>

              <div className="md:col-span-2">
                 <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                    <div className="px-6 py-4 bg-stone-50 border-b border-stone-200">
                       <h3 className="font-bold text-stone-900">Registered Items</h3>
                    </div>
                    <div className="divide-y divide-stone-100">
                       {ingredients.filter(ing => 
                          ing.supplierId === selectedSupplier.id || // Direct link
                          ing.supplier === selectedSupplier.name || // Legacy link
                          ing.alternativeSuppliers?.some(as => as.supplierId === selectedSupplier.id) // Multi-supplier link
                       ).map(ing => {
                          // Find specific pricing for this supplier if available
                          const specificPricing = ing.alternativeSuppliers?.find(as => as.supplierId === selectedSupplier.id);
                          const isPrimary = ing.supplierId === selectedSupplier.id || ing.supplier === selectedSupplier.name;
                          
                          return (
                             <div key={ing.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                                <div className="flex items-center gap-3">
                                   <div className={`w-2 h-2 rounded-full ${isPrimary ? 'bg-emerald-500' : 'bg-stone-300'}`} title={isPrimary ? "Primary Supplier" : "Alternative Supplier"}></div>
                                   <div>
                                      <p className="font-bold text-sm text-stone-900">{ing.name}</p>
                                      <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">{ing.category}</span>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="font-mono font-bold text-sm text-stone-700">
                                      ${(specificPricing ? specificPricing.price : ing.price).toFixed(2)}
                                   </p>
                                   <p className="text-xs text-stone-400">
                                      per {specificPricing ? specificPricing.packSize : ing.packSize}{specificPricing ? specificPricing.packUnit : ing.packUnit}
                                   </p>
                                </div>
                             </div>
                          );
                       })}
                       {ingredients.filter(ing => ing.supplierId === selectedSupplier.id || ing.supplier === selectedSupplier.name).length === 0 && (
                          <div className="p-8 text-center text-stone-400 italic text-sm">No items linked to this supplier yet.</div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SupplierModule;
