export interface PlanSelections {
  company: string | null;
  accommodation: string | null;
  duration: string | null;
  terrain: string | null;
  experience: string | null;
}

export const PLAN_STEPS: Array<{
  key: keyof PlanSelections;
  question: string;
  options: string[];
}> = [
  { key: 'company', question: 'Who is going?', options: ['Solo', 'Couple', 'Family', 'Friends'] },
  { key: 'accommodation', question: 'Where will you sleep?', options: ['Tent', 'Van', 'Cabin', 'Hammock'] },
  { key: 'duration', question: 'How long?', options: ['Weekend', 'Week', '2+ Weeks'] },
  { key: 'terrain', question: 'What terrain?', options: ['Mountains', 'Beach', 'Forest', 'Desert'] },
  { key: 'experience', question: 'Your experience level?', options: ['Beginner', 'Intermediate', 'Expert'] },
];

export function prefsToContext(prefs: PlanSelections | null): string {
  if (!prefs) return '';
  const parts: string[] = ['The user has the following camping preferences:'];
  if (prefs.company) parts.push(`- Company: ${prefs.company}`);
  if (prefs.accommodation) parts.push(`- Accommodation: ${prefs.accommodation}`);
  if (prefs.duration) parts.push(`- Duration: ${prefs.duration}`);
  if (prefs.terrain) parts.push(`- Terrain: ${prefs.terrain}`);
  if (prefs.experience) parts.push(`- Experience level: ${prefs.experience}`);
  parts.push('Tailor your responses to these preferences.');
  return parts.join('\n');
}

export function emptySelections(): PlanSelections {
  return { company: null, accommodation: null, duration: null, terrain: null, experience: null };
}
