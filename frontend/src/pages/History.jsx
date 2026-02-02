import React, { useState, useEffect } from 'react';
import { auditAPI } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  History,
  Search,
  Plus,
  Pencil,
  Trash2,
  Building2,
  User,
  FileText,
  CreditCard,
  FolderOpen,
  Calendar,
  Users,
  ArrowRight
} from 'lucide-react';

const ENTITY_TYPES = [
  { value: 'all', label: 'Tous les types', icon: History },
  { value: 'property', label: 'Biens', icon: Building2 },
  { value: 'tenant', label: 'Locataires', icon: User },
  { value: 'lease', label: 'Baux', icon: FileText },
  { value: 'payment', label: 'Paiements', icon: CreditCard },
  { value: 'document', label: 'Documents', icon: FolderOpen },
  { value: 'vacancy', label: 'Vacances', icon: Calendar },
  { value: 'team', label: 'Équipes', icon: Users }
];

const ACTION_LABELS = {
  create: { label: 'Création', color: 'bg-emerald-500', icon: Plus },
  update: { label: 'Modification', color: 'bg-blue-500', icon: Pencil },
  delete: { label: 'Suppression', color: 'bg-red-500', icon: Trash2 }
};

const HistoryPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, [filterType]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const entityType = filterType === 'all' ? null : filterType;
      const response = await auditAPI.getAll(entityType, null, 100);
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEntityIcon = (type) => {
    const entityType = ENTITY_TYPES.find(e => e.value === type);
    return entityType?.icon || History;
  };

  const getEntityLabel = (type) => {
    const entityType = ENTITY_TYPES.find(e => e.value === type);
    return entityType?.label || type;
  };

  const formatChanges = (changes) => {
    if (!changes) return null;
    
    const fieldLabels = {
      name: 'Nom',
      address: 'Adresse',
      city: 'Ville',
      postal_code: 'Code postal',
      property_type: 'Type',
      surface: 'Surface',
      rooms: 'Pièces',
      rent_amount: 'Loyer',
      charges: 'Charges',
      first_name: 'Prénom',
      last_name: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      profession: 'Profession',
      description: 'Description'
    };

    return Object.entries(changes).map(([field, { old: oldVal, new: newVal }]) => ({
      field: fieldLabels[field] || field,
      old: oldVal,
      new: newVal
    }));
  };

  const filteredLogs = logs.filter(log => 
    log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="history-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Historique
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez toutes les modifications de vos données
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-history"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48" data-testid="filter-entity-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {filteredLogs.length > 0 ? (
        <div className="space-y-4">
          {filteredLogs.map((log, index) => {
            const EntityIcon = getEntityIcon(log.entity_type);
            const actionInfo = ACTION_LABELS[log.action] || ACTION_LABELS.update;
            const ActionIcon = actionInfo.icon;
            const changes = formatChanges(log.changes);

            return (
              <Card key={log.id} className="border" data-testid={`log-${log.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Action Icon */}
                    <div className={`p-2 rounded-lg ${actionInfo.color} text-white shrink-0`}>
                      <ActionIcon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="font-medium">{log.user_name}</span>
                        <span className="text-muted-foreground">a</span>
                        <Badge variant="outline" className="text-xs">
                          {actionInfo.label.toLowerCase()}
                        </Badge>
                        <span className="text-muted-foreground">un</span>
                        <Badge variant="secondary" className="gap-1">
                          <EntityIcon className="h-3 w-3" />
                          {getEntityLabel(log.entity_type).toLowerCase()}
                        </Badge>
                      </div>
                      
                      <p className="text-lg font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {log.entity_name}
                      </p>

                      {/* Changes */}
                      {changes && changes.length > 0 && (
                        <div className="mt-3 space-y-1 bg-muted/50 p-3 rounded-lg">
                          {changes.map((change, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">{change.field}:</span>
                              <span className="line-through text-red-500/70">{change.old || '(vide)'}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-emerald-600">{change.new || '(vide)'}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(log.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-6">
              <History className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Aucun historique
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Les modifications de vos données (biens, locataires, baux, etc.) apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HistoryPage;
