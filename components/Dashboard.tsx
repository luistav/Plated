
import React from 'react';
import { Ingredient } from '../types';

interface DashboardProps {
  ingredientsCount: number;
  recipesCount: number;
  dishesCount: number;
  recentIngredients: Ingredient[];
}

const Dashboard: React.FC<DashboardProps> = ({ ingredientsCount, recipesCount, dishesCount, recentIngredients }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Ingredients" value={ingredientsCount} icon="fa-box-open" color="text-blue-600" />
        <StatCard title="Active Recipes" value={recipesCount} icon="fa-scroll" color="text-amber-600" />
        <StatCard title="Dish Concepts" value={dishesCount} icon="fa-utensils" color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex justify-between items-center">
            <span>Recent Ingredients</span>
            <button className="text-xs text-stone-400 hover:text-stone-600">View All</button>
          </h3>
          <div className="space-y-4">
            {recentIngredients.map(ing => (
              <div key={ing.id} className="flex justify-between items-center py-2 border-b border-stone-50 last:border-0">
                <div className="flex gap-3 items-center">
                   <div className="w-10 h-10 bg-stone-100 rounded flex items-center justify-center text-stone-400">
                      <i className="fas fa-tag"></i>
                   </div>
                   <div>
                     <p className="font-medium text-sm">{ing.name}</p>
                     <p className="text-xs text-stone-400">{ing.supplier}</p>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">${ing.price.toFixed(2)}</p>
                  <p className="text-xs text-stone-400">per {ing.packSize}{ing.packUnit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-stone-900 text-white p-8 rounded-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2 serif italic">Kitchen Intelligence</h3>
            <p className="text-stone-400 text-sm mb-6 max-w-xs">
              "Fine dining is just doing a common thing in an uncommon way."
            </p>
            <div className="flex gap-2">
               <span className="bg-stone-800 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider text-amber-400 border border-stone-700">Food Cost Alert</span>
               <span className="bg-stone-800 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider text-blue-400 border border-stone-700">R&D Update</span>
            </div>
          </div>
          <i className="fas fa-quote-right absolute -bottom-4 -right-4 text-9xl text-stone-800 opacity-50"></i>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: string, color: string }) => (
  <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:border-stone-300 transition-colors">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
        <h4 className="text-3xl font-bold">{value}</h4>
      </div>
      <div className={`${color} bg-stone-50 p-3 rounded-lg`}>
        <i className={`fas ${icon} text-lg`}></i>
      </div>
    </div>
  </div>
);

export default Dashboard;
