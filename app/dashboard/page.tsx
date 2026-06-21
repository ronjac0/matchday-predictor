// --- BULLETPROOF FLAG DICTIONARY ---
const getFlag = (teamName: string) => {
  if (!teamName) return '🏳️';
  const name = teamName.toLowerCase();
  
  // Uses .includes() to catch weird API names like "IR Iran" or "Korea Republic"
  if (name.includes('argentina')) return '🇦🇷';
  if (name.includes('france')) return '🇫🇷';
  if (name.includes('brazil') || name.includes('brasil')) return '🇧🇷';
  if (name.includes('england')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if (name.includes('portugal')) return '🇵🇹';
  if (name.includes('spain') || name.includes('españa')) return '🇪🇸';
  if (name.includes('germany') || name.includes('deutschland')) return '🇩🇪';
  if (name.includes('italy') || name.includes('italia')) return '🇮🇹';
  if (name.includes('netherland') || name.includes('holland')) return '🇳🇱';
  if (name.includes('croatia')) return '🇭🇷';
  if (name.includes('morocco')) return '🇲🇦';
  if (name.includes('usa') || name.includes('united states')) return '🇺🇸';
  if (name.includes('mexico')) return '🇲🇽';
  if (name.includes('japan')) return '🇯🇵';
  if (name.includes('senegal')) return '🇸🇳';
  if (name.includes('uruguay')) return '🇺🇾';
  if (name.includes('belgium')) return '🇧🇪';
  if (name.includes('canada')) return '🇨🇦';
  if (name.includes('korea')) return '🇰🇷'; 
  if (name.includes('wales')) return '🏴󠁧󠁢󠁷󠁬󠁳󠁿';
  if (name.includes('iran')) return '🇮🇷'; 
  if (name.includes('saudi')) return '🇸🇦';
  if (name.includes('poland')) return '🇵🇱';
  if (name.includes('australia')) return '🇦🇺';
  if (name.includes('denmark')) return '🇩🇰';
  if (name.includes('tunisia')) return '🇹🇳';
  if (name.includes('costa rica')) return '🇨🇷';
  if (name.includes('cameroon')) return '🇨🇲';
  if (name.includes('ghana')) return '🇬🇭';
  if (name.includes('serbia')) return '🇷🇸';
  if (name.includes('switzerland')) return '🇨🇭';
  if (name.includes('ecuador')) return '🇪🇨';
  if (name.includes('qatar')) return '🇶🇦';
  if (name.includes('turkey') || name.includes('türkiye')) return '🇹🇷';
  if (name.includes('czech')) return '🇨🇿';
  if (name.includes('ukraine')) return '🇺🇦';
  if (name.includes('colombia')) return '🇨🇴';
  if (name.includes('chile')) return '🇨🇱';
  if (name.includes('peru')) return '🇵🇪';
  if (name.includes('egypt')) return '🇪🇬';
  if (name.includes('algeria')) return '🇩🇿';
  if (name.includes('ivory') || name.includes('ivoire')) return '🇨🇮';
  if (name.includes('nigeria')) return '🇳🇬';
  if (name.includes('scotland')) return '🏴󠁧󠁢󠁳󠁣󠁴󠁿';
  if (name.includes('ireland')) return '🇮🇪';
  if (name.includes('austria')) return '🇦🇹';
  if (name.includes('hungary')) return '🇭🇺';
  if (name.includes('romania')) return '🇷🇴';
  if (name.includes('sweden')) return '🇸🇪';
  
  return '🏳️'; // Default fallback if no keyword matches
};