import React, { useState, useEffect } from 'react';
import { vacanciesAPI, propertiesAPI } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Calendar,
  Building2,
  Clock,
  CheckCircle,
  Search
} from 'lucide-react';

const Vacancies = () => {
  const [vacancies, setVacancies] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [vacancyToEnd, setVacancyToEnd] = useState(null);
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    property_id: '',
    start_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vacanciesRes, propertiesRes] = await Promise.all([
        vacanciesAPI.getAll(),
        propertiesAPI.getAll()
      ]);
      setVacancies(vacanciesRes.data);
      setProperties(propertiesRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      property_id: '',
      start_date: new Date().toISOString().split('T')[0],
      reason: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await vacanciesAPI.create(formData);
      toast.success('Vacance enregistrée avec succès');
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleEndVacancy = async () => {
    if (!vacancyToEnd || !endDate) return;
    
    try {
      await vacanciesAPI.end(vacancyToEnd.id, endDate);
      toast.success('Vacance terminée avec succès');
      setEndDialogOpen(false);
      setVacancyToEnd(null);
      setEndDate('');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} jour(s)`;
    } else {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      return `${months} mois ${days > 0 ? `et ${days} j` : ''}`;
    }
  };

  // Properties not in active vacancy
  const vacantPropertyIds = vacancies.filter(v => v.is_active).map(v => v.property_id);
  const availableProperties = properties.filter(p => !p.is_occupied && !vacantPropertyIds.includes(p.id));

  const filteredVacancies = vacancies.filter(v => 
    v.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.property?.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="vacancies-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Vacances locatives
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez les périodes sans locataire
          </p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)} 
          className="btn-hover"
          disabled={availableProperties.length === 0}
          data-testid="add-vacancy-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          Déclarer une vacance
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vacances actives</p>
                <p className="text-3xl font-bold mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {vacancies.filter(v => v.is_active).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vacances terminées</p>
                <p className="text-3xl font-bold mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {vacancies.filter(v => !v.is_active).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total enregistrées</p>
                <p className="text-3xl font-bold mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {vacancies.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="search-vacancies"
        />
      </div>

      {/* Vacancies Table */}
      {filteredVacancies.length > 0 ? (
        <Card className="border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase text-xs tracking-wider">Bien</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Début</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Fin</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Durée</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Raison</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Statut</TableHead>
                <TableHead className="text-right uppercase text-xs tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVacancies.map((vacancy) => (
                <TableRow key={vacancy.id} className="table-row-hover" data-testid={`vacancy-row-${vacancy.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{vacancy.property?.name}</p>
                        <p className="text-xs text-muted-foreground">{vacancy.property?.address}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(vacancy.start_date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {vacancy.end_date ? formatDate(vacancy.end_date) : '-'}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {calculateDuration(vacancy.start_date, vacancy.end_date)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {vacancy.reason || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={vacancy.is_active ? "destructive" : "secondary"}>
                      {vacancy.is_active ? 'En cours' : 'Terminée'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {vacancy.is_active && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setVacancyToEnd(vacancy);
                          setEndDialogOpen(true);
                        }}
                        data-testid={`end-vacancy-${vacancy.id}`}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Terminer
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-primary/10 mb-6">
              <Calendar className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Aucune vacance enregistrée
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Les vacances locatives sont automatiquement créées lors de la résiliation d'un bail, ou vous pouvez les déclarer manuellement.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Vacancy Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>
              Déclarer une vacance
            </DialogTitle>
            <DialogDescription>
              Enregistrez une période sans locataire pour un bien
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="property_id">Bien *</Label>
                <Select 
                  value={formData.property_id} 
                  onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                >
                  <SelectTrigger data-testid="vacancy-property-select">
                    <SelectValue placeholder="Sélectionner un bien" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProperties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name} - {property.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Date de début *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  data-testid="vacancy-start-date-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Raison</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Travaux, recherche de locataire..."
                  rows={2}
                  data-testid="vacancy-reason-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" data-testid="save-vacancy-btn">
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* End Vacancy Dialog */}
      <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminer cette vacance ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Indiquez la date de fin de vacance pour le bien "{vacancyToEnd?.property?.name}".
              </p>
              <div className="space-y-2">
                <Label htmlFor="end_date">Date de fin *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  data-testid="vacancy-end-date-input"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEndDate('')}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEndVacancy}
              disabled={!endDate}
              data-testid="confirm-end-vacancy"
            >
              Terminer la vacance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vacancies;
