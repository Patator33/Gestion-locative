import React, { useState, useEffect } from 'react';
import { propertiesAPI } from '../lib/api';
import { formatCurrency, PROPERTY_TYPES } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Building2, 
  MapPin, 
  Ruler, 
  DoorOpen,
  Euro,
  Pencil,
  Trash2,
  Search,
  Home
} from 'lucide-react';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    property_type: 'apartment',
    surface: '',
    rooms: '',
    rent_amount: '',
    charges: '0',
    description: '',
    image_url: ''
  });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const response = await propertiesAPI.getAll();
      setProperties(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des biens');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      postal_code: '',
      property_type: 'apartment',
      surface: '',
      rooms: '',
      rent_amount: '',
      charges: '0',
      description: '',
      image_url: ''
    });
    setEditingProperty(null);
  };

  const handleOpenDialog = (property = null) => {
    if (property) {
      setEditingProperty(property);
      setFormData({
        name: property.name,
        address: property.address,
        city: property.city,
        postal_code: property.postal_code,
        property_type: property.property_type,
        surface: property.surface.toString(),
        rooms: property.rooms.toString(),
        rent_amount: property.rent_amount.toString(),
        charges: property.charges.toString(),
        description: property.description || '',
        image_url: property.image_url || ''
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      surface: parseFloat(formData.surface),
      rooms: parseInt(formData.rooms),
      rent_amount: parseFloat(formData.rent_amount),
      charges: parseFloat(formData.charges || 0)
    };

    try {
      if (editingProperty) {
        await propertiesAPI.update(editingProperty.id, data);
        toast.success('Bien mis à jour avec succès');
      } else {
        await propertiesAPI.create(data);
        toast.success('Bien créé avec succès');
      }
      setDialogOpen(false);
      resetForm();
      loadProperties();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async () => {
    if (!propertyToDelete) return;
    
    try {
      await propertiesAPI.delete(propertyToDelete.id);
      toast.success('Bien supprimé avec succès');
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
      loadProperties();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const filteredProperties = properties.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPropertyTypeLabel = (type) => {
    return PROPERTY_TYPES.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8" data-testid="properties-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Biens immobiliers
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gérez votre parc locatif
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="btn-hover w-full sm:w-auto" data-testid="add-property-btn">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un bien
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un bien..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="search-properties"
        />
      </div>

      {/* Properties Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property, index) => (
            <Card 
              key={property.id} 
              className="border hover:shadow-lg transition-all duration-300 overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              data-testid={`property-card-${property.id}`}
            >
              {/* Property Image */}
              <div className="h-40 bg-muted relative overflow-hidden">
                {property.image_url ? (
                  <img 
                    src={property.image_url} 
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                <Badge 
                  variant={property.is_occupied ? "default" : "secondary"}
                  className="absolute top-3 right-3"
                >
                  {property.is_occupied ? 'Occupé' : 'Vacant'}
                </Badge>
              </div>
              
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {property.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {property.address}, {property.postal_code} {property.city}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span>{getPropertyTypeLabel(property.property_type)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>{property.surface} m²</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DoorOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{property.rooms} pièce(s)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4 text-primary" />
                      <span className="text-xl font-bold text-primary" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {formatCurrency(property.rent_amount)}
                      </span>
                      <span className="text-sm text-muted-foreground">/mois</span>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenDialog(property)}
                        data-testid={`edit-property-${property.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setPropertyToDelete(property);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive hover:text-destructive"
                        data-testid={`delete-property-${property.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div 
              className="w-32 h-32 rounded-full bg-cover bg-center mb-6"
              style={{ 
                backgroundImage: `url('https://images.unsplash.com/photo-1533696848654-6bdf438edea4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMGtleXMlMjBoYW5kJTIwY2xvc2UlMjB1cHxlbnwwfHx8fDE3Njk5ODY5NDR8MA&ixlib=rb-4.1.0&q=85')` 
              }}
            />
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Aucun bien enregistré
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Commencez par ajouter votre premier bien immobilier pour gérer vos locations.
            </p>
            <Button onClick={() => handleOpenDialog()} data-testid="empty-add-property-btn">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter mon premier bien
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>
              {editingProperty ? 'Modifier le bien' : 'Ajouter un bien'}
            </DialogTitle>
            <DialogDescription>
              {editingProperty ? 'Modifiez les informations du bien' : 'Remplissez les informations du nouveau bien'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du bien *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: Appartement Paris 15"
                    required
                    data-testid="property-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_type">Type de bien *</Label>
                  <Select 
                    value={formData.property_type} 
                    onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                  >
                    <SelectTrigger data-testid="property-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="ex: 15 rue de la Paix"
                  required
                  data-testid="property-address-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal *</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="75015"
                    required
                    data-testid="property-postal-code-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Paris"
                    required
                    data-testid="property-city-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surface">Surface (m²) *</Label>
                  <Input
                    id="surface"
                    type="number"
                    step="0.1"
                    value={formData.surface}
                    onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                    placeholder="45"
                    required
                    data-testid="property-surface-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rooms">Nombre de pièces *</Label>
                  <Input
                    id="rooms"
                    type="number"
                    value={formData.rooms}
                    onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                    placeholder="2"
                    required
                    data-testid="property-rooms-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rent_amount">Loyer mensuel (€) *</Label>
                  <Input
                    id="rent_amount"
                    type="number"
                    step="0.01"
                    value={formData.rent_amount}
                    onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                    placeholder="850"
                    required
                    data-testid="property-rent-input"
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
                    placeholder="50"
                    data-testid="property-charges-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL de l'image</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  data-testid="property-image-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du bien..."
                  rows={3}
                  data-testid="property-description-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" data-testid="save-property-btn">
                {editingProperty ? 'Mettre à jour' : 'Créer le bien'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce bien ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le bien "{propertyToDelete?.name}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-property"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Properties;
