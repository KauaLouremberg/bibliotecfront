const CATALOG_GENRES_PT = [
  'Literatura brasileira',
  'Romance',
  'Fantasia',
  'Ficção científica',
  'História',
  'Tecnologia',
  'Biografia',
  'Filosofia',
] as const;

const SUBJECT_LABELS_PT: Record<string, string> = {
  'brazilian literature': 'Literatura brasileira',
  'portuguese literature': 'Literatura portuguesa',
  literature: 'Literatura',
  fiction: 'Ficção',
  'literary fiction': 'Literatura',
  romance: 'Romance',
  'romance fiction': 'Romance',
  'love stories': 'Romance',
  fantasy: 'Fantasia',
  'fantasy fiction': 'Fantasia',
  'science fiction': 'Ficção científica',
  history: 'História',
  'historical fiction': 'História',
  technology: 'Tecnologia',
  computers: 'Tecnologia',
  'computer science': 'Tecnologia',
  biography: 'Biografia',
  autobiography: 'Biografia',
  memoirs: 'Biografia',
  philosophy: 'Filosofia',
  'mystery and detective stories': 'Mistério',
  mystery: 'Mistério',
  detective: 'Mistério',
  horror: 'Terror',
  poetry: 'Poesia',
  drama: 'Drama',
  'juvenile fiction': 'Literatura infantojuvenil',
  'young adult fiction': 'Literatura juvenil',
  thriller: 'Suspense',
  suspense: 'Suspense',
  'adventure stories': 'Aventura',
  adventure: 'Aventura',
  comics: 'Quadrinhos',
  'graphic novels': 'Quadrinhos',
  psychology: 'Psicologia',
  religion: 'Religião',
  art: 'Arte',
  music: 'Música',
  education: 'Educação',
  business: 'Negócios',
  economics: 'Economia',
  politics: 'Política',
  sociology: 'Sociologia',
  science: 'Ciência',
  mathematics: 'Matemática',
  medicine: 'Medicina',
  cooking: 'Culinária',
  travel: 'Viagem',
  sports: 'Esportes',
  'self-help': 'Autoajuda',
  classics: 'Clássicos',
  essays: 'Ensaios',
  mythology: 'Mitologia',
  folklore: 'Folclore',
  law: 'Direito',
  nature: 'Natureza',
  environment: 'Meio ambiente',
};

const GENRE_MATCH_ORDER = Object.entries(SUBJECT_LABELS_PT).sort(
  ([left], [right]) => right.length - left.length,
);

const KNOWN_PT = new Set<string>(CATALOG_GENRES_PT);

export function formatGenreLabel(genre: string): string {
  const trimmed = genre.trim();
  if (!trimmed) return '';

  if (KNOWN_PT.has(trimmed)) return trimmed;

  const key = trimmed.toLowerCase();
  const exact = SUBJECT_LABELS_PT[key];
  if (exact) return exact;

  for (const [subjectKey, label] of GENRE_MATCH_ORDER) {
    if (key.includes(subjectKey)) return label;
  }

  return trimmed;
}
