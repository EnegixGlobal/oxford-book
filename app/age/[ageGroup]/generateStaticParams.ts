export async function generateStaticParams() {
  return [
  { ageGroup: '0-2' },
  { ageGroup: '3-5' },
  { ageGroup: '6-8' },
  { ageGroup: '9-12' },
  { ageGroup: 'teen' },
  { ageGroup: 'young-adult' },
  { ageGroup: 'old-man' }
  ];
}
