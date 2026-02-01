import React, { useState, useEffect } from 'react';
import { documentsAPI, propertiesAPI, tenantsAPI, leasesAPI } from '../lib/api';
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
  FileText,
  Download,
  Trash2,
  Search,
  Upload,
  File,
  FileImage,
  Building2,
  User,
  FileSignature,
  Loader2
} from 'lucide-react';

const DOCUMENT_TYPES = [
  { value: 'bail', label: 'Contrat de bail' },
  { value: 'etat_lieux_entree', label: 'État des lieux entrée' },
  { value: 'etat_lieux_sortie', label: 'État des lieux sortie' },
  { value: 'attestation', label: 'Attestation d\'assurance' },
  { value: 'identite', label: 'Pièce d\'identité' },
  { value: 'revenus', label: 'Justificatif de revenus' },
  { value: 'quittance', label: 'Quittance de loyer' },
  { value: 'autre', label: 'Autre document' }
];

const RELATED_TYPES = [
  { value: 'property', label: 'Bien', icon: Building2 },
  { value: 'tenant', label: 'Locataire', icon: User },
  { value: 'lease', label: 'Bail', icon: FileSignature }
];

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    document_type: '',
    related_type: '',
    related_id: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docsRes, propsRes, tenantsRes, leasesRes] = await Promise.all([
        documentsAPI.getAll(),
        propertiesAPI.getAll(),
        tenantsAPI.getAll(),
        leasesAPI.getAll()
      ]);
      setDocuments(docsRes.data);
      setProperties(propsRes.data);
      setTenants(tenantsRes.data);
      setLeases(leasesRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      document_type: '',
      related_type: '',
      related_id: '',
      notes: ''
    });
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Fichier trop volumineux (max 10MB)');
        return;
      }
      setSelectedFile(file);
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: file.name.split('.')[0] }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    
    const data = new FormData();
    data.append('file', selectedFile);
    data.append('name', formData.name);
    data.append('document_type', formData.document_type);
    data.append('related_type', formData.related_type);
    data.append('related_id', formData.related_id);
    if (formData.notes) data.append('notes', formData.notes);

    try {
      await documentsAPI.upload(data);
      toast.success('Document uploadé avec succès');
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await documentsAPI.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${doc.name}${doc.filename.substring(doc.filename.lastIndexOf('.'))}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      await documentsAPI.delete(documentToDelete.id);
      toast.success('Document supprimé');
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getRelatedOptions = () => {
    switch (formData.related_type) {
      case 'property':
        return properties.map(p => ({ value: p.id, label: p.name }));
      case 'tenant':
        return tenants.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }));
      case 'lease':
        return leases.map(l => ({ 
          value: l.id, 
          label: `${l.property?.name} - ${l.tenant?.first_name} ${l.tenant?.last_name}` 
        }));
      default:
        return [];
    }
  };

  const getRelatedName = (doc) => {
    switch (doc.related_type) {
      case 'property':
        return properties.find(p => p.id === doc.related_id)?.name;
      case 'tenant':
        const tenant = tenants.find(t => t.id === doc.related_id);
        return tenant ? `${tenant.first_name} ${tenant.last_name}` : null;
      case 'lease':
        const lease = leases.find(l => l.id === doc.related_id);
        return lease ? `${lease.property?.name} - ${lease.tenant?.first_name}` : null;
      default:
        return null;
    }
  };

  const getDocumentTypeLabel = (type) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getRelatedTypeLabel = (type) => {
    return RELATED_TYPES.find(t => t.value === type)?.label || type;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return FileImage;
    return File;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="documents-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Documents
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos documents (baux, états des lieux, attestations...)
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="btn-hover" data-testid="add-document-btn">
          <Upload className="mr-2 h-4 w-4" />
          Ajouter un document
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-documents"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48" data-testid="filter-type-select">
            <SelectValue placeholder="Type de document" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {DOCUMENT_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents Table */}
      {filteredDocuments.length > 0 ? (
        <Card className="border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase text-xs tracking-wider">Document</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Type</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Associé à</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Taille</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Date</TableHead>
                <TableHead className="text-right uppercase text-xs tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => {
                const FileIcon = getFileIcon(doc.mime_type);
                return (
                  <TableRow key={doc.id} className="table-row-hover" data-testid={`document-row-${doc.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          {doc.notes && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{doc.notes}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getDocumentTypeLabel(doc.document_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {getRelatedTypeLabel(doc.related_type)}
                        </Badge>
                        <span className="text-sm">{getRelatedName(doc)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground font-mono">
                        {formatFileSize(doc.file_size)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(doc.created_at)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownload(doc)}
                          title="Télécharger"
                          data-testid={`download-document-${doc.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setDocumentToDelete(doc);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive hover:text-destructive"
                          data-testid={`delete-document-${doc.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
              Aucun document
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Uploadez vos documents importants : baux, états des lieux, attestations d'assurance...
            </p>
            <Button onClick={() => setDialogOpen(true)} data-testid="empty-add-document-btn">
              <Upload className="mr-2 h-4 w-4" />
              Ajouter mon premier document
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>
              Ajouter un document
            </DialogTitle>
            <DialogDescription>
              Uploadez un document et associez-le à un bien, locataire ou bail
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label>Fichier *</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    data-testid="file-upload-input"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <File className="h-8 w-8 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Cliquez ou glissez un fichier ici
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, DOCX, JPG, PNG (max 10MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nom du document *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Bail appartement Paris"
                  required
                  data-testid="document-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Type de document *</Label>
                <Select 
                  value={formData.document_type} 
                  onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                >
                  <SelectTrigger data-testid="document-type-select">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Associer à *</Label>
                  <Select 
                    value={formData.related_type} 
                    onValueChange={(value) => setFormData({ ...formData, related_type: value, related_id: '' })}
                  >
                    <SelectTrigger data-testid="related-type-select">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATED_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Élément *</Label>
                  <Select 
                    value={formData.related_id} 
                    onValueChange={(value) => setFormData({ ...formData, related_id: value })}
                    disabled={!formData.related_type}
                  >
                    <SelectTrigger data-testid="related-id-select">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {getRelatedOptions().map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes supplémentaires..."
                  rows={2}
                  data-testid="document-notes-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Annuler
              </Button>
              <Button type="submit" disabled={uploading} data-testid="save-document-btn">
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Uploader
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le document "{documentToDelete?.name}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-document"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Documents;
