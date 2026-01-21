
import React, { useState } from 'react';
import { Supplier, Ingredient } from '../types';

interface SupplierModuleProps {
  suppliers: Supplier[];
  ingredients: Ingredient[];
  onAdd: (s: Supplier) => void;
  onUpdate: (s: Supplier) => void;
  onDelete: (id: string) => void;
  onIngredientUpdate: (ing: Ingredient) => void;
  onIngredientDelete: (id: string) => void;
}

const SupplierModule: React.FC<SupplierModuleProps> = ({ 
  suppliers, 
  ingredients, 
  onAdd, 
  onUpdate, 
  onDelete,
  onIngredientUpdate,
  onIngredientDelete
}) => {
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
    onDelete(id);
    if (selectedSupplier?.id === id) setView('list');
  };

  const handleCreate = () => {
    setSelectedSupplier(null);
    setFormData({
      deliveryDays: [],
      minOrder: 0,
      orderMethod: 'email'
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
      orderMethod: formData.orderMethod || 'email',
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

  const getMethodIcon = (method?: string) => {
    switch(method) {
      case 'email': return 'fa-envelope';
      case 'sms': return 'fa-comment-dots';
      case 'online': return 'fa-globe';
      case 'phone': return 'fa-phone';
      default: return 'fa-truck';
    }
  };

  // Smart Delete / Unlink Logic for Ingredients within the Supplier View
  const handleRemoveItem = (ing: Ingredient, e: React.MouseEvent) => {
     e.stopPropagation();
     if (!selectedSupplier) return;

     const isStandard = ing.supplierId === selectedSupplier.id || ing.supplier === selectedSupplier.name;

     if (isStandard) {
        // Warning for Standard connection - Deletes the item entirely
        if (window.confirm(`⚠️ CRITICAL WARNING ⚠️\n\n"${selectedSupplier.name}" is the PRIMARY supplier for "${ing.name}".\n\nDeleting this link will PERMANENTLY DELETE the ingredient "${ing.name}" from your entire database.\n\nAre you sure you want to destroy this item?`)) {
           onIngredientDelete(ing.id);
        }
     } else {
        // Simple Unlink for Alternative connection
        // No confirmation needed as it's non-destructive to the item
        const updatedAlts = (ing.alternativeSuppliers || []).filter(
           alt => alt.supplierId !== selectedSupplier.id && alt.supplierName !== selectedSupplier.name
        );
        onIngredientUpdate({
           ...ing,
           alternativeSuppliers: updatedAlts
        });
     }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {view === 'list' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-stone-500 italic hidden md:block">Supplier Directory</h3>
            <button 
              type="button"
              onClick={handleCreate}
              className="w-full md:w-auto bg-stone-900 text-white px-4 py-3 rounded-xl md:rounded-lg text-xs font-bold hover:bg-stone-800 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <i className="fas fa-plus"></i> NEW SUPPLIER
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(sup => (
              <div key={sup.id} className="bg-white p-6 rounded-2xl border border-stone-200 hover:shadow-md transition-all group relative">
                <button 
                   type="button"
                   onClick={(e) => { e.stopPropagation(); handleDelete(sup.id); }}
                   className="absolute top-4 right-14 w-8 h-8 rounded-full bg-white border border-stone-200 text-stone-300 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all z-50 cursor-pointer"
                >
                   <i className="fas fa-trash-alt text-xs pointer-events-none"></i>
                </button>

                <div className="flex justify-between items-start mb-4">
                  <div>
                     <h4 className="font-bold text-lg text-stone-900">{sup.name}</h4>
                     <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                           sup.orderMethod === 'email' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                           sup.orderMethod === 'sms' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                           sup.orderMethod === 'online' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                           'bg-stone-50 text-stone-500 border-stone-200'
                        }`}>
                           <i className={`fas ${getMethodIcon(sup.orderMethod)} mr-1`}></i>
                           {sup.orderMethod || 'General'}
                        </span>
                     </div>
                  </div>
                  <button type="button" onClick={() => handleEdit(sup)} className="text-stone-300 hover:text-stone-900 transition-colors">
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
                  <div className="flex items-center gap-3"><i className="fas fa-dollar-sign text-stone-300 w-4"></i><span>Min Order: ${sup.minOrder}</span></div>
                  <div className="flex items-center gap-3"><i className="fas fa-user-tie text-stone-300 w-4"></i><span>{sup.repName || 'No Rep Info'}</span></div>
                </div>
                <div className="border-t border-stone-100 pt-4 flex justify-between items-center"><button type="button" onClick={() => { setSelectedSupplier(sup); setView('detail'); }} className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-2">VIEW CATALOG <i className="fas fa-arrow-right"></i></button></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'form' && (
        <div className="max-w-5xl mx-auto bg-white p-8 rounded-[2rem] border border-stone-200 shadow-xl animate-in slide-in-from-bottom duration-300">
           <div className="flex justify-between items-center mb-8 border-b border-stone-100 pb-4">
              <div>
                 <h2 className="text-2xl font-bold serif text-stone-900">{selectedSupplier ? 'Edit Supplier' : 'New Supplier'}</h2>
                 <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mt-1">Logistics & Ordering Profile</p>
              </div>
              <button type="button" onClick={() => setView('list')} className="w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400"><i className="fas fa-times"></i></button>
           </div>
           
           <form onSubmit={handleSave} className="space-y-10">
              {/* Form content remains same as previous step */}
              {/* SECTION 1: IDENTITY & LOGISTICS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                       <i className="fas fa-building"></i> Company Details
                    </h3>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-stone-500">Company Name</label>
                          <input required className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-stone-900" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Providore Fine Foods" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-stone-500">Minimum Order ($)</label>
                          <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                             <input type="number" className="w-full bg-stone-50 border-stone-200 border rounded-xl p-3 pl-8 text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-stone-900" value={formData.minOrder || ''} onChange={e => setFormData({...formData, minOrder: Number(e.target.value)})} />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                       <i className="fas fa-truck-clock"></i> Delivery Schedule
                    </h3>
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                       <p className="text-xs text-stone-500 mb-3 italic">Select available delivery days:</p>
                       <div className="flex gap-2 flex-wrap">
                          {days.map(day => (
                             <button
                                key={day}
                                type="button"
                                onClick={() => toggleDay(day)}
                                className={`w-10 h-10 rounded-lg text-xs font-bold transition-all flex items-center justify-center border ${
                                   formData.deliveryDays?.includes(day)
                                      ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                                      : 'bg-white text-stone-400 border-stone-200 hover:border-stone-400'
                                }`}
                             >
                                {day.substring(0, 1)}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              <hr className="border-stone-100" />

              {/* SECTION 2: ORDERING PROTOCOL */}
              <div className="space-y-6">
                 <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                    <i className="fas fa-shopping-cart"></i> Ordering Protocol
                 </h3>
                 <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase text-blue-800">Preferred Method</label>
                       <div className="relative">
                          <select 
                             className="w-full bg-white border-blue-200 border rounded-xl p-3 text-sm font-bold text-blue-900 outline-none appearance-none cursor-pointer hover:border-blue-300 transition-colors"
                             value={formData.orderMethod || 'email'}
                             onChange={e => setFormData({...formData, orderMethod: e.target.value as any})}
                          >
                             <option value="email">Email Order</option>
                             <option value="sms">SMS Text Message</option>
                             <option value="online">Online Portal</option>
                             <option value="phone">Phone Call</option>
                          </select>
                          <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none"></i>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase text-blue-800">
                          {formData.orderMethod === 'sms' ? 'SMS Number' : 
                           formData.orderMethod === 'online' ? 'Portal URL / Login' : 
                           formData.orderMethod === 'phone' ? 'Phone Number' : 'Order Email Address'}
                       </label>
                       <div className="relative">
                          <i className={`fas ${
                             formData.orderMethod === 'sms' ? 'fa-mobile-alt' : 
                             formData.orderMethod === 'online' ? 'fa-link' : 
                             formData.orderMethod === 'phone' ? 'fa-phone' : 'fa-envelope'
                          } absolute left-4 top-1/2 -translate-y-1/2 text-blue-300`}></i>
                          
                          {formData.orderMethod === 'sms' || formData.orderMethod === 'phone' ? (
                             <input 
                                className="w-full bg-white border-blue-200 border rounded-xl p-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.contactPhone || ''}
                                onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                                placeholder={formData.orderMethod === 'sms' ? "e.g. 0400 123 456" : "e.g. (02) 9999 0000"}
                             />
                          ) : (
                             <input 
                                className="w-full bg-white border-blue-200 border rounded-xl p-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.contactEmail || ''}
                                onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                                placeholder={formData.orderMethod === 'online' ? "e.g. https://orders.supplier.com" : "e.g. orders@company.com"}
                             />
                          )}
                       </div>
                    </div>
                 </div>
              </div>

              {/* SECTION 3: REP INFO & NOTES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                       <i className="fas fa-user-tie"></i> Representative
                    </h3>
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-stone-500">Rep Name</label>
                          <input className="w-full bg-white border-stone-200 border rounded-xl p-2 text-sm outline-none" value={formData.repName || ''} onChange={e => setFormData({...formData, repName: e.target.value})} placeholder="e.g. Sarah Jenkins" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold uppercase text-stone-500">Rep Mobile</label>
                             <input className="w-full bg-white border-stone-200 border rounded-xl p-2 text-sm outline-none" value={formData.repMobile || ''} onChange={e => setFormData({...formData, repMobile: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold uppercase text-stone-500">Rep Email</label>
                             <input className="w-full bg-white border-stone-200 border rounded-xl p-2 text-sm outline-none" value={formData.repEmail || ''} onChange={e => setFormData({...formData, repEmail: e.target.value})} />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                       <i className="fas fa-sticky-note"></i> Internal Notes
                    </h3>
                    <textarea 
                       className="w-full h-40 bg-yellow-50/50 border-yellow-200 border rounded-2xl p-4 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-yellow-400"
                       value={formData.notes || ''} 
                       onChange={e => setFormData({...formData, notes: e.target.value})}
                       placeholder="Account numbers, cutoff times, specific delivery instructions..."
                    />
                 </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-stone-100">
                 <button type="button" onClick={() => setView('list')} className="px-6 py-3 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-100 transition-all">Cancel</button>
                 <button type="submit" className="bg-stone-900 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-stone-800 transition-all">
                    {selectedSupplier ? 'Update Supplier' : 'Create Supplier'}
                 </button>
              </div>
           </form>
        </div>
      )}

      {view === 'detail' && selectedSupplier && (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
           <div className="flex items-center gap-4">
              <button type="button" onClick={() => setView('list')} className="text-stone-400 hover:text-stone-900 transition-colors"><i className="fas fa-arrow-left text-xl"></i></button>
              <div className="flex-1">
                 <h1 className="text-3xl font-bold serif text-stone-900">{selectedSupplier.name}</h1>
                 <div className="flex gap-4 mt-2 text-sm text-stone-500">
                    <span className="flex items-center gap-2"><i className={`fas ${getMethodIcon(selectedSupplier.orderMethod)} text-stone-400`}></i> {selectedSupplier.orderMethod ? selectedSupplier.orderMethod.toUpperCase() : 'EMAIL'} Order</span>
                    <span className="text-stone-300">|</span>
                    <span>Min: ${selectedSupplier.minOrder}</span>
                 </div>
              </div>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDelete(selectedSupplier.id); }} 
                className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer z-50"
              >
                 DELETE
              </button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                 {/* CONTACT CARD */}
                 <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                    <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest">Ordering Details</h3>
                    <div className="space-y-3">
                       <div className="flex gap-3 items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><i className="fas fa-truck"></i></div>
                          <div className="flex-1">
                             <p className="text-[10px] font-bold uppercase text-stone-400">Delivery Days</p>
                             <p className="font-bold text-sm">{selectedSupplier.deliveryDays.join(', ') || 'Not Set'}</p>
                          </div>
                       </div>
                       <div className="flex gap-3 items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><i className="fas fa-at"></i></div>
                          <div className="flex-1 overflow-hidden">
                             <p className="text-[10px] font-bold uppercase text-stone-400">Orders</p>
                             <p className="font-bold text-sm truncate" title={selectedSupplier.orderMethod === 'sms' ? selectedSupplier.contactPhone : selectedSupplier.contactEmail}>
                                {selectedSupplier.orderMethod === 'sms' ? selectedSupplier.contactPhone : selectedSupplier.contactEmail || 'N/A'}
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* REP CARD */}
                 <div className="bg-stone-900 p-6 rounded-2xl text-white space-y-4">
                    <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest">Representative</h3>
                    <div className="space-y-1">
                       <p className="font-bold text-lg">{selectedSupplier.repName || 'No Rep Assigned'}</p>
                       {selectedSupplier.repMobile && <p className="text-stone-400 text-sm"><i className="fas fa-phone mr-2"></i>{selectedSupplier.repMobile}</p>}
                       {selectedSupplier.repEmail && <p className="text-stone-400 text-sm"><i className="fas fa-envelope mr-2"></i>{selectedSupplier.repEmail}</p>}
                    </div>
                 </div>
              </div>
              <div className="md:col-span-2">
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                  <div className="px-6 py-4 bg-stone-50 border-b border-stone-200"><h3 className="font-bold text-stone-900">Registered Items</h3></div>
                  <div className="divide-y divide-stone-100">
                    {ingredients.filter(ing => {
                        const isStandard = ing.supplierId === selectedSupplier.id || ing.supplier === selectedSupplier.name;
                        const isAlt = ing.alternativeSuppliers?.some(alt => alt.supplierId === selectedSupplier.id || alt.supplierName === selectedSupplier.name);
                        return isStandard || isAlt;
                    }).map(ing => {
                        // Determine display variables based on connection type
                        const isStandard = ing.supplierId === selectedSupplier.id || ing.supplier === selectedSupplier.name;
                        let displayPrice = ing.price;
                        let displayPack = `${ing.packSize}${ing.packUnit}`;

                        // If it's an alternative, fetch specific alternative data
                        if (!isStandard) {
                            const altEntry = ing.alternativeSuppliers?.find(alt => alt.supplierId === selectedSupplier.id || alt.supplierName === selectedSupplier.name);
                            if (altEntry) {
                                displayPrice = altEntry.price;
                                displayPack = `${altEntry.packSize}${altEntry.packUnit}`;
                            }
                        }

                        return (
                          <div key={ing.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors group">
                              <div className="flex items-center gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-sm text-stone-900">{ing.name}</p>
                                      {isStandard ? (
                                        <span className="text-[9px] font-bold uppercase bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">Pref</span>
                                      ) : (
                                        <span className="text-[9px] font-bold uppercase bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded border border-stone-200">Alt</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-stone-400 mt-0.5">{displayPack}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-mono font-bold text-sm text-stone-700">${displayPrice.toFixed(2)}</p>
                                </div>
                                <button 
                                  onClick={(e) => handleRemoveItem(ing, e)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                  title={isStandard ? "Delete Ingredient" : "Unlink from Supplier"}
                                >
                                   {isStandard ? <i className="fas fa-trash-alt text-xs"></i> : <i className="fas fa-unlink text-xs"></i>}
                                </button>
                              </div>
                          </div>
                        );
                    })}
                    {ingredients.filter(ing => {
                        const isStandard = ing.supplierId === selectedSupplier.id || ing.supplier === selectedSupplier.name;
                        const isAlt = ing.alternativeSuppliers?.some(alt => alt.supplierId === selectedSupplier.id || alt.supplierName === selectedSupplier.name);
                        return isStandard || isAlt;
                    }).length === 0 && (
                        <div className="p-8 text-center text-stone-400 text-xs italic">
                            No items linked to this supplier yet.
                        </div>
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
