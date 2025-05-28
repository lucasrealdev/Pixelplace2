interface FeaturedTagsProps {
  tags: string[];
  selectedCategories?: string[];
  onTagsClick: (tag: string) => void;
  title?: string;
  maxToShow?: number;
  className?: string;
}

export default function FeaturedTags({
  tags,
  selectedCategories = [],
  onTagsClick,
  title = "Categorias em Destaque",
  maxToShow = 6,
  className = "",
}: FeaturedTagsProps) {
  function renderTag(tag: string, tagIndex: number) {
    return (
      <div
        key={tagIndex}
        className={`relative rounded-lg overflow-hidden cursor-pointer group bg-gradient-to-tr from-cyan-700 via-gray-800 to-blue-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-gray-700 ${selectedCategories.includes(tag) ? 'border-cyan-400 scale-[1.02]' : ''}`}
        onClick={() => onTagsClick(tag)}
        tabIndex={0}
        aria-label={`Selecionar Tag ${tag}`}
      >
        <div className="flex flex-col justify-end items-start h-28 sm:h-32 md:h-36 lg:h-40 xl:h-44 2xl:h-48 p-4">
          <span className="text-2xl md:text-3xl font-bold text-cyan-300 drop-shadow-lg mb-2">
            {tag.charAt(0)}
          </span>
          <h4 className="font-medium text-base md:text-lg text-white tracking-wide">
            {tag}
          </h4>
          <div className="mt-2 w-8 h-1 rounded bg-cyan-400 opacity-70 group-hover:opacity-100 transition" />
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex justify-between items-center mb-3 md:mb-4">
        <h3 className="text-base md:text-lg font-medium">{title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {tags.slice(0, maxToShow).map(renderTag)}
      </div>
    </div>
  );
} 