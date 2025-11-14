import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SchoolManage = () => {
  const { id: schoolId } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState<any>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState<string | null>(null);

  useEffect(() => {
    loadSchool();
    loadAdmin();
    loadTeachers();
    loadClasses();
  }, [schoolId]);

  const loadSchool = async () => {
    const { data } = await supabase.from('schools').select('*').eq('id', schoolId).single();
    setSchool(data);
  };

  const loadAdmin = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').eq('school_id', schoolId);
    const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    const adminProfile = profiles?.find((p: any) => roles?.some((r: any) => r.user_id === p.id));
    setAdmin(adminProfile);
  };

  const loadTeachers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').eq('school_id', schoolId);
    const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'teacher');
    const teacherProfiles = profiles?.filter((p: any) => roles?.some((r: any) => r.user_id === p.id));
    setTeachers(teacherProfiles || []);
  };

  const loadClasses = async () => {
    const { data } = await supabase.from('classes').select('*').eq('school_id', schoolId);
    setClasses(data || []);
  };

  const loadStudents = async (classId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('class_id', classId);
    setStudents(data || []);
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const response = await fetch(`/api/superadmin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (response.ok && result.newPassword) {
        setResetPasswordValue(result.newPassword);
        setShowPasswordDialog(true);
      } else {
        toast.error(result.error || 'Erreur lors de la réinitialisation du mot de passe');
      }
    } catch (error) {
      toast.error('Erreur réseau');
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Gestion de l’école</h1>
      {school && <Card className="mb-6 p-4">École: {school.name}</Card>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Admin Section */}
        <Card className="p-4">
          <h2 className="font-semibold mb-2">Admin</h2>
          {admin ? (
            <div>
              <div>{admin.full_name || admin.email}</div>
              <Button size="sm" onClick={() => handleResetPassword(admin.id)}>Réinitialiser le mot de passe</Button>
            </div>
          ) : <div>Aucun admin trouvé</div>}
        </Card>
        {/* Teachers Section */}
        <Card className="p-4">
          <h2 className="font-semibold mb-2">Enseignants</h2>
          {teachers.length > 0 ? teachers.map((teacher: any) => (
            <div key={teacher.id} className="flex items-center justify-between mb-2">
              <span>{teacher.full_name || teacher.email}</span>
              <Button size="sm" onClick={() => handleResetPassword(teacher.id)}>Réinitialiser le mot de passe</Button>
            </div>
          )) : <div>Aucun enseignant trouvé</div>}
        </Card>
        {/* Classes Section */}
        <Card className="p-4">
          <h2 className="font-semibold mb-2">Classes</h2>
          {classes.length > 0 ? classes.map((classe: any) => (
            <div key={classe.id} className="mb-2">
              <Button variant="outline" size="sm" onClick={() => { setSelectedClass(classe); loadStudents(classe.id); }}>
                {classe.name}
              </Button>
            </div>
          )) : <div>Aucune classe trouvée</div>}
          {selectedClass && (
            <div className="mt-4">
              <h3 className="font-semibold">Élèves de {selectedClass.name}</h3>
              {students.length > 0 ? students.map((student: any) => (
                <div key={student.id} className="flex items-center justify-between mb-2">
                  <span>{student.full_name || student.email}</span>
                  <Button size="sm" onClick={() => handleResetPassword(student.id)}>Réinitialiser le mot de passe</Button>
                </div>
              )) : <div>Aucun élève trouvé</div>}
            </div>
          )}
        </Card>
      </div>
      {/* Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 min-w-[300px]">
            <h2 className="font-bold mb-4">Nouveau mot de passe</h2>
            <div className="mb-4 text-lg font-mono">{resetPasswordValue}</div>
            <Button onClick={() => {navigator.clipboard.writeText(resetPasswordValue || '');}}>Copier</Button>
            <Button variant="ghost" className="ml-2" onClick={() => setShowPasswordDialog(false)}>Fermer</Button>
          </div>
        </div>
      )}
      <Button variant="ghost" className="mt-8" onClick={() => navigate(-1)}>Retour</Button>
    </div>
  );
};

export default SchoolManage;
