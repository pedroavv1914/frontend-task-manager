import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

type ProfileData = {
  name: string;
  email: string;
  avatar: string;
  bio: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

import { Navigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, updateProfile, updatePassword } = useAuth();

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=3b82f6&color=fff`,
    bio: user?.bio || 'Desenvolvedor apaixonado por criar soluções incríveis.',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || '')}&background=3b82f6&color=fff`,
        bio: user.bio || prev.bio
      }));
    }
  }, [user]);

  // Handlers
  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setProfileData(prev => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
      avatar: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=3b82f6&color=fff`,
      bio: user?.bio || 'Desenvolvedor apaixonado por criar soluções incríveis.',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile({
        name: profileData.name,
        bio: profileData.bio,
        avatar: profileData.avatar
      });
      toast.success('Perfil atualizado!');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.newPassword || profileData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setIsLoading(true);
    try {
      await updatePassword(profileData.currentPassword, profileData.newPassword);
      toast.success('Senha alterada com sucesso!');
      setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      {/* Header do perfil */}
      <div className="relative flex flex-col items-center bg-gradient-to-r from-sky-400/80 to-indigo-700/80 rounded-3xl shadow-xl p-8 pb-16 mb-12">
        <div className="absolute top-4 right-4">
          <span className="bg-yellow-400 text-gray-900 font-bold px-3 py-1 rounded text-xs shadow">ADMIN</span>
        </div>
        <img
          src={profileData.avatar}
          alt={profileData.name}
          className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover mb-4 bg-white"
        />
        <h2 className="text-3xl font-bold text-white drop-shadow mb-1">{profileData.name}</h2>
        <span className="text-white/80 text-lg mb-2">{profileData.email}</span>
        <p className="text-white/90 italic text-center max-w-md mb-2">{profileData.bio}</p>
        <div className="flex gap-2 mt-2">
          <button
            className="px-5 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all shadow"
            onClick={handleEdit}
            disabled={isEditing}
          >
            Editar Perfil
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          className={`px-4 py-2 rounded-t-lg font-bold transition-all ${activeTab === 'profile' ? 'bg-sky-500/80 text-white shadow' : 'bg-white/20 text-gray-800 dark:text-white/60'}`}
          onClick={() => setActiveTab('profile')}
        >
          Dados do Perfil
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-bold transition-all ${activeTab === 'security' ? 'bg-sky-500/80 text-white shadow' : 'bg-white/20 text-gray-800 dark:text-white/60'}`}
          onClick={() => setActiveTab('security')}
        >
          Segurança
        </button>
      </div>

      {/* Conteúdo dos tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <img
                src={profileData.avatar}
                alt={profileData.name}
                className="w-20 h-20 rounded-full border-2 border-sky-400 object-cover bg-white"
              />
              <div className="flex-1">
                <label className="font-semibold text-gray-700 dark:text-white block mb-1">Nome</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={profileData.name}
                  onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>
            <div>
              <label className="font-semibold text-gray-700 dark:text-white block mb-1">Bio</label>
              <textarea
                className="w-full px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                value={profileData.bio}
                onChange={e => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                disabled={!isEditing}
              />
            </div>
            <div className="flex justify-end gap-2">
              {isEditing && (
                <>
                  <button
                    type="button"
                    className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-700 transition shadow"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                </>
              )}
            </div>
          </form>
        )}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSave} className="space-y-6">
            <div>
              <label className="font-semibold text-gray-700 dark:text-white block mb-1">Senha Atual</label>
              <input
                type="password"
                className="w-full px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                value={profileData.currentPassword}
                onChange={e => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700 dark:text-white block mb-1">Nova Senha</label>
              <input
                type="password"
                className="w-full px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                value={profileData.newPassword}
                onChange={e => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700 dark:text-white block mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                className="w-full px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                value={profileData.confirmPassword}
                onChange={e => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-sky-600 text-white font-bold hover:bg-sky-700 transition shadow"
                disabled={isLoading}
              >
                {isLoading ? 'Salvando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

