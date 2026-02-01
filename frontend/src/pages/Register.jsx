import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Home, Mail, Lock, User } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      toast.success('Compte créé avec succès !');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="register-page">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Home className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              RentMaestro
            </span>
          </div>

          <Card className="border shadow-none">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Créer un compte
              </CardTitle>
              <CardDescription>
                Inscrivez-vous pour gérer votre parc locatif
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jean Dupont"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="name-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="exemple@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="email-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="password-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      data-testid="confirm-password-input"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  type="submit" 
                  className="w-full btn-hover" 
                  disabled={loading}
                  data-testid="register-btn"
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Déjà un compte ?{' '}
                  <Link to="/login" className="text-primary hover:underline font-medium" data-testid="login-link">
                    Se connecter
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      {/* Right side - Image */}
      <div 
        className="hidden lg:block lg:flex-1 bg-cover bg-center"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1533696848654-6bdf438edea4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMGtleXMlMjBoYW5kJTIwY2xvc2UlMjB1cHxlbnwwfHx8fDE3Njk5ODY5NDR8MA&ixlib=rb-4.1.0&q=85')`,
        }}
      >
        <div className="h-full w-full bg-gradient-to-r from-background/80 to-transparent flex items-end p-12">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Rejoignez des milliers de propriétaires
            </h2>
            <p className="text-muted-foreground">
              Simplifiez la gestion de vos biens immobiliers avec notre plateforme intuitive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
