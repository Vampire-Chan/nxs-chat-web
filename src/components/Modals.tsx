import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Check, Zap, Hash, Shield, Globe, Settings, UserPlus, Trash2, Camera, Image as ImageIcon, Save, Copy, Link2, Clock3 } from 'lucide-react';
import { api } from '../services/api';
import type { IUser, IRealm, IChannel, IRealmInvite } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const RealmSettingsModal = ({ realm, onClose, onUpdate }: { realm: IRealm, onClose: () => void, onUpdate: () => void }) => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const { user } = useAuth();
   const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'members' | 'channels' | 'invites'>('overview');
  const [name, setName] = useState(realm.name);
  const [vanity, setVanity] = useState(realm.vanityHandle || '');
  const [iconBlob, setIconBlob] = useState<Blob | null>(null);
  const [bannerBlob, setBannerBlob] = useState<Blob | null>(null);
  const [iconPreview, setIconPreview] = useState(realm.icon || '');
  const [bannerPreview, setBannerPreview] = useState((realm as any).banner || '');
   const [roleDrafts, setRoleDrafts] = useState<Record<string, string[]>>({});

  const iconRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

   const permissionOptions = [
      'ADMINISTRATOR',
      'MANAGE_REALM',
      'MANAGE_ROLES',
      'MANAGE_CATEGORIES',
      'MANAGE_CHANNELS',
      'MANAGE_MESSAGES',
      'MANAGE_MEDIA',
      'VIEW_CHANNEL',
      'SEND_MESSAGES',
      'CREATE_POSTS',
      'CONNECT',
      'SPEAK',
      'STREAM'
   ];

  const handleCreateRole = async () => {
    const roleName = prompt(t('modals.role_name_prompt'));
    if (!roleName) return;
    try {
      await api.createRole(realm._id, { name: roleName, color: "#00d2ff", permissions: [] });
      onUpdate();
      addToast(t('modals.role_forged'), 'success');
    } catch (e) { addToast(t('modals.forge_failed'), 'error'); }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await api.assignRole(realm._id, userId, roleId);
      onUpdate();
      addToast(t('modals.authority_assigned'), 'success');
    } catch (e) { addToast(t('modals.assignment_failed'), 'error'); }
  };

   const getRolePermissions = (role: any) => {
      if (roleDrafts[role._id]) return roleDrafts[role._id];
      return role.permissions || [];
   };

   const toggleRolePermission = (role: any, permission: string) => {
      const current = new Set(getRolePermissions(role));
      if (current.has(permission)) current.delete(permission);
      else current.add(permission);
      setRoleDrafts(prev => ({ ...prev, [role._id]: Array.from(current) }));
   };

   const handleSaveRolePermissions = async (role: any) => {
      try {
         await api.updateRole(realm._id, role._id, { permissions: getRolePermissions(role) });
         onUpdate();
         setRoleDrafts(prev => {
            const next = { ...prev };
            delete next[role._id];
            return next;
         });
         addToast('Role permissions updated.', 'success');
      } catch (e) {
         addToast('Failed to update role permissions.', 'error');
      }
   };

  const handleSaveOverview = async () => {
    const fd = new FormData();
    fd.append('name', name);
    fd.append('vanityHandle', vanity);
    if (iconBlob) fd.append('icon', iconBlob, 'icon.jpg');
    if (bannerBlob) fd.append('banner', bannerBlob, 'banner.jpg');
    try {
      await api.updateRealm(realm._id, fd);
      addToast(t('modals.calib_complete'), 'success');
      onUpdate();
    } catch (e) { addToast(t('modals.calib_failed'), 'error'); }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[1000] flex items-center justify-center p-4 md:p-10 backdrop-blur-xl" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-5xl h-[80vh] bg-[#0a0a0c] border border-white/5 rounded-[48px] shadow-2xl flex overflow-hidden">
        <div className="w-64 bg-discord-sidebar/50 border-r border-white/5 p-8 flex flex-col shrink-0">
           <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-10 flex items-center gap-2"><Settings size={20} className="text-vani-blue" /> {t('modals.realm_cfg')}</h2>
           <div className="space-y-2">
              <NavBtn label={t('modals.overview')} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Globe size={16} />} />
              <NavBtn label={t('modals.role_matrix')} active={activeTab === 'roles'} onClick={() => setActiveTab('roles')} icon={<Shield size={16} />} />
              <NavBtn label={t('modals.identity_list')} active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon={<Users size={16} />} />
              <NavBtn label="Channels" active={activeTab === 'channels'} onClick={() => setActiveTab('channels')} icon={<Hash size={16} />} />
              <NavBtn label="Invites" active={activeTab === 'invites'} onClick={() => setActiveTab('invites')} icon={<Link2 size={16} />} />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 relative bg-discord-dark/20">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{(t as any)('modals.protocol', { tab: activeTab })}</h3>
              <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-red-500 transition-all"><X size={20} /></button>
           </div>

           {activeTab === 'overview' && (
             <div className="space-y-10">
                <div className="relative mb-20">
                   <div className="h-40 bg-gray-900 rounded-[32px] overflow-hidden border border-white/5 group cursor-pointer" onClick={() => bannerRef.current?.click()}>
                      {bannerPreview ? <img src={bannerPreview} className="w-full h-full object-cover opacity-40" /> : <div className="w-full h-full bg-vani-gradient opacity-10" />}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><ImageIcon size={32} className="text-white" /></div>
                   </div>
                   <div className="absolute -bottom-12 left-10 p-1.5 bg-[#0a0a0c] rounded-[28px] group cursor-pointer" onClick={(e) => { e.stopPropagation(); iconRef.current?.click(); }}>
                      <div className="w-24 h-24 rounded-[24px] bg-gray-800 border-4 border-[#0a0a0c] overflow-hidden relative">
                         {iconPreview ? <img src={iconPreview} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-vani-gradient" />}
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40"><Camera size={24} className="text-white" /></div>
                      </div>
                   </div>
                </div>
                <div className="grid grid-cols-1 gap-6 pt-10">
                   <input className="w-full bg-[#050507] border border-gray-800 p-4 rounded-2xl text-white outline-none focus:border-vani-blue font-bold" value={name} onChange={(e) => setName(e.target.value)} />
                   <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-vani-blue font-black opacity-50">{t('modals.vanity_join')}</span><input className="w-full bg-[#050507] border border-gray-800 p-4 pl-14 rounded-2xl text-white outline-none focus:border-vani-blue font-mono text-sm" value={vanity} onChange={(e) => setVanity(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} /></div>
                   <button onClick={handleSaveOverview} className="bg-vani-gradient text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"><Save size={16} /> {t('modals.finalize_recalib')}</button>
                   
                   {realm.owner === (user?.id || user?._id) && !realm.isSystem && (
                     <div className="border-t border-white/5 pt-6 mt-4">
                        <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-[24px] flex items-center justify-between">
                           <div>
                              <div className="text-sm font-black text-red-500 uppercase tracking-tight">{t('modals.sov_purge')}</div>
                              <p className="text-[10px] text-gray-500 font-medium mt-1 max-w-xs">{t('modals.sov_purge_desc')}</p>
                           </div>
                           <button 
                             onClick={async () => {
                               if(confirm(t('modals.confirm_delete'))) {
                                 try { await api.deleteRealm(realm._id); window.location.reload(); } catch(e) { addToast(t('app.purge_failed'), 'error'); }
                               }
                             }} 
                             className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all"
                           >
                              {t('modals.delete_realm')}
                           </button>
                        </div>
                     </div>
                   )}
                </div>
                <input type="file" ref={iconRef} hidden onChange={(e) => { const f = e.target.files?.[0]; if(f){ setIconBlob(f); setIconPreview(URL.createObjectURL(f)); } }} />
                <input type="file" ref={bannerRef} hidden onChange={(e) => { const f = e.target.files?.[0]; if(f){ setBannerBlob(f); setBannerPreview(URL.createObjectURL(f)); } }} />
             </div>
           )}

           {activeTab === 'roles' && (
             <div className="space-y-6">
                <button onClick={handleCreateRole} className="w-full bg-white/5 border border-dashed border-gray-700 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:border-vani-blue transition-all"><UserPlus size={16} /> {t('modals.forge_authority')}</button>
                <div className="grid grid-cols-1 gap-3">
                   {(realm.roles || []).map(role => (
                               <div key={role._id} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl group">
                                    <div className="flex items-center justify-between mb-4">
                                       <div className="flex items-center space-x-4">
                                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                                           <span className="text-sm font-black text-white uppercase tracking-tight">{role.name}</span>
                                       </div>
                                       <button onClick={() => api.deleteRole(realm._id, role._id).then(onUpdate)} className="p-2 text-gray-600 hover:text-red-500 transition-all disabled:opacity-30" disabled={(role as any).isSystem}><Trash2 size={16} /></button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                       {permissionOptions.map((perm) => {
                                          const enabled = getRolePermissions(role).includes(perm);
                                          return (
                                             <button
                                                key={perm}
                                                onClick={() => toggleRolePermission(role, perm)}
                                                className={`px-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${enabled ? 'bg-vani-blue/20 border-vani-blue text-vani-blue' : 'bg-black/30 border-white/10 text-gray-500 hover:text-white'}`}
                                             >
                                                {perm.replace(/_/g, ' ')}
                                             </button>
                                          );
                                       })}
                                    </div>

                                    <button onClick={() => handleSaveRolePermissions(role)} className="mt-4 w-full bg-white/5 hover:bg-vani-blue/20 border border-white/10 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest">Save Permissions</button>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {activeTab === 'members' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(realm.members || []).map(member => (
                  <div key={member._id} className="bg-white/[0.02] border border-white/5 p-5 rounded-[24px] flex items-center justify-between">
                     <div className="flex items-center space-x-4">
                        <img src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} className="w-10 h-10 rounded-xl" />
                        <div><div className="text-xs font-black text-white uppercase">{member.username}</div><div className="text-[8px] font-mono text-gray-500 uppercase">{t('modals.identity_synced')}</div></div>
                     </div>
                     <select 
                       className="bg-black/40 text-[9px] font-black uppercase text-gray-400 border border-white/5 rounded-lg px-2 py-1 outline-none focus:border-vani-blue"
                       onChange={(e) => handleAssignRole(member._id || member.id, e.target.value)}
                       defaultValue={realm.memberRoles?.find(mr => (mr.user as any) === (member.id || member._id))?.roleId || ""}
                     >
                        <option value="">{t('modals.no_authority')}</option>
                        {(realm.roles || []).map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                     </select>
                  </div>
                ))}
             </div>
           )}

                {activeTab === 'channels' && (
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         {[
                            ['Categories', (realm.channels || []).filter(c => c.type === 'category').length],
                            ['Text', (realm.channels || []).filter(c => c.type === 'text').length],
                            ['Voice', (realm.channels || []).filter(c => c.type === 'voice').length],
                            ['Media+', (realm.channels || []).filter(c => ['media', 'gallery', 'matrix', 'feed', 'reels'].includes(c.type)).length]
                         ].map(([label, count]) => (
                            <div key={String(label)} className="bg-white/[0.02] border border-white/10 rounded-2xl p-4">
                               <div className="text-[9px] uppercase font-black tracking-widest text-gray-500">{label}</div>
                               <div className="text-2xl font-black text-white mt-1">{count}</div>
                            </div>
                         ))}
                      </div>
                      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 max-h-[360px] overflow-y-auto custom-scrollbar space-y-2">
                         {(realm.channels || []).map(c => (
                            <div key={c._id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/20">
                               <span className="text-xs font-bold text-white uppercase tracking-tight">{c.name}</span>
                               <span className="text-[9px] font-black text-vani-blue uppercase tracking-widest">{c.type}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {activeTab === 'invites' && (
                   <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                      <h4 className="text-sm font-black uppercase tracking-wider text-white mb-2">Invite Controls</h4>
                      <p className="text-xs text-gray-400 mb-4">Use the realm context menu Invite action to manage vanity/expiring invite links.</p>
                      <div className="text-[10px] font-mono text-gray-500 uppercase">This tab confirms invite system availability and keeps settings scope discoverable.</div>
                   </div>
                )}
        </div>
      </motion.div>
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

  const handleSubmit = async () => {
    if (!file) return addToast(t('modals.visual_required'), 'error');
    setLoading(true);
    const fd = new FormData();
    fd.append('caption', caption);
    fd.append('file', file);
    fd.append('channelId', channelId);
    fd.append('isPublic', String(isPublic));
    
    try {
      const res = await api.createPost(channelId, fd); 
      onComplete(res);
      onClose();
    } catch (e) { addToast(t('modals.broadcast_failed'), 'error'); }
    finally { setLoading(false); }
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

            <textarea 
              className="w-full bg-[#050507] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-vani-blue resize-none h-24 lg:h-32 custom-scrollbar text-sm"
              placeholder={t('modals.caption_placeholder')}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />

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
