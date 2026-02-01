import React, { useState, useEffect } from 'react';
import { paymentsAPI, leasesAPI, receiptsAPI, exportAPI, remindersAPI } from '../lib/api';
import { formatCurrency, formatDate, PAYMENT_METHODS, MONTHS_FR } from '../lib/utils';
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
  CreditCard,
  Building2,
  User,
  Calendar,
  Euro,
  FileText,
  Trash2,
  Search,
  Download,
  FileSpreadsheet,
  Send,
  Loader2,
  AlertTriangle
} from 'lucide-react';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportYear, setExportYear] = useState(new Date().getFullYear().toString());
  const [exporting, setExporting] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [formData, setFormData] = useState({
    lease_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    period_month: (new Date().getMonth() + 1).toString(),
    period_year: new Date().getFullYear().toString(),
    payment_method: 'virement',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsRes, leasesRes] = await Promise.all([
        paymentsAPI.getAll(),
        leasesAPI.getAll()
      ]);
      setPayments(paymentsRes.data);
      setLeases(leasesRes.data.filter(l => l.is_active));
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      lease_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      period_month: (new Date().getMonth() + 1).toString(),
      period_year: new Date().getFullYear().toString(),
      payment_method: 'virement',
      notes: ''
    });
  };

  const handleLeaseChange = (leaseId) => {
    const lease = leases.find(l => l.id === leaseId);
    if (lease) {
      setFormData(prev => ({
        ...prev,
        lease_id: leaseId,
        amount: (lease.rent_amount + lease.charges).toString()
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
      period_month: parseInt(formData.period_month),
      period_year: parseInt(formData.period_year)
    };

    try {
      await paymentsAPI.create(data);
      toast.success('Paiement enregistré avec succès');
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async () => {
    if (!paymentToDelete) return;
    
    try {
      await paymentsAPI.delete(paymentToDelete.id);
      toast.success('Paiement supprimé avec succès');
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const handleGenerateReceipt = async (paymentId) => {
    try {
      const response = await receiptsAPI.generate(paymentId);
      setReceiptData(response.data.receipt);
      setReceiptDialogOpen(true);
    } catch (error) {
      toast.error('Erreur lors de la génération de la quittance');
    }
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quittance de loyer - ${receiptData.period}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { text-align: center; color: #064E3B; margin-bottom: 40px; }
          .header { margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .section h3 { color: #064E3B; border-bottom: 1px solid #E7E5E4; padding-bottom: 5px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #064E3B; text-align: center; padding: 20px; background: #F5F5F4; border-radius: 8px; margin: 20px 0; }
          .footer { margin-top: 50px; text-align: center; color: #78716C; font-size: 12px; }
          .signature { margin-top: 60px; }
          .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 50px; }
        </style>
      </head>
      <body>
        <h1>QUITTANCE DE LOYER</h1>
        <div class="header">
          <p><strong>Période :</strong> ${receiptData.period}</p>
        </div>
        
        <div class="section">
          <h3>Bailleur</h3>
          <p>${receiptData.landlord_name}</p>
        </div>
        
        <div class="section">
          <h3>Locataire</h3>
          <p>${receiptData.tenant_name}</p>
        </div>
        
        <div class="section">
          <h3>Bien loué</h3>
          <p>${receiptData.property_name}</p>
          <p>${receiptData.property_address}</p>
        </div>
        
        <div class="section">
          <h3>Détail du paiement</h3>
          <div class="info-row"><span>Loyer :</span><span>${receiptData.rent_amount.toFixed(2)} €</span></div>
          <div class="info-row"><span>Charges :</span><span>${receiptData.charges.toFixed(2)} €</span></div>
        </div>
        
        <div class="amount">
          Total reçu : ${receiptData.total_amount.toFixed(2)} €
        </div>
        
        <div class="section">
          <div class="info-row"><span>Date de paiement :</span><span>${new Date(receiptData.payment_date).toLocaleDateString('fr-FR')}</span></div>
          <div class="info-row"><span>Mode de paiement :</span><span>${receiptData.payment_method}</span></div>
        </div>
        
        <div class="signature">
          <p>Fait à ________________, le ${new Date().toLocaleDateString('fr-FR')}</p>
          <p>Signature du bailleur :</p>
          <div class="signature-line"></div>
        </div>
        
        <div class="footer">
          <p>Cette quittance annule tous les reçus qui auraient pu être établis précédemment en cas de paiement partiel du montant ci-dessus.</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getPaymentMethodLabel = (method) => {
    return PAYMENT_METHODS.find(m => m.value === method)?.label || method;
  };

  const filteredPayments = payments.filter(p => 
    p.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="payments-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Paiements
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez les loyers perçus
          </p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)} 
          className="btn-hover"
          disabled={leases.length === 0}
          data-testid="add-payment-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          Enregistrer un paiement
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un paiement..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="search-payments"
        />
      </div>

      {/* Payments Table */}
      {filteredPayments.length > 0 ? (
        <Card className="border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase text-xs tracking-wider">Bien</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Locataire</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Période</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Date</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Montant</TableHead>
                <TableHead className="uppercase text-xs tracking-wider">Méthode</TableHead>
                <TableHead className="text-right uppercase text-xs tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id} className="table-row-hover" data-testid={`payment-row-${payment.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{payment.property?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{payment.tenant?.first_name} {payment.tenant?.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {MONTHS_FR[payment.period_month]} {payment.period_year}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(payment.payment_date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-primary">{formatCurrency(payment.amount)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getPaymentMethodLabel(payment.payment_method)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleGenerateReceipt(payment.id)}
                        title="Générer quittance"
                        data-testid={`receipt-payment-${payment.id}`}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setPaymentToDelete(payment);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive hover:text-destructive"
                        data-testid={`delete-payment-${payment.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
              <CreditCard className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Aucun paiement enregistré
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              {leases.length === 0 
                ? 'Créez d\'abord un bail pour pouvoir enregistrer des paiements.'
                : 'Enregistrez les loyers perçus pour générer des quittances.'}
            </p>
            {leases.length > 0 && (
              <Button onClick={() => setDialogOpen(true)} data-testid="empty-add-payment-btn">
                <Plus className="mr-2 h-4 w-4" />
                Enregistrer un paiement
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>
              Enregistrer un paiement
            </DialogTitle>
            <DialogDescription>
              Enregistrez un loyer perçu pour un bail actif
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="lease_id">Bail *</Label>
                <Select 
                  value={formData.lease_id} 
                  onValueChange={handleLeaseChange}
                >
                  <SelectTrigger data-testid="payment-lease-select">
                    <SelectValue placeholder="Sélectionner un bail" />
                  </SelectTrigger>
                  <SelectContent>
                    {leases.map((lease) => (
                      <SelectItem key={lease.id} value={lease.id}>
                        {lease.property?.name} - {lease.tenant?.first_name} {lease.tenant?.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period_month">Mois *</Label>
                  <Select 
                    value={formData.period_month} 
                    onValueChange={(value) => setFormData({ ...formData, period_month: value })}
                  >
                    <SelectTrigger data-testid="payment-month-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS_FR.slice(1).map((month, index) => (
                        <SelectItem key={index + 1} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period_year">Année *</Label>
                  <Select 
                    value={formData.period_year} 
                    onValueChange={(value) => setFormData({ ...formData, period_year: value })}
                  >
                    <SelectTrigger data-testid="payment-year-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    data-testid="payment-amount-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_date">Date de paiement *</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    required
                    data-testid="payment-date-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Mode de paiement</Label>
                <Select 
                  value={formData.payment_method} 
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger data-testid="payment-method-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
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
                  rows={2}
                  data-testid="payment-notes-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" data-testid="save-payment-btn">
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>
              Quittance de loyer
            </DialogTitle>
            <DialogDescription>
              {receiptData?.period}
            </DialogDescription>
          </DialogHeader>
          {receiptData && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Bailleur</h4>
                  <p className="font-medium">{receiptData.landlord_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Locataire</h4>
                  <p className="font-medium">{receiptData.tenant_name}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Bien loué</h4>
                <p className="font-medium">{receiptData.property_name}</p>
                <p className="text-sm text-muted-foreground">{receiptData.property_address}</p>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex justify-between mb-2">
                  <span>Loyer</span>
                  <span>{formatCurrency(receiptData.rent_amount)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Charges</span>
                  <span>{formatCurrency(receiptData.charges)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(receiptData.total_amount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Date de paiement :</span>
                  <span className="ml-2">{formatDate(receiptData.payment_date)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mode de paiement :</span>
                  <span className="ml-2">{getPaymentMethodLabel(receiptData.payment_method)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>
              Fermer
            </Button>
            <Button onClick={handlePrintReceipt} data-testid="print-receipt-btn">
              <Download className="mr-2 h-4 w-4" />
              Imprimer / PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce paiement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le paiement de {formatCurrency(paymentToDelete?.amount || 0)} sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-payment"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Payments;
