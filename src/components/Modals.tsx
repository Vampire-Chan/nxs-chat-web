import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Check, Zap, Hash, Shield, Globe, Settings, UserPlus, Trash2, Camera, Image as ImageIcon, Save, Copy, Link2, Clock3, ShieldAlert, Volume2, Hammer, Ban, ListTodo, Plus, Eye, EyeOff, Radio, ArrowUp, ArrowDown, UserMinus } from 'lucide-react';
import { api, calculateFileHash, calculatePerceptualHash } from '../services/api';
import type { IUser, IRealm, IChannel, IRealmInvite } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { hasRealmPermission } from './ChannelSidebar';
import { NeuralSuggester } from './NeuralSuggester';
import { MarkdownRenderer } from './MarkdownRenderer';


export const RealmSettingsModal = ({ realm, onClose, onUpdate }: { realm: IRealm, onClose: () => void, onUpdate: () => void }) => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const { user } = useAuth();
  
  const userId = user?.id || user?._id;
  const isOwner = realm.owner === userId;

  const canManageRealm = isOwner || hasRealmPermission(realm, userId, 'MANAGE_REALM');
  const canManageRoles = isOwner || hasRealmPermission(realm, userId, 'MANAGE_ROLES');

  const [activeTab, setActiveTab] = useState<
    'overview' | 'vanity' | 'engagement' | 'safety' | 'roles' | 'access' | 'members' | 'invites' | 'audit' | 'bans'
  >('overview');

  const [name, setName] = useState(realm.name);
  const [vanity, setVanity] = useState(realm.vanityHandle || '');
  const [systemChannel, setSystemChannel] = useState(realm.systemChannel || '');
  const [verificationLevel, setVerificationLevel] = useState(realm.verificationLevel || 'none');
  const [defaultNotifications, setDefaultNotifications] = useState(realm.defaultNotifications || 'all');
  const [contentFilter, setContentFilter] = useState(realm.contentFilter || 'none');

  const [iconBlob, setIconBlob] = useState<Blob | null>(null);
  const [bannerBlob, setBannerBlob] = useState<Blob | null>(null);
  const [iconPreview, setIconPreview] = useState(realm.icon || '');
  const [bannerPreview, setBannerPreview] = useState((realm as any).banner || '');

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState('');
  const [editingRoleColor, setEditingRoleColor] = useState('');
  const [editingRolePermissions, setEditingRolePermissions] = useState<string[]>([]);
  const [isSavingRole, setIsSavingRole] = useState(false);

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedOverwriteTargetId, setSelectedOverwriteTargetId] = useState<string | null>(null);
  const [selectedOverwriteTargetType, setSelectedOverwriteTargetType] = useState<'role' | 'member' | null>(null);
  const [newOverwriteType, setNewOverwriteType] = useState<'role' | 'member'>('role');
  const [newOverwriteTargetId, setNewOverwriteTargetId] = useState('');

  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberForRoles, setSelectedMemberForRoles] = useState<IUser | null>(null);
  const [memberRolesDraft, setMemberRolesDraft] = useState<string[]>([]);

  const [invites, setInvites] = useState<IRealmInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteMaxUses, setInviteMaxUses] = useState('0');
  const [inviteExpiresIn, setInviteExpiresIn] = useState('24');
  const [creatingInvite, setCreatingInvite] = useState(false);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [bansList, setBansList] = useState<any[]>([]);
  const [loadingBans, setLoadingBans] = useState(false);

  const iconRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'invites') fetchInvites();
    else if (activeTab === 'audit') fetchAuditLogs();
    else if (activeTab === 'bans') fetchBans();
  }, [activeTab]);

  const fetchInvites = async () => {
    setLoadingInvites(true);
    try {
      const data = await api.listRealmInvites(realm._id);
      setInvites(data);
    } catch (e) {
      addToast('Failed to load active invite records.', 'error');
    } finally {
      setLoadingInvites(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const data = await api.getRealmAuditLogs(realm._id);
      setAuditLogs(data);
    } catch (e) {
      addToast('Failed to retrieve security audit trail.', 'error');
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const fetchBans = async () => {
    setLoadingBans(true);
    try {
      const data = await api.getRealmBans(realm._id);
      setBansList(data);
    } catch (e) {
      addToast('Failed to fetch banned node records.', 'error');
    } finally {
      setLoadingBans(false);
    }
  };

  const handleSaveOverview = async () => {
    const fd = new FormData();
    fd.append('name', name);
    if (iconBlob) fd.append('icon', iconBlob, 'icon.jpg');
    if (bannerBlob) fd.append('banner', bannerBlob, 'banner.jpg');
    fd.append('systemChannel', systemChannel || '');
    fd.append('verificationLevel', verificationLevel);
    fd.append('defaultNotifications', defaultNotifications);
    fd.append('contentFilter', contentFilter);
    try {
      await api.updateRealm(realm._id, fd);
      addToast(t('modals.calib_complete') || 'Sovereignty configurations stored.', 'success');
      onUpdate();
    } catch (e) {
      addToast(t('modals.calib_failed') || 'Sovereign update failed.', 'error');
    }
  };

  const handleSaveVanity = async () => {
    const fd = new FormData();
    fd.append('vanityHandle', vanity);
    try {
      await api.updateRealm(realm._id, fd);
      addToast('Sovereign Tag registered successfully.', 'success');
      onUpdate();
    } catch (e) {
      addToast('Vanity tag handle is invalid or claimed.', 'error');
    }
  };

  const handleSaveEngagement = async () => {
    const fd = new FormData();
    fd.append('systemChannel', systemChannel || '');
    fd.append('defaultNotifications', defaultNotifications);
    try {
      await api.updateRealm(realm._id, fd);
      addToast('Engagement channels updated.', 'success');
      onUpdate();
    } catch (e) {
      addToast('Failed to update ingress options.', 'error');
    }
  };

  const handleSaveSafety = async () => {
    const fd = new FormData();
    fd.append('verificationLevel', verificationLevel);
    fd.append('contentFilter', contentFilter);
    try {
      await api.updateRealm(realm._id, fd);
      addToast('Safety filtration updated.', 'success');
      onUpdate();
    } catch (e) {
      addToast('Failed to lock down safety settings.', 'error');
    }
  };

  const serverPermissions = [
    'ADMINISTRATOR', 'MANAGE_REALM', 'MANAGE_ROLES', 'MANAGE_CATEGORIES', 
    'MANAGE_CHANNELS', 'MANAGE_MESSAGES', 'MANAGE_MEDIA', 'VIEW_CHANNEL', 
    'SEND_MESSAGES', 'CREATE_POSTS', 'CONNECT', 'SPEAK', 'STREAM', 
    'CREATE_INVITE', 'KICK_MEMBERS', 'BAN_MEMBERS'
  ];

  const sortedRoles = [...(realm.roles || [])].sort((a, b) => b.position - a.position);

  const startEditingRole = (role: any) => {
    setSelectedRoleId(role._id);
    setEditingRoleName(role.name);
    setEditingRoleColor(role.color);
    setEditingRolePermissions(role.permissions || []);
  };

  const toggleRolePermission = (perm: string) => {
    setEditingRolePermissions(prev => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return Array.from(next);
    });
  };

  const handleSaveRoleDetails = async () => {
    if (!selectedRoleId) return;
    setIsSavingRole(true);
    try {
      await api.updateRole(realm._id, selectedRoleId, {
        name: editingRoleName,
        color: editingRoleColor,
        permissions: editingRolePermissions
      });
      addToast('Role configurations written to core.', 'success');
      onUpdate();
    } catch (e) {
      addToast('Role validation failure.', 'error');
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleMoveRole = async (role: any, direction: 'up' | 'down') => {
    const index = sortedRoles.findIndex(r => r._id === role._id);
    if (index === -1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sortedRoles.length) return;
    const swapRole = sortedRoles[targetIdx];
    
    try {
      const currentPos = role.position;
      const targetPos = swapRole.position;
      await api.updateRole(realm._id, role._id, { position: targetPos });
      await api.updateRole(realm._id, swapRole._id, { position: currentPos });
      onUpdate();
      addToast('Authority rank hierarchy updated.', 'success');
    } catch (e) {
      addToast('Failed to alter rank hierarchy.', 'error');
    }
  };

  const handleCreateRole = async () => {
    const rName = prompt(t('modals.role_name_prompt') || 'Enter new role name:');
    if (!rName) return;
    try {
      await api.createRole(realm._id, { name: rName.trim(), color: '#00d2ff', permissions: [] });
      onUpdate();
      addToast('Rank role synthesized.', 'success');
    } catch (e) {
      addToast('Synthesization failure.', 'error');
    }
  };

  const handleDeleteRole = async (rId: string) => {
    if (!confirm('Purge this role? All members will lose this assignment.')) return;
    try {
      await api.deleteRole(realm._id, rId);
      if (selectedRoleId === rId) setSelectedRoleId(null);
      onUpdate();
      addToast('Role removed from database.', 'success');
    } catch (e) {
      addToast('Failed to drop role.', 'error');
    }
  };

  const channelPermissions = ['VIEW_CHANNEL', 'SEND_MESSAGES', 'CONNECT', 'SPEAK', 'STREAM'];

  const getPermissionStatus = (perm: string): 'allow' | 'deny' | 'inherit' => {
    if (!selectedChannelId || !selectedOverwriteTargetId) return 'inherit';
    const channel = (realm.channels || []).find(c => c._id === selectedChannelId);
    if (!channel) return 'inherit';
    const ow = channel.permissionOverwrites?.find(o => o.targetId === selectedOverwriteTargetId);
    if (!ow) return 'inherit';
    if (ow.allow?.includes(perm)) return 'allow';
    if (ow.deny?.includes(perm)) return 'deny';
    return 'inherit';
  };

  const handleToggleOverwrite = async (perm: string, status: 'allow' | 'deny' | 'inherit') => {
    if (!selectedChannelId || !selectedOverwriteTargetId || !selectedOverwriteTargetType) return;
    const channel = (realm.channels || []).find(c => c._id === selectedChannelId);
    if (!channel) return;

    let overwrites = [...(channel.permissionOverwrites || [])];
    let idx = overwrites.findIndex(o => o.targetId === selectedOverwriteTargetId);

    if (idx === -1) {
      overwrites.push({
        targetType: selectedOverwriteTargetType,
        targetId: selectedOverwriteTargetId,
        allow: [],
        deny: []
      });
      idx = overwrites.length - 1;
    }

    let allow = new Set(overwrites[idx].allow || []);
    let deny = new Set(overwrites[idx].deny || []);

    if (status === 'allow') {
      allow.add(perm);
      deny.delete(perm);
    } else if (status === 'deny') {
      deny.add(perm);
      allow.delete(perm);
    } else {
      allow.delete(perm);
      deny.delete(perm);
    }

    overwrites[idx].allow = Array.from(allow);
    overwrites[idx].deny = Array.from(deny);

    if (allow.size === 0 && deny.size === 0) {
      overwrites.splice(idx, 1);
      setSelectedOverwriteTargetId(null);
    }

    try {
      await api.updateChannelPermissions(selectedChannelId, overwrites);
      onUpdate();
      addToast('Channel accessibility rule applied.', 'success');
    } catch (e) {
      addToast('Override operation failed.', 'error');
    }
  };

  const handleAddOverwrite = async () => {
    if (!selectedChannelId || !newOverwriteTargetId) return;
    const channel = (realm.channels || []).find(c => c._id === selectedChannelId);
    if (!channel) return;

    let overwrites = [...(channel.permissionOverwrites || [])];
    if (overwrites.some(o => o.targetId === newOverwriteTargetId)) {
      addToast('Target overwrite already configured.', 'error');
      return;
    }

    overwrites.push({
      targetType: newOverwriteType,
      targetId: newOverwriteTargetId,
      allow: [],
      deny: []
    });

    try {
      await api.updateChannelPermissions(selectedChannelId, overwrites);
      setSelectedOverwriteTargetId(newOverwriteTargetId);
      setSelectedOverwriteTargetType(newOverwriteType);
      setNewOverwriteTargetId('');
      onUpdate();
      addToast('Accessibility overwrite node added.', 'success');
    } catch (e) {
      addToast('Failed to register override.', 'error');
    }
  };

  const handleKick = async (member: IUser) => {
    const reason = prompt(`Sever link (Kick) for ${member.username}? Reason:`) || '';
    if (reason === null) return;
    try {
      await api.kickRealmMember(realm._id, member._id || member.id, reason);
      onUpdate();
      addToast(`Severed connection for user ${member.username}.`, 'success');
    } catch (e) {
      addToast('Kick action rejected.', 'error');
    }
  };

  const handleBan = async (member: IUser) => {
    const reason = prompt(`Banish (Ban) ${member.username}? Reason:`) || '';
    if (reason === null) return;
    try {
      await api.banRealmMember(realm._id, member._id || member.id, reason);
      onUpdate();
      addToast(`Ban registry updated for ${member.username}.`, 'success');
    } catch (e) {
      addToast('Banishment action rejected.', 'error');
    }
  };

  const startAssigningRoles = (member: IUser) => {
    setSelectedMemberForRoles(member);
    const assigned = (realm.memberRoles || [])
      .filter(mr => String(mr.user) === String(member._id || member.id))
      .map(mr => mr.roleId);
    setMemberRolesDraft(assigned);
  };

  const toggleMemberRoleDraft = (roleId: string) => {
    setMemberRolesDraft(prev =>
      prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
    );
  };

  const handleSaveMemberRoles = async () => {
    if (!selectedMemberForRoles) return;
    try {
      await api.assignRoles(realm._id, selectedMemberForRoles._id || selectedMemberForRoles.id, memberRolesDraft);
      onUpdate();
      setSelectedMemberForRoles(null);
      addToast('Authority credentials synced.', 'success');
    } catch (e) {
      addToast('Failed to assign credentials.', 'error');
    }
  };

  const handleCreateInvite = async () => {
    const codeVal = inviteCode.trim().toUpperCase();
    if (codeVal && !/^[A-Z0-9_-]{4,24}$/.test(codeVal)) {
      addToast('Invalid custom invite format.', 'error');
      return;
    }
    const maxUses = Number(inviteMaxUses) || 0;
    const exp = Number(inviteExpiresIn) || 0;

    setCreatingInvite(true);
    try {
      const created = await api.createRealmInvite(realm._id, {
        code: codeVal || undefined,
        maxUses,
        expiresInHours: exp
      });
      addToast('Invite channel path forged.', 'success');
      fetchInvites();
      setInviteCode('');
    } catch (e: any) {
      addToast(e?.response?.data?.message || 'Synthesis failure.', 'error');
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleRevokeInvite = async (code: string) => {
    try {
      await api.revokeRealmInvite(realm._id, code);
      addToast('Invite code severed.', 'success');
      fetchInvites();
    } catch (e) {
      addToast('Failed to revoke invite code.', 'error');
    }
  };

  const handleUnban = async (banRecord: any) => {
    try {
      await api.unbanRealmMember(realm._id, banRecord.user._id || banRecord.user.id);
      addToast(`Re-established link for ${banRecord.user.username}.`, 'success');
      fetchBans();
    } catch (e) {
      addToast('Failed to unban node.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[1000] flex items-center justify-center p-4 md:p-10 backdrop-blur-xl animate-fade-in" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        onClick={(e) => e.stopPropagation()} 
        className="w-full max-w-6xl h-[85vh] bg-[#070709] border border-white/5 rounded-[40px] shadow-2xl flex overflow-hidden font-sans text-gray-300"
      >
        <div className="w-64 bg-black/40 border-r border-white/5 p-6 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div className="flex items-center space-x-3 mb-8 px-2">
            <Settings className="text-vani-blue animate-spin-slow" size={18} />
            <span className="text-xs font-black uppercase text-white tracking-widest">Sovereignty Admin</span>
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-[8px] font-black tracking-widest text-vani-blue opacity-50 uppercase mb-2 ml-4">Core System</div>
              <div className="space-y-1">
                <NavBtn label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Globe size={13} />} />
                <NavBtn label="Server Tag" active={activeTab === 'vanity'} onClick={() => setActiveTab('vanity')} icon={<Link2 size={13} />} />
                <NavBtn label="Engagement" active={activeTab === 'engagement'} onClick={() => setActiveTab('engagement')} icon={<Volume2 size={13} />} />
                <NavBtn label="Safety Setup" active={activeTab === 'safety'} onClick={() => setActiveTab('safety')} icon={<ShieldAlert size={13} />} />
              </div>
            </div>

            <div>
              <div className="text-[8px] font-black tracking-widest text-vani-blue opacity-50 uppercase mb-2 ml-4">Permissions & Access</div>
              <div className="space-y-1">
                <NavBtn label="Roles Matrix" active={activeTab === 'roles'} onClick={() => setActiveTab('roles')} icon={<Shield size={13} />} />
                <NavBtn label="Channel Access" active={activeTab === 'access'} onClick={() => setActiveTab('access')} icon={<Hash size={13} />} />
                <NavBtn label="Identity List" active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon={<Users size={13} />} />
                <NavBtn label="Invites Control" active={activeTab === 'invites'} onClick={() => setActiveTab('invites')} icon={<UserPlus size={13} />} />
              </div>
            </div>

            <div>
              <div className="text-[8px] font-black tracking-widest text-vani-blue opacity-50 uppercase mb-2 ml-4">Logs & Moderation</div>
              <div className="space-y-1">
                <NavBtn label="Audit Log" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={<ListTodo size={13} />} />
                <NavBtn label="Ban Registry" active={activeTab === 'bans'} onClick={() => setActiveTab('bans')} icon={<Ban size={13} />} />
              </div>
            </div>

            {isOwner && (
              <div className="pt-4 border-t border-white/5">
                <button 
                  onClick={async () => {
                    if (confirm('Initiate ultimate purge sequence? This operation dissolves the entire sovereignty structure, removing all channels, files, and members.')) {
                      try {
                        await api.deleteRealm(realm._id);
                        window.location.reload();
                      } catch (e) {
                        addToast('Purge protocol failed.', 'error');
                      }
                    }
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl border border-red-500/20 hover:bg-red-500/10 text-red-500 transition-all font-bold text-[9px] uppercase tracking-widest"
                >
                  <Trash2 size={13} />
                  <span>Purge Sector</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12 relative bg-black/20">
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                <span>Protocol:</span>
                <span className="text-vani-blue">{activeTab.toUpperCase()}</span>
              </h3>
              <p className="text-[9px] font-mono uppercase text-gray-500 mt-1">Sector: {realm.name}</p>
            </div>
            <button onClick={onClose} className="p-2.5 bg-white/5 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X size={16} /></button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in text-left">
              <div className="relative mb-16">
                <div className="h-44 bg-gray-900/50 rounded-[24px] overflow-hidden border border-white/5 group cursor-pointer" onClick={() => bannerRef.current?.click()}>
                  {bannerPreview ? <img src={bannerPreview} className="w-full h-full object-cover opacity-50" /> : <div className="w-full h-full bg-gradient-to-r from-pink-500/10 to-vani-blue/10" />}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-all text-xs font-mono uppercase text-white tracking-widest"><ImageIcon size={20} className="mr-2" /> Upload Banner</div>
                </div>
                <div className="absolute -bottom-10 left-8 p-1 bg-[#070709] rounded-3xl group cursor-pointer" onClick={(e) => { e.stopPropagation(); iconRef.current?.click(); }}>
                  <div className="w-20 h-20 rounded-[20px] bg-gray-800 border-2 border-white/5 overflow-hidden relative shadow-2xl">
                    {iconPreview ? <img src={iconPreview} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-vani-gradient" />}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-all text-[8px] font-mono uppercase text-white tracking-wider"><Camera size={14} /></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Sovereignty Identity</label>
                  <input className="w-full bg-black/40 border border-white/5 p-3.5 rounded-xl text-white outline-none focus:border-vani-blue font-bold text-sm" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Description Summary</label>
                  <input className="w-full bg-black/40 border border-white/5 p-3.5 rounded-xl text-white outline-none focus:border-vani-blue font-bold text-sm" placeholder="Define sector focus..." value={vanity} disabled />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={handleSaveOverview} className="bg-vani-gradient hover:scale-[1.01] active:scale-95 text-white py-3 px-8 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center gap-2 transition-all"><Save size={14} /> Commit Changes</button>
              </div>

              <input type="file" ref={iconRef} hidden onChange={(e) => { const f = e.target.files?.[0]; if(f){ setIconBlob(f); setIconPreview(URL.createObjectURL(f)); } }} />
              <input type="file" ref={bannerRef} hidden onChange={(e) => { const f = e.target.files?.[0]; if(f){ setBannerBlob(f); setBannerPreview(URL.createObjectURL(f)); } }} />
            </div>
          )}

          {activeTab === 'vanity' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl space-y-2">
                <h4 className="text-sm font-black uppercase tracking-wider text-white">Sovereignty Vanity URL</h4>
                <p className="text-[10px] text-gray-500">Secure a personalized handle for routing external nodes directly to this sector.</p>
              </div>

              <div className="space-y-2 max-w-lg">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Sovereignty Tag Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-vani-blue font-black opacity-45">{window.location.hostname}/join/</span>
                  <input 
                    className="w-full bg-black/40 border border-white/5 p-3.5 pl-32 rounded-xl text-white outline-none focus:border-vani-blue font-mono text-xs uppercase" 
                    value={vanity} 
                    onChange={(e) => setVanity(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} 
                    placeholder="tag-handle"
                  />
                </div>
              </div>

              <button onClick={handleSaveVanity} className="bg-vani-gradient hover:scale-105 py-3 px-8 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center gap-2 transition-all"><Save size={14} /> Commit Tag</button>
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Node Ingress welcome alerts</label>
                  <select 
                    className="w-full bg-black/40 border border-white/5 p-3.5 rounded-xl text-white outline-none focus:border-vani-blue font-bold text-xs"
                    value={systemChannel}
                    onChange={(e) => setSystemChannel(e.target.value)}
                  >
                    <option value="">No welcomes broadcast</option>
                    {(realm.channels || []).filter(c => c.type === 'text').map(ch => (
                      <option key={ch._id} value={ch._id}>#{ch.name.toUpperCase()}</option>
                    ))}
                  </select>
                  <p className="text-[8px] text-gray-500 font-mono mt-1">Announces welcome handshakes in this channel when users join.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Default Alerts Protocol</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'all', label: 'All Signals', desc: 'Alert user for every matrix update.' },
                      { id: 'mentions', label: 'Mentions Only', desc: 'Trigger alerts only on direct ping.' }
                    ].map(opt => (
                      <div key={opt.id} onClick={() => setDefaultNotifications(opt.id as any)} className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${defaultNotifications === opt.id ? 'bg-vani-blue/10 border-vani-blue text-white shadow-[0_0_10px_rgba(0,210,255,0.15)]' : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/10'}`}>
                        <div className="text-[10px] font-black uppercase tracking-wider">{opt.label}</div>
                        <div className="text-[8px] font-mono text-gray-500 mt-1 uppercase">{opt.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={handleSaveEngagement} className="bg-vani-gradient hover:scale-[1.01] text-white py-3 px-8 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center gap-2 transition-all"><Save size={14} /> Save Ingress Config</button>
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div className="space-y-4">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Verification Level Security</label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { id: 'none', label: 'None', desc: 'Open ingress. No restrictions.' },
                    { id: 'low', label: 'Low', desc: 'Requires verified email verification.' },
                    { id: 'medium', label: 'Medium', desc: 'Account registered > 5 minutes.' },
                    { id: 'high', label: 'High', desc: 'MFA (2FA) protection required.' }
                  ].map(lvl => (
                    <div key={lvl.id} onClick={() => setVerificationLevel(lvl.id as any)} className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${verificationLevel === lvl.id ? 'bg-vani-blue/10 border-vani-blue text-white shadow-[0_0_10px_rgba(0,210,255,0.15)]' : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/10'}`}>
                      <div className="text-[10px] font-black uppercase tracking-wider">{lvl.label}</div>
                      <div className="text-[8px] font-mono text-gray-500 mt-2 uppercase">{lvl.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Media Quarantine Content Filter</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'none', label: 'Silenced', desc: 'Disable all scanning. Trust channel members.' },
                    { id: 'nsfw', label: 'Quarantine NSFW', desc: 'Scan files uploaded inside NSFW-rated sectors.' },
                    { id: 'strict', label: 'Strict Scanning', desc: 'Perform heuristic audits on all visuals.' }
                  ].map(flt => (
                    <div key={flt.id} onClick={() => setContentFilter(flt.id as any)} className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${contentFilter === flt.id ? 'bg-pink-500/10 border-pink-500 text-white shadow-[0_0_10px_rgba(244,114,182,0.15)]' : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/10'}`}>
                      <div className="text-[10px] font-black uppercase tracking-wider">{flt.label}</div>
                      <div className="text-[8px] font-mono text-gray-500 mt-2 uppercase">{flt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={handleSaveSafety} className="bg-vani-gradient hover:scale-[1.01] text-white py-3 px-8 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center gap-2 transition-all"><Save size={14} /> Commit Protocols</button>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-fade-in h-[58vh]">
              <div className="lg:col-span-4 bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Authority Roles</span>
                  <button onClick={handleCreateRole} className="p-1 text-vani-blue hover:text-white transition-all"><Plus size={16} /></button>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                  {sortedRoles.map(role => (
                    <div 
                      key={role._id} 
                      onClick={() => startEditingRole(role)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${selectedRoleId === role._id ? 'bg-vani-blue/15 border-vani-blue text-white' : 'bg-white/[0.01] border-transparent hover:bg-white/5 text-gray-400'}`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: role.color }} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{role.name}</span>
                      </div>
                      <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleMoveRole(role, 'up')} className="p-1 hover:text-white text-gray-600 transition-all"><ArrowUp size={12} /></button>
                        <button onClick={() => handleMoveRole(role, 'down')} className="p-1 hover:text-white text-gray-600 transition-all"><ArrowDown size={12} /></button>
                        {!role.isSystem && (
                          <button onClick={() => handleDeleteRole(role._id)} className="p-1 hover:text-red-500 text-gray-600 transition-all"><Trash2 size={12} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-8 bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar">
                {selectedRoleId ? (
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Role Name</label>
                        <input 
                          className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-vani-blue font-bold text-xs"
                          value={editingRoleName}
                          onChange={(e) => setEditingRoleName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Rank Color</label>
                        <input 
                          type="color"
                          className="w-full h-10 bg-transparent border-0 rounded-xl cursor-pointer p-0.5"
                          value={editingRoleColor}
                          onChange={(e) => setEditingRoleColor(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-3">Server-Wide Authority Flags</label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-2 bg-black/30 border border-white/5 rounded-xl">
                        {serverPermissions.map(perm => {
                          const enabled = editingRolePermissions.includes(perm);
                          return (
                            <div 
                              key={perm}
                              onClick={() => toggleRolePermission(perm)}
                              className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${enabled ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-transparent border-white/5 text-gray-500 hover:border-white/10'}`}
                            >
                              <span className="text-[9px] font-black uppercase tracking-wider">{perm.replace(/_/g, ' ')}</span>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${enabled ? 'bg-vani-blue border-vani-blue text-black' : 'border-white/10'}`}>
                                {enabled && <Check size={10} />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button onClick={handleSaveRoleDetails} disabled={isSavingRole} className="bg-vani-gradient hover:scale-[1.01] py-3 px-8 rounded-xl font-black uppercase text-[9px] tracking-widest text-white shadow-lg transition-all">{isSavingRole ? 'Syncing...' : 'Save Role'}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-mono text-xs uppercase py-20">Select an authority rank to recalibrate permissions.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'access' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-fade-in h-[58vh]">
              <div className="lg:col-span-4 bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="space-y-4 flex flex-col flex-1">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Select Target Sector</label>
                    <select
                      className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-white outline-none focus:border-vani-blue font-bold text-xs"
                      value={selectedChannelId || ''}
                      onChange={(e) => {
                        setSelectedChannelId(e.target.value || null);
                        setSelectedOverwriteTargetId(null);
                      }}
                    >
                      <option value="">No sector selected</option>
                      {(realm.channels || []).filter(c => c.type !== 'category').map(ch => (
                        <option key={ch._id} value={ch._id}>#{ch.name.toUpperCase()} [{ch.type}]</option>
                      ))}
                    </select>
                  </div>

                  {selectedChannelId && (
                    <div className="flex-1 flex flex-col">
                      <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">Override Nodes</span>
                      <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar mb-4">
                        {((realm.channels || []).find(c => c._id === selectedChannelId)?.permissionOverwrites || []).map(ow => {
                          const nameVal = ow.targetType === 'role' 
                            ? (realm.roles || []).find(r => r._id === ow.targetId)?.name || 'Role'
                            : (realm.members || []).find(m => (m._id || m.id) === ow.targetId)?.username || 'User';
                          return (
                            <div
                              key={ow.targetId}
                              onClick={() => {
                                setSelectedOverwriteTargetId(ow.targetId);
                                setSelectedOverwriteTargetType(ow.targetType);
                              }}
                              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${selectedOverwriteTargetId === ow.targetId ? 'bg-vani-blue/15 border-vani-blue text-white' : 'bg-white/[0.01] border-transparent hover:bg-white/5 text-gray-400'}`}
                            >
                              <div className="flex flex-col text-left">
                                <span className="text-[10px] font-black uppercase tracking-wider">{nameVal}</span>
                                <span className="text-[7px] font-mono text-gray-500 uppercase mt-0.5">{ow.targetType}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Type</label>
                          <select
                            className="bg-black/50 text-[8px] font-black uppercase text-gray-400 border border-white/5 rounded p-1 outline-none"
                            value={newOverwriteType}
                            onChange={(e) => { setNewOverwriteType(e.target.value as any); setNewOverwriteTargetId(''); }}
                          >
                            <option value="role">Role</option>
                            <option value="member">Member</option>
                          </select>
                        </div>
                        <select
                          className="w-full bg-black/40 border border-white/5 p-2 rounded-xl text-white text-xs outline-none"
                          value={newOverwriteTargetId}
                          onChange={(e) => setNewOverwriteTargetId(e.target.value)}
                        >
                          <option value="">Select Target...</option>
                          {newOverwriteType === 'role'
                            ? (realm.roles || []).map(r => <option key={r._id} value={r._id}>{r.name.toUpperCase()}</option>)
                            : (realm.members || []).map(m => <option key={m._id} value={m._id}>{m.username.toUpperCase()}</option>)
                          }
                        </select>
                        <button onClick={handleAddOverwrite} className="w-full py-2 bg-white/5 hover:bg-vani-blue/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Add Override</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-8 bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col overflow-y-auto custom-scrollbar">
                {selectedChannelId && selectedOverwriteTargetId ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase text-white tracking-widest">Configure Access Rule</h4>
                      <p className="text-[8px] text-gray-500 font-mono mt-1 uppercase">Target: {selectedOverwriteTargetType === 'role' ? 'Role' : 'Member'} Override</p>
                    </div>

                    <div className="space-y-2 border-t border-white/5 pt-4">
                      {channelPermissions.map(perm => (
                        <div key={perm} className="p-3 bg-black/30 border border-white/5 rounded-xl flex items-center justify-between gap-4">
                          <div className="flex flex-col text-left">
                            <span className="text-[9px] font-black text-white uppercase tracking-wider">{perm.replace(/_/g, ' ')}</span>
                            <span className="text-[7px] text-gray-500 font-mono uppercase mt-0.5">Custom channel override flag</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            {[
                              { id: 'allow', label: 'Allow', color: 'bg-green-500/20 border-green-500 text-green-400' },
                              { id: 'inherit', label: 'Inherit', color: 'bg-white/5 border-white/10 text-gray-400' },
                              { id: 'deny', label: 'Deny', color: 'bg-red-500/20 border-red-500 text-red-400' }
                            ].map(b => {
                              const active = getPermissionStatus(perm) === b.id;
                              return (
                                <button
                                  key={b.id}
                                  onClick={() => handleToggleOverwrite(perm, b.id as any)}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${active ? b.color : 'bg-black/40 border-white/5 text-gray-600 hover:text-gray-400'}`}
                                >
                                  {b.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-mono text-xs uppercase py-20">Select a sector and an override target node.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6 text-left animate-fade-in">
              <div className="flex justify-between items-center gap-4">
                <input 
                  className="bg-black/40 border border-white/5 px-4 py-3 rounded-xl text-xs outline-none focus:border-vani-blue w-full max-w-sm" 
                  placeholder="Search identity handles..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
                <span className="text-[9px] font-mono uppercase text-gray-500">Synced: {(realm.members || []).length} Nodes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[46vh] overflow-y-auto custom-scrollbar p-1">
                {(realm.members || []).filter(m => m.username.toLowerCase().includes(memberSearch.toLowerCase())).map(member => {
                  const mId = member._id || member.id;
                  const assigned = (realm.memberRoles || [])
                    .filter(mr => String(mr.user) === String(mId))
                    .map(mr => (realm.roles || []).find(r => r._id === mr.roleId))
                    .filter(Boolean);
                  return (
                    <div key={member._id} className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3.5">
                        <img src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} className="w-10 h-10 rounded-xl" />
                        <div className="text-left">
                          <div className="text-xs font-black text-white uppercase tracking-tight">{member.username}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assigned.map((r: any) => (
                              <span key={r._id} className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border" style={{ color: r.color, borderColor: `${r.color}30`, backgroundColor: `${r.color}08` }}>{r.name}</span>
                            ))}
                            {assigned.length === 0 && <span className="text-[6px] text-gray-600 font-black uppercase tracking-widest">No Authority Role</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {canManageRoles && (
                          <button onClick={() => startAssigningRoles(member)} className="p-2 text-gray-500 hover:text-white bg-white/5 rounded-lg transition-all" title="Manage assigned ranks"><Shield size={13} /></button>
                        )}
                        {canManageRealm && String(mId) !== String(realm.owner) && (
                          <>
                            <button onClick={() => handleKick(member)} className="p-2 text-gray-500 hover:text-red-500 bg-white/5 rounded-lg transition-all" title="Kick member"><UserMinus size={13} /></button>
                            <button onClick={() => handleBan(member)} className="p-2 text-gray-500 hover:text-red-500 bg-white/5 rounded-lg transition-all" title="Ban member"><Ban size={13} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'invites' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-fade-in h-[58vh]">
              <div className="lg:col-span-5 bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-white">Forge Ingress Code</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Custom Code (Optional)</label>
                    <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="VAMP-SERVER" className="w-full bg-[#050507] border border-white/5 rounded-xl px-3.5 py-3 text-xs font-mono text-white outline-none focus:border-vani-blue" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Max Uses</label>
                      <input value={inviteMaxUses} onChange={(e) => setInviteMaxUses(e.target.value)} placeholder="0 = unlimited" className="w-full bg-[#050507] border border-white/5 rounded-xl px-3.5 py-3 text-xs font-mono text-white outline-none focus:border-vani-blue" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Expiry (Hours)</label>
                      <input value={inviteExpiresIn} onChange={(e) => setInviteExpiresIn(e.target.value)} placeholder="0 = never" className="w-full bg-[#050507] border border-white/5 rounded-xl px-3.5 py-3 text-xs font-mono text-white outline-none focus:border-vani-blue" />
                    </div>
                  </div>
                  <button disabled={creatingInvite} onClick={handleCreateInvite} className="w-full bg-vani-gradient text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60 transition-all hover:scale-[1.01]">{creatingInvite ? 'Forging...' : 'Synthesize Invite'}</button>
                </div>
              </div>

              <div className="lg:col-span-7 bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Active Invite Records</span>
                <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar">
                  {loadingInvites && <div className="text-center text-gray-500 text-xs font-mono py-10">Syncing active links...</div>}
                  {!loadingInvites && invites.length === 0 && <div className="text-center text-gray-500 text-xs font-mono py-10">No invite registries active.</div>}
                  {!loadingInvites && invites.map(invite => (
                    <div key={invite.code} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between gap-3 text-left">
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-wider">{invite.code}</div>
                        <div className="text-[8px] font-mono text-gray-400 mt-1 uppercase flex items-center gap-2">
                          <span>Uses: {invite.maxUses > 0 ? `${invite.uses}/${invite.maxUses}` : invite.uses}</span>
                          <span>|</span>
                          <span>Expiry: {invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : 'Never'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={async () => {
                          await navigator.clipboard.writeText(`${window.location.origin}/app/join/${invite.code}`);
                          addToast('Invite path copied.', 'info');
                        }} className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-vani-blue/20 text-vani-blue text-[8px] font-black uppercase"><Copy size={11} /></button>
                        <button onClick={() => handleRevokeInvite(invite.code)} className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[8px] font-black uppercase"><Trash2 size={11} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4 text-left animate-fade-in h-[58vh] flex flex-col">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Sovereign Audit Trail</span>
              <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar bg-black/30 border border-white/5 rounded-2xl p-4">
                {loadingAuditLogs && <div className="text-center text-gray-500 text-xs font-mono py-10">Decoding trail...</div>}
                {!loadingAuditLogs && auditLogs.length === 0 && <div className="text-center text-gray-500 text-xs font-mono py-10">Audit trail clear.</div>}
                {!loadingAuditLogs && auditLogs.map(log => (
                  <div key={log._id} className="p-3 bg-white/[0.01] border-b border-white/5 last:border-0 flex items-center justify-between gap-4 font-mono text-[9px] uppercase">
                    <div className="flex items-center space-x-2">
                      <img src={log.executor?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg'} className="w-5 h-5 rounded-md" />
                      <span className="text-white font-bold">{log.executor?.username}</span>
                      <span className="text-vani-blue">{log.action.replace(/_/g, ' ')}</span>
                      {log.target && (
                        <>
                          <span className="text-gray-500">TARGET:</span>
                          <span className="text-gray-300">{log.target}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      {log.reason && <span className="text-gray-500">[{log.reason}]</span>}
                      <span className="text-gray-600">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bans' && (
            <div className="space-y-4 text-left animate-fade-in h-[58vh] flex flex-col">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Banishment Records</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto custom-scrollbar p-1">
                {loadingBans && <div className="text-center text-gray-500 text-xs font-mono py-10">Retrieving records...</div>}
                {!loadingBans && bansList.length === 0 && <div className="text-center text-gray-500 text-xs font-mono py-10">Ban registry clear.</div>}
                {!loadingBans && bansList.map(ban => (
                  <div key={ban.user?._id || ban.user?.id} className="p-4 bg-red-500/[0.02] border border-red-900/20 rounded-2xl flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center space-x-3.5">
                      <img src={ban.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ban.user?.username}`} className="w-10 h-10 rounded-xl" />
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-tight">{ban.user?.username}</div>
                        <div className="text-[8px] font-mono text-red-400 mt-1 uppercase">Reason: {ban.reason || 'Banned'}</div>
                      </div>
                    </div>
                    <button onClick={() => handleUnban(ban)} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Unban</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {selectedMemberForRoles && (
         <div className="fixed inset-0 bg-black/60 z-[2100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-[#0f0f12] border border-white/10 rounded-[32px] p-8 max-w-md w-full space-y-6">
               <div>
                  <h4 className="text-sm font-black uppercase text-white tracking-widest">Adjust Authority Matrix</h4>
                  <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">For User: {selectedMemberForRoles.username}</p>
               </div>
               <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                  {sortedRoles.map(r => {
                     const hasRole = memberRolesDraft.includes(r._id);
                     return (
                        <div key={r._id} onClick={() => toggleMemberRoleDraft(r._id)} className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${hasRole ? 'bg-vani-blue/10 border-vani-blue/30 text-white' : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/10'}`}>
                           <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                              <span className="text-xs font-bold uppercase">{r.name}</span>
                           </div>
                           <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${hasRole ? 'bg-vani-blue border-vani-blue text-black' : 'border-white/20'}`}>
                              {hasRole && <Check size={12} />}
                           </div>
                        </div>
                     );
                  })}
               </div>
               <div className="flex justify-end space-x-2">
                  <button onClick={() => setSelectedMemberForRoles(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all">Cancel</button>
                  <button onClick={handleSaveMemberRoles} className="px-6 py-2 bg-vani-gradient text-white text-[9px] font-black uppercase tracking-wider rounded-xl shadow-lg transition-all hover:scale-[1.02]">Sync Matrix</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

const NavBtn = ({ label, active, onClick, icon }: any) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all ${active ? 'bg-vani-gradient text-white shadow-xl shadow-red-500/20' : 'text-gray-500 hover:bg-white/5'}`}>
     {icon}<span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export const CreateRealmModal = ({ onClose, onSubmit }: any) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4 backdrop-blur-xl" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0a0a0c] w-full max-w-md rounded-[40px] border border-white/5 overflow-hidden">
         <div className="p-8 border-b border-white/5 flex items-center justify-between"><h2 className="text-xl font-black text-white uppercase tracking-tighter">{t('modals.init_realm')}</h2><button onClick={onClose} className="p-2 text-gray-500 hover:text-white"><X size={20} /></button></div>
         <div className="p-8 space-y-6"><input className="w-full bg-[#050507] border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-vani-blue" placeholder={t('modals.realm_placeholder')} value={name} onChange={(e) => setName(e.target.value)} /><button onClick={() => onSubmit(name)} className="w-full bg-vani-gradient text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl">{t('modals.create_matrix')}</button></div>
      </motion.div>
    </div>
  );
};

export const CreateChannelModal = ({ onClose, onSubmit }: any) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  return (
    <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4 backdrop-blur-xl" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0a0a0c] w-full max-w-md rounded-[40px] border border-white/5">
         <div className="p-8 border-b border-white/5 flex items-center justify-between"><h2 className="text-xl font-black text-white uppercase tracking-tighter">{t('modals.new_sector')}</h2><button onClick={onClose} className="p-2 text-gray-500 hover:text-white"><X size={20} /></button></div>
         <div className="p-8 space-y-6">
            <input className="w-full bg-[#050507] border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-vani-blue" placeholder={t('modals.sector_placeholder')} value={name} onChange={(e) => setName(e.target.value)} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
               <div onClick={() => setType('category')} className={`p-4 rounded-2xl border cursor-pointer flex items-center space-x-3 transition-all ${type === 'category' ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/[0.02] border-gray-800 text-gray-500'}`}><Settings size={16} /> <span className="text-[10px] font-black uppercase">Category</span></div>
               <div onClick={() => setType('text')} className={`p-4 rounded-2xl border cursor-pointer flex items-center space-x-3 transition-all ${type === 'text' ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/[0.02] border-gray-800 text-gray-500'}`}><Hash size={16} /> <span className="text-[10px] font-black uppercase">{t('modals.text')}</span></div>
               <div onClick={() => setType('voice')} className={`p-4 rounded-2xl border cursor-pointer flex items-center space-x-3 transition-all ${type === 'voice' ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/[0.02] border-gray-800 text-gray-500'}`}><Zap size={16} /> <span className="text-[10px] font-black uppercase">{t('modals.voice')}</span></div>
               <div onClick={() => setType('media')} className={`p-4 rounded-2xl border cursor-pointer flex items-center space-x-3 transition-all ${type === 'media' ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/[0.02] border-gray-800 text-gray-500'}`}><ImageIcon size={16} /> <span className="text-[10px] font-black uppercase">Media</span></div>
               <div onClick={() => setType('gallery')} className={`p-4 rounded-2xl border cursor-pointer flex items-center space-x-3 transition-all ${type === 'gallery' ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/[0.02] border-gray-800 text-gray-500'}`}><Camera size={16} /> <span className="text-[10px] font-black uppercase">Gallery</span></div>
               <div onClick={() => setType('matrix')} className={`p-4 rounded-2xl border cursor-pointer flex items-center space-x-3 transition-all ${type === 'matrix' ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/[0.02] border-gray-800 text-gray-500'}`}><Globe size={16} /> <span className="text-[10px] font-black uppercase">Matrix</span></div>
               <div onClick={() => setType('feed')} className={`p-4 rounded-2xl border cursor-pointer flex items-center space-x-3 transition-all ${type === 'feed' ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/[0.02] border-gray-800 text-gray-500'}`}><Globe size={16} /> <span className="text-[10px] font-black uppercase">{t('modals.broadcast')}</span></div>
               <div onClick={() => setType('announcement')} className={`p-4 rounded-2xl border cursor-pointer flex items-center space-x-3 transition-all ${type === 'announcement' ? 'bg-vani-blue/10 border-vani-blue text-white' : 'bg-white/[0.02] border-gray-800 text-gray-500'}`}><Shield size={16} /> <span className="text-[10px] font-black uppercase">{t('modals.alerts')}</span></div>
            </div>
            <button onClick={() => onSubmit(name, type)} className="w-full bg-vani-gradient text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">{t('modals.open_sector')}</button>
         </div>
      </motion.div>
    </div>
  );
};

export const RealmInvitesModal = ({ realm, onClose }: { realm: IRealm, onClose: () => void }) => {
   const { t } = useLanguage();
   const { addToast } = useToast();
   const [invites, setInvites] = useState<IRealmInvite[]>([]);
   const [loading, setLoading] = useState(true);
   const [creating, setCreating] = useState(false);
   const [code, setCode] = useState('');
   const [maxUses, setMaxUses] = useState('0');
   const [expiresInHours, setExpiresInHours] = useState('24');

   const loadInvites = async () => {
      setLoading(true);
      try {
         const data = await api.listRealmInvites(realm._id);
         setInvites(data);
      } catch (e: any) {
         addToast(e?.response?.data?.message || 'Failed to load invites.', 'error');
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      loadInvites();
   }, [realm._id]);

   const handleCreateInvite = async () => {
      const normalizedCode = code.trim().toUpperCase();
      if (normalizedCode && !/^[A-Z0-9_-]{4,24}$/.test(normalizedCode)) {
         addToast('Invalid invite code format.', 'error');
         return;
      }

      const parsedMaxUses = Number(maxUses);
      const parsedExpiryHours = Number(expiresInHours);
      const payload = {
         code: normalizedCode || undefined,
         maxUses: Number.isFinite(parsedMaxUses) && parsedMaxUses > 0 ? Math.floor(parsedMaxUses) : 0,
         expiresInHours: Number.isFinite(parsedExpiryHours) && parsedExpiryHours > 0 ? parsedExpiryHours : 0
      };

      setCreating(true);
      try {
         const created = await api.createRealmInvite(realm._id, payload);
         setInvites(prev => [created, ...prev]);
         setCode('');
         addToast(`Invite created: ${created.code}`, 'success');

         const url = `${window.location.origin}${created.urlPath || `/app/join/${created.code}`}`;
         await navigator.clipboard.writeText(url);
         addToast('Invite link copied to clipboard.', 'info');
      } catch (e: any) {
         addToast(e?.response?.data?.message || 'Failed to create invite.', 'error');
      } finally {
         setCreating(false);
      }
   };

   const handleCopy = async (invite: IRealmInvite) => {
      try {
         const url = `${window.location.origin}${invite.urlPath || `/app/join/${invite.code}`}`;
         await navigator.clipboard.writeText(url);
         addToast(`Copied ${invite.code}`, 'success');
      } catch (e) {
         addToast('Clipboard copy failed.', 'error');
      }
   };

   const handleRevoke = async (invite: IRealmInvite) => {
      if (!window.confirm(`Revoke invite ${invite.code}?`)) return;
      try {
         await api.revokeRealmInvite(realm._id, invite.code);
         setInvites(prev => prev.filter(i => i.code !== invite.code));
         addToast('Invite revoked.', 'success');
      } catch (e: any) {
         addToast(e?.response?.data?.message || 'Failed to revoke invite.', 'error');
      }
   };

   return (
      <div className="fixed inset-0 bg-black/90 z-[2000] flex items-center justify-center p-4 backdrop-blur-xl" onClick={onClose}>
         <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl max-h-[88vh] bg-[#0a0a0c] border border-white/10 rounded-[36px] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
               <div>
                  <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2"><Link2 size={16} className="text-vani-blue" /> {t('common.invite')} Manager</h2>
                  <p className="text-[10px] text-gray-500 font-mono uppercase mt-1">{realm.name}</p>
               </div>
               <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-red-500 transition-all"><X size={18} /></button>
            </div>

            <div className="p-6 border-b border-white/5 grid grid-cols-1 md:grid-cols-3 gap-3">
               <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Custom code (optional)" className="bg-[#050507] border border-gray-800 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-vani-blue" />
               <input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Max uses (0 = unlimited)" className="bg-[#050507] border border-gray-800 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-vani-blue" />
               <input value={expiresInHours} onChange={(e) => setExpiresInHours(e.target.value)} placeholder="Expire in hours (0 = never)" className="bg-[#050507] border border-gray-800 rounded-xl px-4 py-3 text-xs font-mono text-white outline-none focus:border-vani-blue" />
               <button disabled={creating} onClick={handleCreateInvite} className="md:col-span-3 bg-vani-gradient text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60 transition-all hover:scale-[1.01]">{creating ? 'Creating...' : 'Create Invite'}</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
               {loading && <div className="text-center text-gray-500 text-xs font-mono uppercase py-10">Loading invites...</div>}
               {!loading && invites.length === 0 && <div className="text-center text-gray-500 text-xs font-mono uppercase py-10">No active invites.</div>}
               {!loading && invites.map((invite) => {
                  const expired = !!invite.expiresAt && new Date(invite.expiresAt).getTime() <= Date.now();
                  const limited = invite.maxUses > 0;
                  const exhausted = limited && invite.uses >= invite.maxUses;
                  return (
                     <div key={invite.code} className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                           <div className="text-sm font-black text-white uppercase tracking-wider">{invite.code}</div>
                           <div className="text-[10px] font-mono text-gray-400 uppercase mt-1 flex items-center gap-2">
                              <span>{limited ? `${invite.uses}/${invite.maxUses} uses` : `${invite.uses} uses`}</span>
                              <span className="opacity-40">|</span>
                              <span className="flex items-center gap-1"><Clock3 size={12} /> {invite.expiresAt ? new Date(invite.expiresAt).toLocaleString() : 'No expiry'}</span>
                           </div>
                           {(expired || exhausted) && (
                              <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-red-400">{expired ? 'Expired' : 'Max uses reached'}</div>
                           )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                           <button onClick={() => handleCopy(invite)} className="px-3 py-2 rounded-lg bg-white/5 hover:bg-vani-blue/20 text-vani-blue text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Copy size={12} /> Copy</button>
                           <button onClick={() => handleRevoke(invite)} className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Trash2 size={12} /> Revoke</button>
                        </div>
                     </div>
                  );
               })}
            </div>
         </motion.div>
      </div>
   );
};

export const CreateGroupDMModal = ({ onClose, onSubmit, currentUser }: { onClose: () => void, onSubmit: any, currentUser: IUser }) => {
  const { t } = useLanguage();
  const [friends, setFriends] = useState<IUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  useEffect(() => { 
    if(currentUser) {
      api.getUserProfile(currentUser.id || currentUser._id).then((res: any) => {
        const rawFriends = res.friends || [];
        // DE-DUPLICATE PROTOCOL: Filter by unique _id
        const unique = Array.from(new Map(rawFriends.map((f: any) => [f._id || f.id, f])).values()) as IUser[];
        setFriends(unique);
      });
    }
  }, [currentUser]);
  const toggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : (prev.length < 49 ? [...prev, id] : prev));
  return (
    <div className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4 backdrop-blur-xl" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0a0a0c] w-full max-w-lg rounded-[40px] shadow-2xl border border-white/5 flex flex-col overflow-hidden">
         <div className="p-8 border-b border-white/5 flex items-center justify-between"><h2 className="text-xl font-black text-white uppercase tracking-tighter">{t('modals.init_group')}</h2><button onClick={onClose} className="p-3 bg-white/5 hover:bg-red-500 rounded-2xl transition-all"><X size={18} /></button></div>
         <div className="p-8 space-y-6">
            <input className="w-full bg-[#050507] border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-vani-blue" placeholder={t('modals.group_placeholder')} value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
               {friends.map(f => (
                 <div key={f._id} onClick={() => toggle(f._id)} className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${selectedIds.includes(f._id) ? 'bg-vani-blue/10 border-vani-blue/30' : 'bg-white/[0.02] border-transparent'}`}>
                    <div className="flex items-center space-x-3"><img src={f.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`} className="w-8 h-8 rounded-lg" /><span className="text-xs font-black text-white uppercase">{f.username}</span></div>
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${selectedIds.includes(f._id) ? 'bg-vani-blue border-vani-blue text-black' : 'border-gray-800 text-transparent'}`}><Check size={14} strokeWidth={4} /></div>
                 </div>
               ))}
            </div>
         </div>
         <div className="p-8 border-t border-white/5 flex justify-end"><button onClick={() => onSubmit(selectedIds, groupName)} className="bg-vani-gradient text-white px-12 py-4 rounded-2xl font-black uppercase text-[10px] shadow-2xl transition-all hover:scale-105 active:scale-95">{t('modals.init_transmission')}</button></div>
      </motion.div>
    </div>
  );
};

export const CreatePostModal = ({ onClose, onComplete, channelId, currentUser }: { onClose: () => void, onComplete: (post: any) => void, channelId: string, currentUser: IUser }) => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [isPublic, setIsPublic] = useState(channelId === 'global');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'writer' | 'preview'>('writer');
  const [suggestion, setSuggestion] = useState<{ query: string, type: 'mention' | 'tag', index: number } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setCaption(v);
    const words = v.split(/\s+/);
    const last = words[words.length - 1] || '';
    if (last.startsWith('@') && last.length > 1) {
      setSuggestion({ query: last, type: 'mention', index: v.lastIndexOf(last) });
    } else if (last.startsWith('#') && last.length > 1) {
      setSuggestion({ query: last, type: 'tag', index: v.lastIndexOf(last) });
    } else {
      setSuggestion(null);
    }
  };

  const handleSelectSuggestion = (v: string) => {
    if (!suggestion) return;
    setCaption(`${caption.slice(0, suggestion.index)}${suggestion.type === 'mention' ? '@' : '#'}${v} ${caption.slice(suggestion.index + suggestion.query.length)}`);
    setSuggestion(null);
  };

  const handleSubmit = async () => {
    if (!file) return addToast(t('modals.visual_required'), 'error');
    setLoading(true);
    try {
      const hash = await calculateFileHash(file);
      const pHash = await calculatePerceptualHash(file);
      const check = await api.checkMediaHash(hash, pHash || undefined);

      const fd = new FormData();
      fd.append('caption', caption);
      fd.append('channelId', channelId);
      fd.append('isPublic', String(isPublic));
      fd.append('fileHash', hash);
      if (pHash) fd.append('pHash', pHash);

      if (check.exists && check.url) {
        fd.append('imageUrl', check.url);
      } else {
        fd.append('file', file);
      }

      const res = await api.createPost(channelId, fd); 
      onComplete(res);
      onClose();
    } catch (e) { 
      addToast(t('modals.broadcast_failed'), 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const isGlobal = channelId === 'global';

  return (
    <div className="fixed inset-0 bg-black/90 z-[2000] flex items-center justify-center p-2 lg:p-4 backdrop-blur-xl" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0a0a0c] w-full max-w-lg rounded-[32px] lg:rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl max-h-[95vh]">
         <div className="p-5 lg:p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-base lg:text-lg font-black text-white uppercase tracking-widest">{isGlobal ? t('modals.global_broadcast') : t('modals.sector_post')}</h2>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white"><X size={20} /></button>
         </div>
         
         <div className="p-5 lg:p-6 space-y-5 lg:space-y-6 overflow-y-auto custom-scrollbar">
            <div onClick={() => fileRef.current?.click()} className={`w-full h-48 lg:h-64 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-vani-blue/50 hover:bg-white/[0.02] transition-all overflow-hidden relative group`}>
               {preview ? <img src={preview} className="w-full h-full object-cover" /> : (
                 <>
                   <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-gray-800 flex items-center justify-center mb-3 lg:mb-4 group-hover:scale-110 transition-transform"><ImageIcon size={24} className="text-gray-400 group-hover:text-white" /></div>
                   <span className="text-[8px] lg:text-[10px] font-black uppercase text-gray-500 tracking-widest">{t('modals.upload_visual')}</span>
                 </>
               )}
               <input type="file" ref={fileRef} hidden accept="image/*" onChange={(e) => { const f=e.target.files?.[0]; if(f){ setFile(f); setPreview(URL.createObjectURL(f)); } }} />
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-white/5 pb-2">
               <button
                 type="button"
                 onClick={() => setActiveTab('writer')}
                 className={`px-4 py-2 font-mono text-[9px] uppercase tracking-widest font-black transition-all border-r border-white/5 ${activeTab === 'writer' ? 'text-vani-blue' : 'text-gray-500 hover:text-white'}`}
               >
                 [ Writer ]
               </button>
               <button
                 type="button"
                 onClick={() => setActiveTab('preview')}
                 className={`px-4 py-2 font-mono text-[9px] uppercase tracking-widest font-black transition-all ${activeTab === 'preview' ? 'text-vani-blue' : 'text-gray-500 hover:text-white'}`}
               >
                 [ Live Preview ]
               </button>
            </div>

            <div className="relative">
              {activeTab === 'writer' ? (
                <textarea 
                  className="w-full bg-[#050507] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-vani-blue resize-none h-24 lg:h-32 custom-scrollbar text-sm"
                  placeholder={t('modals.caption_placeholder')}
                  value={caption}
                  onChange={handleInputChange}
                />
              ) : (
                <div className="w-full bg-[#050507] border border-white/10 p-4 rounded-2xl text-gray-300 h-24 lg:h-32 overflow-y-auto custom-scrollbar text-sm text-left">
                  {caption ? (
                    <MarkdownRenderer content={caption} />
                  ) : (
                    <span className="text-gray-600 font-mono text-[10px] uppercase">Awaiting transmission matrix content...</span>
                  )}
                </div>
              )}

              {/* Suggestions Overlay */}
              {suggestion && (
                <NeuralSuggester
                  query={suggestion.query}
                  type={suggestion.type}
                  onSelect={handleSelectSuggestion}
                  position={{ top: 0, left: 10 }}
                />
              )}
            </div>


            {!isGlobal && !currentUser.isPrivate && (
              <div 
                onClick={() => setIsPublic(!isPublic)}
                className={`p-3 lg:p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${isPublic ? 'bg-vani-blue/10 border-vani-blue/30' : 'bg-white/[0.02] border-white/5'}`}
              >
                 <div className="flex items-center space-x-3">
                    <Globe size={16} className={isPublic ? 'text-vani-blue' : 'text-gray-600'} />
                    <div className="flex flex-col">
                       <span className="text-[9px] lg:text-[10px] font-black text-white uppercase tracking-widest">{t('modals.broadcast_matrix')}</span>
                       <span className="text-[7px] lg:text-[8px] text-gray-500 font-mono uppercase">{t('modals.explore_visible')}</span>
                    </div>
                 </div>
                 <div className={`w-8 lg:w-10 h-4 lg:h-5 rounded-full relative transition-all ${isPublic ? 'bg-vani-blue' : 'bg-gray-800'}`}>
                    <div className={`absolute top-0.5 w-3 lg:w-4 h-3 lg:h-4 rounded-full bg-white transition-all ${isPublic ? 'left-4.5 lg:left-5.5' : 'left-0.5'}`} />
                 </div>
              </div>
            )}
         </div>

         <div className="p-5 lg:p-6 border-t border-white/5 bg-black/40">
            <button onClick={handleSubmit} disabled={loading} className="w-full bg-vani-gradient text-white py-3.5 lg:py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] lg:text-[10px] shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02]">
               {loading ? t('modals.transmitting') : (isGlobal || isPublic ? t('modals.broadcast_matrix') : t('modals.send_sector'))}
            </button>
         </div>
      </motion.div>
    </div>
  );
};

export const GroupSettingsModal = ({ group, onClose, onUpdate, currentUser }: { group: IChannel, onClose: () => void, onUpdate: () => void, currentUser: IUser }) => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [name, setName] = useState(group.name);
  const [iconBlob, setIconBlob] = useState<Blob | null>(null);
  const [iconPreview, setIconPreview] = useState(group.icon || '');
  const [nicknames, setNicknames] = useState<Record<string, string>>(group.nicknames || {});
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append('name', name);
    if (iconBlob) fd.append('icon', iconBlob);
    fd.append('nicknames', JSON.stringify(nicknames));

    try {
      await api.updateChannelMetadata(group._id, fd);
      onUpdate();
      onClose();
      addToast(t('modals.calib_success'), 'success');
    } catch (e) { addToast(t('modals.calib_failed'), 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[2000] flex items-center justify-center p-4 backdrop-blur-xl" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0a0a0c] w-full max-w-2xl rounded-[48px] border border-white/5 flex flex-col max-h-[85vh] shadow-2xl">
         <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-black text-white uppercase tracking-widest">{t('modals.group_calib')}</h2>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white"><X size={20} /></button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
            {/* BRANDING SECTION */}
            <div className="flex flex-col items-center space-y-6">
               <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                  <div className="w-24 h-24 rounded-[32px] bg-gray-800 border-4 border-white/5 overflow-hidden relative shadow-2xl">
                     {iconPreview ? <img src={iconPreview} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-vani-gradient flex items-center justify-center"><Users size={32} className="text-white" /></div>}
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Camera size={24} className="text-white" /></div>
                  </div>
                  <input type="file" ref={fileRef} hidden onChange={(e) => { const f=e.target.files?.[0]; if(f){ setIconBlob(f); setIconPreview(URL.createObjectURL(f)); } }} />
               </div>
               <div className="w-full space-y-2">
                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-4">{t('modals.identity_label')}</label>
                  <input className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-vani-blue font-bold text-center" value={name} onChange={(e) => setName(e.target.value)} />
               </div>
            </div>

            {/* NICKNAMES SECTION */}
            <div className="space-y-4">
               <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-4 block mb-4">{t('modals.neural_alias')}</label>
               <div className="grid grid-cols-1 gap-3">
                  {group.members?.map((m: IUser) => (
                    <div key={m._id} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center space-x-4">
                       <img src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username}`} className="w-10 h-10 rounded-xl" />
                       <div className="flex-1">
                          <div className="text-[9px] font-black text-gray-500 uppercase mb-1">{m.username} {m._id === currentUser._id && `(${t('common.you')})`}</div>
                          <input 
                            className="bg-transparent text-sm text-white font-medium outline-none w-full border-b border-white/5 focus:border-vani-blue transition-colors" 
                            placeholder={t('modals.assign_nickname')}
                            value={nicknames[m._id] || ''}
                            onChange={(e) => setNicknames({ ...nicknames, [m._id]: e.target.value })}
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="p-8 border-t border-white/5 bg-black/40">
            <button onClick={handleSave} disabled={loading} className="w-full bg-vani-gradient text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl disabled:opacity-50 transition-all hover:scale-[1.02]">
               {loading ? t('modals.recalibrating') : t('modals.apply_sync')}
            </button>
         </div>
      </motion.div>
    </div>
  );
};
