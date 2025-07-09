interface CategorySelectorProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategorySelector({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}: CategorySelectorProps) {
  return (
    <div className="overflow-x-auto py-2 px-4 bg-white whitespace-nowrap border-t border-neutral-200">
      <div className="inline-flex space-x-2">
        {categories.map((category) => (
          <button 
            key={category}
            onClick={() => onSelectCategory(category)} 
            className={`py-1 px-4 rounded-full text-sm font-medium transition ${
              selectedCategory === category 
                ? 'bg-[#FF5722] text-white' 
                : 'bg-neutral-100 text-neutral-700'
            }`}>
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
