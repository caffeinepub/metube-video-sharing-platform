// Local content policy enforcement for pornographic/explicit content blocking
// Case-insensitive keyword matching

const BLOCKED_KEYWORDS = [
  'porn',
  'pornography',
  'xxx',
  'sex',
  'sexual',
  'nude',
  'nudity',
  'naked',
  'explicit',
  'adult',
  'nsfw',
  'erotic',
  'hentai',
  'fetish',
  'orgasm',
  'masturbat',
  'penis',
  'vagina',
  'breast',
  'nipple',
  'genitals',
  'intercourse',
  'blowjob',
  'handjob',
  'anal',
  'oral sex',
  'cum',
  'ejaculat',
  'prostitut',
  'escort',
  'stripper',
  'camgirl',
  'onlyfans',
];

export function containsBlockedContent(text: string): boolean {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  return BLOCKED_KEYWORDS.some(keyword => {
    // Check for whole word matches or partial matches
    const regex = new RegExp(`\\b${keyword}`, 'i');
    return regex.test(lowerText) || lowerText.includes(keyword);
  });
}

export function getContentPolicyMessage(): string {
  return 'Content contains prohibited terms. Pornographic and explicit content is not allowed.';
}

export function getContentPolicyNote(): string {
  return 'Note: Pornographic and explicit content is prohibited on this platform.';
}
