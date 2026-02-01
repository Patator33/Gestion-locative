import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { 
  Settings as SettingsIcon,
  Bell,
  CreditCard,
  Calendar,
  Home,
  Save
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    late_payment: true,
    late_payment_days: 5,
    lease_ending: true,
    lease_ending_days: 60,
    vacancy_alert: true,
    vacancy_alert_days: 30
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await notificationsAPI.getSettings();
      setSettings(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await notificationsAPI.updateSettings(settings);
      toast.success('Paramètres enregistrés avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
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
          Configurez les notifications et préférences
        </p>
      </div>

      {/* Notification Settings */}
      <Card className="border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle style={{ fontFamily: 'Manrope, sans-serif' }}>
              Notifications
            </CardTitle>
          </div>
          <CardDescription>
            Configurez les alertes automatiques
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
