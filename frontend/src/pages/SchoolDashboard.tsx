import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const SchoolDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login page
    navigate(`/school/${id}/login`, { replace: true });
  }, [id, navigate]);

  return null;
};

export default SchoolDashboard;
