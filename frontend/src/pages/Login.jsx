import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Home, Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Connexion réussie !');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
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
                Connexion
              </CardTitle>
              <CardDescription>
                Entrez vos identifiants pour accéder à votre espace
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
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
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  type="submit" 
                  className="w-full btn-hover" 
                  disabled={loading}
                  data-testid="login-btn"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Pas encore de compte ?{' '}
                  <Link to="/register" className="text-primary hover:underline font-medium" data-testid="register-link">
                    S'inscrire
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
          backgroundImage: `url('https://images.unsplash.com/photo-1758548157747-285c7012db5b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtaW5pbWFsaXN0JTIwYXBhcnRtZW50JTIwaW50ZXJpb3IlMjBicmlnaHR8ZW58MHx8fHwxNzY5OTg2OTQwfDA&ixlib=rb-4.1.0&q=85')`,
        }}
      >
        <div className="h-full w-full bg-gradient-to-r from-background/80 to-transparent flex items-end p-12">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Gérez votre parc locatif en toute simplicité
            </h2>
            <p className="text-muted-foreground">
              Suivez vos loyers, gérez vos locataires et optimisez vos revenus locatifs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
