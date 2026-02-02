import React, { useState, useEffect } from 'react';
import { teamsAPI } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
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
  Users,
  UserPlus,
  Crown,
  Shield,
  User,
  Eye,
  Mail,
  Trash2,
  Settings,
  Loader2,
  Copy
} from 'lucide-react';

const ROLES = [
  { value: 'owner', label: 'Propriétaire', icon: Crown, color: 'text-amber-500' },
  { value: 'admin', label: 'Administrateur', icon: Shield, color: 'text-blue-500' },
  { value: 'member', label: 'Membre', icon: User, color: 'text-emerald-500' },
  { value: 'viewer', label: 'Lecteur', icon: Eye, color: 'text-slate-500' }
];

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [inviteData, setInviteData] = useState({ email: '', role: 'member' });

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const response = await teamsAPI.getAll();
      setTeams(response.data);
      if (response.data.length > 0 && !selectedTeam) {
        loadTeamDetails(response.data[0].id);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des équipes');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamDetails = async (teamId) => {
    try {
      const response = await teamsAPI.getOne(teamId);
      setSelectedTeam(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'équipe');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const response = await teamsAPI.create(formData);
      toast.success('Équipe créée avec succès');
      setCreateDialogOpen(false);
      setFormData({ name: '', description: '' });
      loadTeams();
      loadTeamDetails(response.data.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;
    
    setInviting(true);
    try {
      await teamsAPI.invite(selectedTeam.id, inviteData);
      toast.success('Invitation envoyée avec succès');
      setInviteDialogOpen(false);
      setInviteData({ email: '', role: 'member' });
      loadTeamDetails(selectedTeam.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'envoi');
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      await teamsAPI.delete(teamToDelete.id);
      toast.success('Équipe supprimée');
      setDeleteDialogOpen(false);
      setTeamToDelete(null);
      setSelectedTeam(null);
      loadTeams();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!selectedTeam) return;
    try {
      await teamsAPI.removeMember(selectedTeam.id, userId);
      toast.success('Membre retiré');
      loadTeamDetails(selectedTeam.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!selectedTeam) return;
    try {
      await teamsAPI.updateRole(selectedTeam.id, userId, newRole);
      toast.success('Rôle mis à jour');
      loadTeamDetails(selectedTeam.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  const getRoleInfo = (role) => ROLES.find(r => r.value === role) || ROLES[2];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8" data-testid="teams-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Équipes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Collaborez avec d'autres utilisateurs
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="btn-hover w-full sm:w-auto" data-testid="create-team-btn">
          <Plus className="mr-2 h-4 w-4" />
          Créer une équipe
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Teams List */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Mes équipes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {teams.length > 0 ? (
              teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => loadTeamDetails(team.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedTeam?.id === team.id ? 'bg-primary/10 border border-primary' : 'hover:bg-muted border border-transparent'
                  }`}
                  data-testid={`team-${team.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.member_count} membre(s)
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getRoleInfo(team.my_role).label}
                    </Badge>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">Aucune équipe</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Details */}
        <Card className="border lg:col-span-2">
          {selectedTeam ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {selectedTeam.name}
                    </CardTitle>
                    {selectedTeam.description && (
                      <CardDescription className="mt-1">{selectedTeam.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {['owner', 'admin'].includes(selectedTeam.my_role) && (
                      <Button variant="outline" size="sm" onClick={() => setInviteDialogOpen(true)} data-testid="invite-btn">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Inviter
                      </Button>
                    )}
                    {selectedTeam.my_role === 'owner' && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setTeamToDelete(selectedTeam);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive hover:text-destructive"
                        data-testid="delete-team-btn"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium mb-4">Membres ({selectedTeam.members?.length || 0})</h4>
                <div className="space-y-3">
                  {selectedTeam.members?.map(member => {
                    const roleInfo = getRoleInfo(member.role);
                    const RoleIcon = roleInfo.icon;
                    return (
                      <div 
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <span className="text-sm font-semibold">
                              {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.user?.name}</p>
                            <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedTeam.my_role === 'owner' && member.role !== 'owner' ? (
                            <Select
                              value={member.role}
                              onValueChange={(value) => handleRoleChange(member.user_id, value)}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrateur</SelectItem>
                                <SelectItem value="member">Membre</SelectItem>
                                <SelectItem value="viewer">Lecteur</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <RoleIcon className={`h-3 w-3 ${roleInfo.color}`} />
                              {roleInfo.label}
                            </Badge>
                          )}
                          {['owner', 'admin'].includes(selectedTeam.my_role) && member.role !== 'owner' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(member.user_id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Sélectionnez une équipe ou créez-en une nouvelle</p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>Créer une équipe</DialogTitle>
            <DialogDescription>
              Créez une équipe pour collaborer avec d'autres utilisateurs
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTeam}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'équipe *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Gestion Paris"
                  required
                  data-testid="team-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de l'équipe..."
                  rows={3}
                  data-testid="team-description-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" data-testid="save-team-btn">Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Manrope, sans-serif' }}>Inviter un membre</DialogTitle>
            <DialogDescription>
              Envoyez une invitation par email à un nouveau membre
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="collegue@email.com"
                  required
                  data-testid="invite-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={(value) => setInviteData({ ...inviteData, role: value })}
                >
                  <SelectTrigger data-testid="invite-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur - Peut gérer l'équipe</SelectItem>
                    <SelectItem value="member">Membre - Peut modifier les données</SelectItem>
                    <SelectItem value="viewer">Lecteur - Lecture seule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={inviting} data-testid="send-invite-btn">
                {inviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Envoyer
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Team Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette équipe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'équipe "{teamToDelete?.name}" et toutes ses données seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="confirm-delete-team"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Teams;
