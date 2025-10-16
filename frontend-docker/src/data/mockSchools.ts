export interface School {
  id: string;
  name: string;
  city: string;
  region: string;
  level: string;
  status: string;
  address: string;
  students: number;
  last_diagnostic?: string;
  logo_url?: string;
}

export const mockSchools: School[] = [
  {
    id: '1',
    name: 'École Ibn Battuta',
    city: 'Oujda',
    region: 'Oriental',
    level: 'Primaire',
    status: 'Public',
    address: 'Quartier Al Qods, Oujda',
    students: 320,
    last_diagnostic: '2025-09-15',
  },
  {
    id: '2',
    name: 'Collège Al Andalous',
    city: 'Fès',
    region: 'Fès-Meknès',
    level: 'Collège',
    status: 'Public',
    address: 'Avenue Hassan II, Fès',
    students: 580,
    last_diagnostic: '2025-08-22',
  },
  {
    id: '3',
    name: 'Lycée Pasteur',
    city: 'Casablanca',
    region: 'Casablanca-Settat',
    level: 'Lycée',
    status: 'Privé',
    address: 'Boulevard Zerktouni, Casablanca',
    students: 450,
    last_diagnostic: '2025-10-01',
  },
  {
    id: '4',
    name: 'École Al Farabi',
    city: 'Rabat',
    region: 'Rabat-Salé-Kénitra',
    level: 'Primaire',
    status: 'Public',
    address: 'Hay Riad, Rabat',
    students: 280,
    last_diagnostic: '2025-09-28',
  },
  {
    id: '5',
    name: 'Collège Ibn Khaldoun',
    city: 'Marrakech',
    region: 'Marrakech-Safi',
    level: 'Collège',
    status: 'Public',
    address: 'Gueliz, Marrakech',
    students: 620,
    last_diagnostic: '2025-09-10',
  },
  {
    id: '6',
    name: 'Lycée Excellence',
    city: 'Tanger',
    region: 'Tanger-Tétouan-Al Hoceïma',
    level: 'Lycée',
    status: 'Privé',
    address: 'Avenue Mohammed VI, Tanger',
    students: 380,
    last_diagnostic: '2025-09-25',
  },
];
