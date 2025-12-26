
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onSignOut: () => void;
  userEmail?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onSignOut, userEmail }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'menus', label: 'Menus', icon: 'fa-book-open' },
    { id: 'dishes', label: 'Dishes', icon: 'fa-utensils' },
    { id: 'recipes', label: 'Recipes', icon: 'fa-scroll' },
    { id: 'ingredients', label: 'Ingredients', icon: 'fa-box-open' },
    { id: 'suppliers', label: 'Suppliers', icon: 'fa-truck-field' },
    { id: 'logic', label: 'Logic & Specs', icon: 'fa-brain' },
  ];

  return (
    <aside className="w-64 bg-stone-900 text-stone-400 flex flex-col border-r border-stone-800 sticky top-0 h-screen print:hidden">
      <div className="p-8">
        <div className="flex items-center gap-3 text-white mb-8">
          <div className="w-8 h-8 bg-white text-stone-900 flex items-center justify-center rounded font-bold text-xl">M</div>
          <span className="font-semibold tracking-wider text-sm uppercase">Mise en Place</span>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                activeTab === item.id 
                ? 'bg-stone-800 text-white shadow-inner font-medium' 
                : 'hover:bg-stone-800 hover:text-stone-200'
              }`}
            >
              <i className={`fas ${item.icon} w-5`}></i>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-8 border-t border-stone-800">
        <div className="flex items-center gap-3 mb-4">
          <img src="https://picsum.photos/seed/chef/40/40" className="w-10 h-10 rounded-full grayscale" alt="Chef profile" />
          <div className="text-xs overflow-hidden">
            <p className="text-white font-medium truncate">Chef</p>
            <p className="text-stone-500 truncate" title={userEmail || ''}>{userEmail || 'Executive Chef'}</p>
          </div>
        </div>
        <button 
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 rounded transition-colors"
        >
          <i className="fas fa-sign-out-alt"></i> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
