interface TagsFilterProps {
  tags: string[];
  selectedTags: string[];
  onTagsClick: (tag: string) => void;
  label?: string;
  className?: string;
}

export default function TagsFilter({
  tags,
  selectedTags,
  onTagsClick,
  label = "Tags",
  className = ""
}: TagsFilterProps) {
  return (
    <div className={className}>
      <label className="block text-xs mb-1 text-gray-300">{label}</label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              selectedTags.includes(tag)
                ? "bg-cyan-600 border-cyan-400 text-white"
                : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-cyan-900 hover:text-cyan-300"
            }`}
            onClick={() => onTagsClick(tag)}
            type="button"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
} 