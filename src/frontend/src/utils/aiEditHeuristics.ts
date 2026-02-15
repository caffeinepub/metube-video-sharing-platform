// On-device AI Edit heuristics - no external AI/LLM services
export interface AiEditSuggestions {
  title: string;
  description: string;
  tags: string[];
}

export function generateAiEditSuggestions(
  currentTitle: string,
  currentDescription: string,
  currentTags: string[]
): AiEditSuggestions {
  // Title improvements: capitalize properly, trim whitespace, remove excessive punctuation
  const improvedTitle = improveTitleHeuristic(currentTitle);
  
  // Description improvements: format paragraphs, fix spacing
  const improvedDescription = improveDescriptionHeuristic(currentDescription);
  
  // Tags: extract keywords from title and description, deduplicate
  const improvedTags = improveTagsHeuristic(currentTitle, currentDescription, currentTags);
  
  return {
    title: improvedTitle,
    description: improvedDescription,
    tags: improvedTags,
  };
}

function improveTitleHeuristic(title: string): string {
  if (!title) return title;
  
  // Trim whitespace
  let improved = title.trim();
  
  // Remove excessive punctuation
  improved = improved.replace(/[!?]{2,}/g, '!');
  improved = improved.replace(/\.{2,}/g, '...');
  
  // Title case for first letter of each major word
  improved = improved
    .split(' ')
    .map((word, index) => {
      if (word.length === 0) return word;
      // Capitalize first word and words longer than 3 characters
      if (index === 0 || word.length > 3) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(' ');
  
  return improved;
}

function improveDescriptionHeuristic(description: string): string {
  if (!description) return description;
  
  // Trim whitespace
  let improved = description.trim();
  
  // Fix multiple spaces
  improved = improved.replace(/\s+/g, ' ');
  
  // Fix line breaks (max 2 consecutive)
  improved = improved.replace(/\n{3,}/g, '\n\n');
  
  // Ensure sentences end with proper punctuation
  improved = improved.replace(/([a-z0-9])\s*\n/gi, '$1.\n');
  
  return improved;
}

function improveTagsHeuristic(
  title: string,
  description: string,
  currentTags: string[]
): string[] {
  const allText = `${title} ${description}`.toLowerCase();
  
  // Extract potential keywords (words longer than 3 characters)
  const words = allText
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  // Count word frequency
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });
  
  // Get top keywords (appearing more than once)
  const topKeywords = Array.from(wordFreq.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  
  // Combine with existing tags and deduplicate
  const allTags = [...currentTags, ...topKeywords];
  const uniqueTags = Array.from(new Set(allTags.map(tag => tag.toLowerCase())))
    .slice(0, 10); // Limit to 10 tags
  
  return uniqueTags;
}
