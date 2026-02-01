import React, { useState, useEffect } from 'react';
import { leasesAPI, propertiesAPI, tenantsAPI } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
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
  FileText,
  Building2,
  User,
  Calendar,
  Euro,
  XCircle,
  Search
} from 'lucide-react';

const Leases = () => {
  const [leases, setLeases] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [leaseToTerminate, setLeaseToTerminate] = useState(null);
  const [terminateDate, setTerminateDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    property_id: '',
    tenant_id: '',
    start_date: '',
    end_date: '',
    rent_amount: '',
    charges: '0',
    deposit: '',
    payment_day: '1',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [leasesRes, propertiesRes, tenantsRes] = await Promise.all([
        leasesAPI.getAll(),
        propertiesAPI.getAll(),
        tenantsAPI.getAll()
      ]);
      setLeases(leasesRes.data);
      setProperties(propertiesRes.data);
      setTenants(tenantsRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      property_id: '',
      tenant_id: '',
      start_date: '',
      end_date: '',
      rent_amount: '',
      charges: '0',
      deposit: '',
      payment_day: '1',
      notes: ''
    });
  };

  const handlePropertyChange = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setFormData(prev => ({
        ...prev,
        property_id: propertyId,
        rent_amount: property.rent_amount.toString(),
        charges: property.charges.toString()
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      ...formData,
      rent_amount: parseFloat(formData.rent_amount),
      charges: parseFloat(formData.charges || 0),
      deposit: parseFloat(formData.deposit),
      payment_day: parseInt(formData.payment_day),
      end_date: formData.end_date || null
    };

    try {
      await leasesAPI.create(data);
      toast.success('Bail créé avec succès');
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création du bail');
    }
  };

  const handleTerminate = async () => {
    if (!leaseToTerminate || !terminateDate) return;
    
    try {
      await leasesAPI.terminate(leaseToTerminate.id, terminateDate);
      toast.success('Bail résilié avec succès');
      setTerminateDialogOpen(false);
      setLeaseToTerminate(null);
      setTerminateDate('');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la résiliation');
    }
  };

  const availableProperties = properties.filter(p => !p.is_occupied);
  const availableTenants = tenants.filter(t => !t.current_property_id);

  const filteredLeases = leases.filter(l => 
    l.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="leases-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Baux
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les contrats de location
          </p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)} 
          className="btn-hover"
          disabled={availableProperties.length === 0 || availableTenants.length === 0}
          data-testid="add-lease-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          Créer un bail
        </Button>
      </div>

      {/* Info if no available properties or tenants */}
      {(availableProperties.length === 0 || availableTenants.length === 0) && (
        <Card className="border border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800">
              {availableProperties.length === 0 && availableTenants.length === 0
                ? 'Vous devez créer un bien vacant et un locataire sans logement pour créer un bail.'
                : availableProperties.length === 0
                ? 'Tous vos biens sont actuellement occupés. Ajoutez un nouveau bien pour créer un bail.'
                : 'Tous vos locataires ont déjà un logement. Ajoutez un nouveau locataire pour créer un bail.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un bail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="search-leases"
        />
      </div>

      {/* Leases Table */}
      {filteredLeases.length > 0 ? (
        <Card className="border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase text-xs tracking-wider">Bien</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Locataire</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Période</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Loyer</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Statut</TableHead>
                <TableHead className="text-right uppercase text-xs tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeases.map((lease) => (
                <TableRow key={lease.id} className="table-row-hover" data-testid={`lease-row-${lease.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{lease.property?.name}</p>
                        <p className="text-xs text-muted-foreground">{lease.property?.address}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{lease.tenant?.first_name} {lease.tenant?.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">{formatDate(lease.start_date)}</p>
                        {lease.end_date && (
                          <p className="text-xs text-muted-foreground">→ {formatDate(lease.end_date)}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatCurrency(lease.rent_amount + lease.charges)}</span>
                      <span className="text-xs text-muted-foreground">/mois</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={lease.is_active ? "default" : "secondary"}>
                      {lease.is_active ? 'Actif' : 'Terminé'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {lease.is_active && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setLeaseToTerminate(lease);
                          setTerminateDialogOpen(true);
                        }}
                        className="text-destructive hover:text-destructive"
                        data-testid={`terminate-lease-${lease.id}`}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Résilier
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
              <FileText className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Aucun bail enregistré
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Créez un bail pour lier un locataire à un bien et commencer à suivre les loyers.
            </p>
            {availableProperties.length > 0 && availableTenants.length > 0 && (
              <Button onClick={() => setDialogOpen(true)} data-testid="empty-add-lease-btn">
                <Plus className="mr-2 h-4 w-4" />
                Créer mon premier bail
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>
              Créer un bail
            </DialogTitle>
            <DialogDescription>
              Liez un locataire à un bien avec les conditions du bail
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="property_id">Bien *</Label>
                  <Select 
                    value={formData.property_id} 
                    onValueChange={handlePropertyChange}
                  >
                    <SelectTrigger data-testid="lease-property-select">
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
                  <Label htmlFor="tenant_id">Locataire *</Label>
                  <Select 
                    value={formData.tenant_id} 
                    onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                  >
                    <SelectTrigger data-testid="lease-tenant-select">
                      <SelectValue placeholder="Sélectionner un locataire" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.first_name} {tenant.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Date de début *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    data-testid="lease-start-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Date de fin (optionnel)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    data-testid="lease-end-date-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rent_amount">Loyer (€) *</Label>
                  <Input
                    id="rent_amount"
                    type="number"
                    step="0.01"
                    value={formData.rent_amount}
                    onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                    required
                    data-testid="lease-rent-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="charges">Charges (€)</Label>
                  <Input
                    id="charges"
                    type="number"
                    step="0.01"
                    value={formData.charges}
                    onChange={(e) => setFormData({ ...formData, charges: e.target.value })}
                    data-testid="lease-charges-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit">Dépôt de garantie (€) *</Label>
                  <Input
                    id="deposit"
                    type="number"
                    step="0.01"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                    required
                    data-testid="lease-deposit-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_day">Jour de paiement du loyer</Label>
                <Select 
                  value={formData.payment_day} 
                  onValueChange={(value) => setFormData({ ...formData, payment_day: value })}
                >
                  <SelectTrigger data-testid="lease-payment-day-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(28)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Le {i + 1} de chaque mois
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes supplémentaires..."
                  rows={3}
                  data-testid="lease-notes-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" data-testid="save-lease-btn">
                Créer le bail
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Terminate Dialog */}
      <AlertDialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Résilier ce bail ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Vous êtes sur le point de résilier le bail de {leaseToTerminate?.tenant?.first_name} {leaseToTerminate?.tenant?.last_name} pour le bien "{leaseToTerminate?.property?.name}".
              </p>
              <div className="space-y-2">
                <Label htmlFor="terminate_date">Date de fin du bail *</Label>
                <Input
                  id="terminate_date"
                  type="date"
                  value={terminateDate}
                  onChange={(e) => setTerminateDate(e.target.value)}
                  required
                  data-testid="terminate-date-input"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTerminateDate('')}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleTerminate}
              disabled={!terminateDate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-terminate-lease"
            >
              Résilier le bail
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Leases;
