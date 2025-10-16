import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createDemoUsers } from '@/lib/createDemoUsers';
import { Loader2, Check } from 'lucide-react';

export const SetupDemo = () => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      await createDemoUsers();
      setDone(true);
    } catch (error) {
      console.error('Setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Card className="p-6 bg-accent/10 border-accent">
        <div className="flex items-center gap-3">
          <Check className="h-6 w-6 text-accent" />
          <div>
            <h3 className="font-semibold text-foreground">Configuration terminée</h3>
            <p className="text-sm text-muted-foreground">
              Les utilisateurs de démonstration ont été créés avec succès.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-primary/10 border-primary">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-foreground mb-2">Configuration initiale requise</h3>
          <p className="text-sm text-muted-foreground">
            Cliquez sur le bouton ci-dessous pour créer les utilisateurs de démonstration pour toutes les écoles.
          </p>
        </div>
        <Button onClick={handleSetup} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création en cours...
            </>
          ) : (
            'Créer les utilisateurs de démonstration'
          )}
        </Button>
      </div>
    </Card>
  );
};
