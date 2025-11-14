import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Calendar, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { School } from '@/data/mockSchools';

interface SchoolCardProps {
  school: School;
}

const SchoolCard = ({ school }: SchoolCardProps) => {
  const navigate = useNavigate();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Aucun';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Card
      className="group relative overflow-hidden border-2 border-blue-200 bg-white hover:shadow-xl hover:border-emerald-400 transition-all duration-300 cursor-pointer hover:scale-105"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {school.logo_url && (
            <img 
              src={school.logo_url} 
              alt={`Logo ${school.name}`}
              className="h-16 w-16 object-contain rounded-lg border-2 border-blue-200 group-hover:border-emerald-400 transition-colors duration-200"
            />
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-600 mb-1 group-hover:text-emerald-600 transition-all duration-200">
              {school.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-blue-500">
              <MapPin className="h-4 w-4" />
              <span>{school.city}</span>
              <span className="text-blue-300">•</span>
              <span>{school.region}</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-blue-500 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-200" />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
            {school.level}
          </Badge>
          <Badge
            variant="outline"
            className={
              school.status === 'Public'
                ? 'border-emerald-400 text-emerald-600 hover:bg-emerald-50'
                : 'border-blue-400 text-blue-600 hover:bg-blue-50'
            }
          >
            {school.status}
          </Badge>
        </div>

        {/* Info */}
        <div className="flex items-center gap-4 text-sm text-blue-600">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{school.students} élèves</span>
          </div>
          {/* Show teacher and user counts if available */}
          {typeof school.teachers !== 'undefined' && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{school.teachers} profs</span>
            </div>
          )}
          {typeof school.users !== 'undefined' && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{school.users} users</span>
            </div>
          )}
          {school.last_diagnostic && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Dernier diagnostic: {formatDate(school.last_diagnostic)}</span>
            </div>
          )}
        </div>
        {/* Manage button for superadmin */}
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="secondary" onClick={() => navigate(`/school/${school.id}/manage`)}>
            Gérer
          </Button>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 border-2 border-primary opacity-0 group-hover:opacity-100 transition-smooth rounded-lg pointer-events-none" />
    </Card>
  );
};

export default SchoolCard;
