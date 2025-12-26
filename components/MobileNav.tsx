
import React from 'react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-chart-pie', label: 'Home' },
    { id: 'menus', icon: 'fa-book-open', label: 'Menus' },
    { id: 'dishes', icon: 'fa-utensils', label: 'Dishes' },
    { id: 'recipes', icon: 'fa-scroll', label: 'Recipes' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-stone-900/95 backdrop-blur-md text-stone-400 border-t border-stone-800 z-50 pb-safe print:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              activeTab === item.id 
              ? 'text-white' 
              : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            <i className={`fas ${item.icon} text-lg ${activeTab === item.id ? 'transform scale-110' : ''}`}></i>
            <span className="text-[9px] font-medium uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
        <button 
           onClick={() => setActiveTab('ingredients')}
           className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'ingredients' ? 'text-white' : 'text-stone-500'}`}
        >
           <i className="fas fa-box-open text-lg"></i>
           <span className="text-[9px] font-medium uppercase tracking-wider">Items</span>
        </button>
      </div>
    </div>
  );
};

export default MobileNav;
