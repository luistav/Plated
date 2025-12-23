
import React from 'react';

const LogicDocumentation: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-12 animate-in slide-in-from-bottom duration-700">
      <section className="bg-white p-10 rounded-3xl border border-stone-200 shadow-sm">
        <h2 className="text-3xl font-bold serif mb-6 border-b pb-4">Culinary Engine Logic</h2>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">
               <i className="fas fa-layer-group"></i> Entity Hierarchy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">Level 1: Atoms</h4>
                <p className="text-xs text-stone-500 italic">Ingredients & Packaging</p>
                <p className="text-[11px] mt-2 leading-relaxed">The bedrock. Pack price and yield factor determine the "Unit Base Cost". Updates here flow globally.</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">Level 2: Molecules</h4>
                <p className="text-xs text-stone-500 italic">Recipes & Sub-preps</p>
                <p className="text-[11px] mt-2 leading-relaxed">Sum of atoms. Yield quantity determines "Batch Unit Cost". Reusable across any dish.</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">Level 3: Complexes</h4>
                <p className="text-xs text-stone-500 italic">Final Dish Concepts</p>
                <p className="text-[11px] mt-2 leading-relaxed">The menu item. Combines recipes + ingredients + packaging. Calculates Target Selling Price vs GP%.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2">
               <i className="fas fa-calculator"></i> The Flow of Costs
            </h3>
            <div className="bg-stone-900 text-stone-300 p-6 rounded-2xl font-mono text-[11px] leading-loose">
               <p className="text-stone-500 mb-2"># Global Cost Recalculation Algorithm</p>
               <p><span className="text-white">FUNCTION</span> calculate_unit_cost(item):</p>
               <p className="ml-4">IF item.type == INGREDIENT:</p>
               <p className="ml-8 text-amber-400">return (price / pack_size) * (100 / yield_pct)</p>
               <p className="ml-4">ELSE IF item.type == RECIPE:</p>
               <p className="ml-8 text-blue-400">batch_cost = SUM(comp.qty * calculate_unit_cost(comp.id))</p>
               <p className="ml-8 text-blue-400">return batch_cost / item.yield_qty</p>
               <p className="ml-4">ELSE IF item.type == DISH:</p>
               <p className="ml-8 text-emerald-400">total_cost = SUM(comp.qty * calculate_unit_cost(comp.id))</p>
               <p className="ml-8 text-emerald-400">return total_cost</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-stone-200">
           <h3 className="font-bold serif text-xl mb-4">Phase 1: MVP Roadmap</h3>
           <ul className="space-y-3 text-sm text-stone-600">
              <li className="flex gap-2"><i className="fas fa-check-circle text-emerald-500 mt-1"></i> Core CRUD for ingredients/recipes</li>
              <li className="flex gap-2"><i className="fas fa-check-circle text-emerald-500 mt-1"></i> Reactive costing calculations</li>
              <li className="flex gap-2"><i className="fas fa-check-circle text-emerald-500 mt-1"></i> Plating notes & basic image upload</li>
              <li className="flex gap-2"><i className="fas fa-check-circle text-emerald-500 mt-1"></i> GP% and Markup calculator</li>
           </ul>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-stone-200">
           <h3 className="font-bold serif text-xl mb-4 text-stone-400">Phase 2: High-Performance</h3>
           <ul className="space-y-3 text-sm text-stone-400">
              <li className="flex gap-2"><i className="fas fa-circle-notch mt-1"></i> Inventory API integration (Stock updates)</li>
              <li className="flex gap-2"><i className="fas fa-circle-notch mt-1"></i> Gemini AI for menu description drafting</li>
              <li className="flex gap-2"><i className="fas fa-circle-notch mt-1"></i> Allergen tracking & automated tagging</li>
              <li className="flex gap-2"><i className="fas fa-circle-notch mt-1"></i> Printable "Kitchen Deck" documentation</li>
           </ul>
        </div>
      </section>
    </div>
  );
};

export default LogicDocumentation;
