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
      className="group relative overflow-hidden border-slate-200 bg-white hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/school/${school.id}/login`)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {school.logo_url && (
            <img 
              src={school.logo_url} 
              alt={`Logo ${school.name}`}
              className="h-16 w-16 object-contain rounded-lg border border-slate-200"
            />
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-all duration-200">
              {school.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4" />
              <span>{school.city}</span>
              <span className="text-slate-300">•</span>
              <span>{school.region}</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200">
            {school.level}
          </Badge>
          <Badge
            variant="outline"
            className={
              school.status === 'Public'
                ? 'border-emerald-300 text-emerald-600'
                : 'border-blue-300 text-blue-600'
            }
          >
            {school.status}
          </Badge>
        </div>

        {/* Info */}
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{school.students} élèves</span>
          </div>
          {school.last_diagnostic && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Dernier diagnostic: {formatDate(school.last_diagnostic)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 border-2 border-primary opacity-0 group-hover:opacity-100 transition-smooth rounded-lg pointer-events-none" />
    </Card>
  );
};

export default SchoolCard;
