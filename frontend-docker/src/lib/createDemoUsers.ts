import { supabase } from '@/integrations/supabase/client';

// Script pour créer les utilisateurs de démonstration
// À exécuter une fois pour initialiser la base de données

export const demoUsers = [
  {
    email: 'admin.ibnbattuta@ecole.ma',
    password: 'admin123',
    schoolId: '1',
    role: 'admin' as const,
    fullName: 'Admin Ibn Battuta',
  },
  {
    email: 'prof.ibnbattuta@ecole.ma',
    password: 'prof123',
    schoolId: '1',
    role: 'teacher' as const,
    fullName: 'Professeur Ibn Battuta',
  },
  {
    email: 'admin.alandalous@ecole.ma',
    password: 'admin123',
    schoolId: '2',
    role: 'admin' as const,
    fullName: 'Admin Al Andalous',
  },
  {
    email: 'prof.alandalous@ecole.ma',
    password: 'prof123',
    schoolId: '2',
    role: 'teacher' as const,
    fullName: 'Professeur Al Andalous',
  },
  {
    email: 'admin.pasteur@ecole.ma',
    password: 'admin123',
    schoolId: '3',
    role: 'admin' as const,
    fullName: 'Admin Pasteur',
  },
  {
    email: 'prof.pasteur@ecole.ma',
    password: 'prof123',
    schoolId: '3',
    role: 'teacher' as const,
    fullName: 'Professeur Pasteur',
  },
  {
    email: 'admin.alfarabi@ecole.ma',
    password: 'admin123',
    schoolId: '4',
    role: 'admin' as const,
    fullName: 'Admin Al Farabi',
  },
  {
    email: 'prof.alfarabi@ecole.ma',
    password: 'prof123',
    schoolId: '4',
    role: 'teacher' as const,
    fullName: 'Professeur Al Farabi',
  },
  {
    email: 'admin.ibnkhaldoun@ecole.ma',
    password: 'admin123',
    schoolId: '5',
    role: 'admin' as const,
    fullName: 'Admin Ibn Khaldoun',
  },
  {
    email: 'prof.ibnkhaldoun@ecole.ma',
    password: 'prof123',
    schoolId: '5',
    role: 'teacher' as const,
    fullName: 'Professeur Ibn Khaldoun',
  },
  {
    email: 'admin.excellence@ecole.ma',
    password: 'admin123',
    schoolId: '6',
    role: 'admin' as const,
    fullName: 'Admin Excellence',
  },
  {
    email: 'prof.excellence@ecole.ma',
    password: 'prof123',
    schoolId: '6',
    role: 'teacher' as const,
    fullName: 'Professeur Excellence',
  },
];

export async function createDemoUsers() {
  console.log('🚀 Creating demo users...');

  for (const user of demoUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.fullName,
            school_id: user.schoolId,
            role: user.role,
          },
        },
      });

      if (authError) {
        console.error(`❌ Error creating ${user.email}:`, authError.message);
        continue;
      }

      if (authData.user) {
        console.log(`✅ Created ${user.role} user: ${user.email} (profile and role will be created automatically by trigger)`);
      }
    } catch (error) {
      console.error(`❌ Unexpected error for ${user.email}:`, error);
    }
  }

  console.log('✨ Demo users creation completed!');
}
