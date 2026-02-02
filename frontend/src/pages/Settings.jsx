import React, { useState, useEffect } from 'react';
import { notificationsAPI, remindersAPI } from '../lib/api';
import { usePushNotifications } from '../lib/pwa';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Bell,
  BellRing,
  BellOff,
  CreditCard,
  Calendar,
  Home,
  Save,
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  Moon,
  Sun,
  Loader2,
  Smartphone
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    late_payment: true,
    late_payment_days: 5,
    lease_ending: true,
    lease_ending_days: 60,
    vacancy_alert: true,
    vacancy_alert_days: 30,
    email_reminders: false,
    reminder_frequency: 'weekly',
    smtp_email: '',
    smtp_password: '',
    smtp_configured: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  
  // Push notifications hook
  const { 
    isSupported: pushSupported, 
    isSubscribed: pushSubscribed, 
    isLoading: pushLoading,
    permission: pushPermission,
    subscribe: subscribeToPush, 
    unsubscribe: unsubscribeFromPush,
    sendTestNotification 
  } = usePushNotifications();

  useEffect(() => {
    loadSettings();
    // Check if dark mode is enabled
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const loadSettings = async () => {
    try {
      const response = await notificationsAPI.getSettings();
      setSettings({
        ...settings,
        ...response.data,
        smtp_password: response.data.smtp_password ? '••••••••••••••••' : ''
      });
    } catch (error) {
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = { ...settings };
      // Don't send masked password
      if (dataToSave.smtp_password === '••••••••••••••••') {
        delete dataToSave.smtp_password;
      }
      await notificationsAPI.updateSettings(dataToSave);
      toast.success('Paramètres enregistrés avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    try {
      // Save settings first if password was changed
      if (settings.smtp_password && settings.smtp_password !== '••••••••••••••••') {
        await notificationsAPI.updateSettings(settings);
      }
      
      const response = await remindersAPI.testSmtp();
      toast.success(response.data.message);
      setSettings(prev => ({ ...prev, smtp_configured: true }));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors du test SMTP');
    } finally {
      setTestingSmtp(false);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
          Paramètres
        </h1>
        <p className="text-muted-foreground mt-1">
          Configurez les notifications, emails et préférences
        </p>
      </div>

      {/* Appearance Settings */}
      <Card className="border">
        <CardHeader>
          <div className="flex items-center gap-2">
            {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            <CardTitle style={{ fontFamily: 'Manrope, sans-serif' }}>
              Apparence
            </CardTitle>
          </div>
          <CardDescription>
            Personnalisez l'apparence de l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Moon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label className="text-base font-medium">Mode sombre</Label>
                <p className="text-sm text-muted-foreground">
                  Activer le thème sombre pour réduire la fatigue oculaire
                </p>
              </div>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={toggleDarkMode}
              data-testid="dark-mode-switch"
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card className="border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle style={{ fontFamily: 'Manrope, sans-serif' }}>
                Configuration Email (Gmail SMTP)
              </CardTitle>
            </div>
            {settings.smtp_configured ? (
              <Badge variant="default" className="bg-emerald-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Configuré
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="h-3 w-3 mr-1" />
                Non configuré
              </Badge>
            )}
          </div>
          <CardDescription>
            Configurez Gmail pour envoyer des rappels automatiques aux locataires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_email">Adresse Gmail</Label>
              <Input
                id="smtp_email"
                type="email"
                value={settings.smtp_email || ''}
                onChange={(e) => setSettings({ ...settings, smtp_email: e.target.value, smtp_configured: false })}
                placeholder="votre.email@gmail.com"
                data-testid="smtp-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_password">Mot de passe d'application</Label>
              <Input
                id="smtp_password"
                type="password"
                value={settings.smtp_password || ''}
                onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value, smtp_configured: false })}
                placeholder="••••••••••••••••"
                data-testid="smtp-password-input"
              />
              <p className="text-xs text-muted-foreground">
                Créez un mot de passe d'application sur{' '}
                <a 
                  href="https://myaccount.google.com/apppasswords" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  myaccount.google.com/apppasswords
                </a>
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleTestSmtp}
            disabled={!settings.smtp_email || !settings.smtp_password || testingSmtp}
            data-testid="test-smtp-btn"
          >
            {testingSmtp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Tester la connexion
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Email Reminders Settings */}
      <Card className="border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <CardTitle style={{ fontFamily: 'Manrope, sans-serif' }}>
              Rappels par email
            </CardTitle>
          </div>
          <CardDescription>
            Configurez les rappels automatiques pour les loyers impayés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label className="text-base font-medium">Activer les rappels automatiques</Label>
                <p className="text-sm text-muted-foreground">
                  Envoyer automatiquement des rappels aux locataires en retard de paiement
                </p>
              </div>
            </div>
            <Switch
              checked={settings.email_reminders}
              onCheckedChange={(checked) => setSettings({ ...settings, email_reminders: checked })}
              disabled={!settings.smtp_configured}
              data-testid="email-reminders-switch"
            />
          </div>

          {settings.email_reminders && (
            <div className="space-y-2 ml-14">
              <Label>Fréquence des rappels</Label>
              <Select 
                value={settings.reminder_frequency} 
                onValueChange={(value) => setSettings({ ...settings, reminder_frequency: value })}
              >
                <SelectTrigger className="w-64" data-testid="reminder-frequency-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire (par défaut)</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {!settings.smtp_configured && (
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              Vous devez d'abord configurer et tester la connexion SMTP ci-dessus pour activer les rappels.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle style={{ fontFamily: 'Manrope, sans-serif' }}>
              Alertes dans l'application
            </CardTitle>
          </div>
          <CardDescription>
            Configurez les alertes qui apparaissent dans le tableau de bord
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Late Payment Alerts */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <CreditCard className="h-5 w-5 text-red-500" />
              </div>
              <div className="space-y-1">
                <Label className="text-base font-medium">Loyers en retard</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir une notification lorsqu'un loyer n'est pas payé
                </p>
                {settings.late_payment && (
                  <div className="flex items-center gap-2 mt-2">
                    <Label htmlFor="late_payment_days" className="text-sm">Délai :</Label>
                    <Input
                      id="late_payment_days"
                      type="number"
                      min="1"
                      max="30"
                      value={settings.late_payment_days}
                      onChange={(e) => setSettings({ ...settings, late_payment_days: parseInt(e.target.value) })}
                      className="w-20 h-8"
                      data-testid="late-payment-days-input"
                    />
                    <span className="text-sm text-muted-foreground">jours après l'échéance</span>
                  </div>
                )}
              </div>
            </div>
            <Switch
              checked={settings.late_payment}
              onCheckedChange={(checked) => setSettings({ ...settings, late_payment: checked })}
              data-testid="late-payment-switch"
            />
          </div>

          <Separator />

          {/* Lease Ending Alerts */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div className="space-y-1">
                <Label className="text-base font-medium">Fin de bail</Label>
                <p className="text-sm text-muted-foreground">
                  Être alerté avant la fin d'un bail
                </p>
                {settings.lease_ending && (
                  <div className="flex items-center gap-2 mt-2">
                    <Label htmlFor="lease_ending_days" className="text-sm">Délai :</Label>
                    <Input
                      id="lease_ending_days"
                      type="number"
                      min="7"
                      max="180"
                      value={settings.lease_ending_days}
                      onChange={(e) => setSettings({ ...settings, lease_ending_days: parseInt(e.target.value) })}
                      className="w-20 h-8"
                      data-testid="lease-ending-days-input"
                    />
                    <span className="text-sm text-muted-foreground">jours avant la fin</span>
                  </div>
                )}
              </div>
            </div>
            <Switch
              checked={settings.lease_ending}
              onCheckedChange={(checked) => setSettings({ ...settings, lease_ending: checked })}
              data-testid="lease-ending-switch"
            />
          </div>

          <Separator />

          {/* Vacancy Alerts */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label className="text-base font-medium">Vacance prolongée</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir une alerte si un bien reste vacant trop longtemps
                </p>
                {settings.vacancy_alert && (
                  <div className="flex items-center gap-2 mt-2">
                    <Label htmlFor="vacancy_alert_days" className="text-sm">Délai :</Label>
                    <Input
                      id="vacancy_alert_days"
                      type="number"
                      min="7"
                      max="365"
                      value={settings.vacancy_alert_days}
                      onChange={(e) => setSettings({ ...settings, vacancy_alert_days: parseInt(e.target.value) })}
                      className="w-20 h-8"
                      data-testid="vacancy-alert-days-input"
                    />
                    <span className="text-sm text-muted-foreground">jours de vacance</span>
                  </div>
                )}
              </div>
            </div>
            <Switch
              checked={settings.vacancy_alert}
              onCheckedChange={(checked) => setSettings({ ...settings, vacancy_alert: checked })}
              data-testid="vacancy-alert-switch"
            />
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} data-testid="save-settings-btn">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
