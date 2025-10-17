import { DiagnosticGrid } from '@/types/diagnostic';

export const DIAGNOSTIC_GRIDS: DiagnosticGrid[] = [
  {
    type: 'learning_pace',
    title: 'Diagnostic du rythme d\'apprentissage',
    description: 'Évaluation du rythme d\'apprentissage des élèves (CM2 / 5ᵉ AEP)',
    criteria: [
      {
        id: 'reading_comprehension',
        label: 'Lecture / Compréhension',
        options: ['Correct', 'Partiel', 'Faux']
      },
      {
        id: 'calculation',
        label: 'Calcul',
        options: ['Correct', 'Partiel', 'Incomplet', 'Faux']
      },
      {
        id: 'written_expression',
        label: 'Expression écrite',
        options: ['Oui', 'Non']
      },
      {
        id: 'arabic_reading',
        label: 'قراءة وفهم (Arabe)',
        options: ['صحيح', 'خطأ']
      }
    ],
    resultOptions: ['Rapide', 'Normal', 'Lent']
  },
  {
    type: 'learning_style',
    title: 'Diagnostic du style d\'apprentissage',
    description: 'Identification du style d\'apprentissage dominant (Visuel, Auditif, Kinesthésique)',
    criteria: [
      {
        id: 'visual',
        label: 'Visuel (décrit l\'image)',
        options: ['Faible', 'Moyen', 'Parfait']
      },
      {
        id: 'auditory',
        label: 'Auditif (retient ce qu\'il entend)',
        options: ['Faible', 'Moyen', 'Parfait']
      },
      {
        id: 'kinesthetic',
        label: 'Kinesthésique (mime l\'action)',
        options: ['Faible', 'Moyen', 'Parfait']
      }
    ],
    resultOptions: ['Visuel', 'Auditif', 'Kinesthésique']
  },
  {
    type: 'multiple_intelligences',
    title: 'Diagnostic des intelligences multiples',
    description: 'Identification des intelligences dominantes selon la théorie de Gardner',
    criteria: [
      {
        id: 'linguistic',
        label: 'Linguistique',
        options: ['Fort', 'Moyen', 'Faible']
      },
      {
        id: 'logical',
        label: 'Logico-mathématique',
        options: ['Fort', 'Moyen', 'Faible']
      },
      {
        id: 'spatial',
        label: 'Spatiale',
        options: ['Fort', 'Moyen', 'Faible']
      },
      {
        id: 'musical',
        label: 'Musicale',
        options: ['Fort', 'Moyen', 'Faible']
      },
      {
        id: 'bodily',
        label: 'Corporelle',
        options: ['Fort', 'Moyen', 'Faible']
      },
      {
        id: 'interpersonal',
        label: 'Interpersonnelle',
        options: ['Fort', 'Moyen', 'Faible']
      },
      {
        id: 'intrapersonal',
        label: 'Intrapersonnelle',
        options: ['Fort', 'Moyen', 'Faible']
      },
      {
        id: 'naturalist',
        label: 'Naturaliste',
        options: ['Fort', 'Moyen', 'Faible']
      }
    ],
    resultOptions: ['Linguistique', 'Logique', 'Spatiale', 'Musicale', 'Corporelle', 'Interpersonnelle', 'Intrapersonnelle', 'Naturaliste']
  },
  {
    type: 'family_support',
    title: 'Diagnostic du soutien familial',
    description: 'Évaluation du niveau de soutien familial dans le processus d\'apprentissage',
    criteria: [
      {
        id: 'organization',
        label: 'Organisation (matériel, devoirs)',
        options: ['Bonne', 'Moyenne', 'Faible']
      },
      {
        id: 'supervision',
        label: 'Encadrement (aide familiale)',
        options: ['Présent', 'Occasionnel', 'Absent']
      },
      {
        id: 'motivation',
        label: 'Motivation (attitude)',
        options: ['Forte', 'Moyenne', 'Faible']
      },
      {
        id: 'teacher_observation',
        label: 'Observation de l\'enseignant',
        options: ['Fort', 'Moyen', 'Faible']
      }
    ],
    resultOptions: ['Fort', 'Moyen', 'Faible']
  },
  {
    type: 'participation_motivation',
    title: 'Diagnostic de participation et motivation',
    description: 'Mesure de la participation et de la motivation lors des activités collectives',
    criteria: [
      {
        id: 'participation',
        label: 'Participation',
        options: ['Active', 'Moyenne', 'Faible']
      },
      {
        id: 'motivation',
        label: 'Motivation',
        options: ['Forte', 'Moyenne', 'Faible']
      },
      {
        id: 'teacher_observation',
        label: 'Observation de l\'enseignant',
        options: ['Excellente', 'Bonne', 'À améliorer']
      }
    ],
    resultOptions: ['Haute', 'Moyenne', 'Basse']
  }
];

export const GRADE_LEVELS = [
  '1ère année',
  '2ème année',
  '3ème année',
  '4ème année',
  '5ème année',
  '6ème année'
];

export function getDiagnosticGrid(type: string) {
  return DIAGNOSTIC_GRIDS.find(grid => grid.type === type);
}
