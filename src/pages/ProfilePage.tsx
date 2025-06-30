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

const ProfilePage = () => {
  const { user, updateProfile, updatePassword } = useAuth();
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

  useEffect(() => {
    // Simulando carregamento dos dados do perfil
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        // Simulando uma chamada à API
        // const response = await fetch('/api/profile');
        // const data = await response.json();
        // setProfileData(prev => ({
        //   ...prev,
        //   ...data,
        //   avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=3b82f6&color=fff`
        // }));
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        toast.error('Não foi possível carregar o perfil');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verifica se o arquivo é uma imagem
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido');
      return;
    }

    // Verifica o tamanho do arquivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('A imagem não pode ser maior que 5MB');
      return;
    }

    try {
      // Aqui você pode implementar o upload real para um servidor
      // Por enquanto, vamos apenas criar uma URL local para visualização
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileData(prev => ({
          ...prev,
          avatar: base64String
        }));
      };
      reader.readAsDataURL(file);
      
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Erro ao processar a imagem:', error);
      toast.error('Erro ao processar a imagem');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // Atualiza o perfil usando a função do AuthContext
      await updateProfile({
        name: profileData.name,
        email: profileData.email,
        bio: profileData.bio,
        avatar: profileData.avatar
      });
      
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast.error('As senhas não conferem');
      return;
    }

    try {
      setIsLoading(true);
      
      // Atualiza a senha usando a função do AuthContext
      await updatePassword(profileData.currentPassword, profileData.newPassword);
      
      toast.success('Senha alterada com sucesso!');
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error(error instanceof Error ? error.message : 'Não foi possível alterar a senha');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
              Meu Perfil
            </h2>
          </div>
        </div>

        <div className="mt-6">
          {/* Abas */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Perfil
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`${
                  activeTab === 'security'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Segurança
              </button>
            </nav>
          </div>

          {/* Conteúdo das abas */}
          <div className="mt-8">
            {activeTab === 'profile' ? (
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Informações do Perfil
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                    Atualize suas informações pessoais.
                  </p>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
                  <form onSubmit={handleProfileSubmit}>
                    <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 dark:sm:border-gray-700 sm:pt-5 sm:px-6 sm:py-5">
                      <label htmlFor="photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 sm:mt-px sm:pt-2">
                        Foto
                      </label>
                      <div className="mt-1 sm:mt-0 sm:col-span-2">
                        <div className="flex items-center">
                          <span className="h-12 w-12 rounded-full overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center">
                            {profileData.avatar ? (
                              <img
                                className="h-full w-full object-cover"
                                src={profileData.avatar}
                                alt=""
                              />
                            ) : (
                              <span className="text-gray-500 text-lg font-medium">
                                {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                              </span>
                            )}
                          </span>
                          {isEditing && (
                            <div className="ml-5">
                              <input
                                type="file"
                                id="avatar-upload"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarChange}
                              />
                              <label
                                htmlFor="avatar-upload"
                                className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Alterar
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 dark:sm:border-gray-700 sm:pt-5 sm:px-6 sm:py-5">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 sm:mt-px sm:pt-2">
                        Nome
                      </label>
                      <div className="mt-1 sm:mt-0 sm:col-span-2">
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={profileData.name}
                            onChange={handleInputChange}
                            className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white">{profileData.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 dark:sm:border-gray-700 sm:pt-5 sm:px-6 sm:py-5">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 sm:mt-px sm:pt-2">
                        Email
                      </label>
                      <div className="mt-1 sm:mt-0 sm:col-span-2">
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={profileData.email}
                            onChange={handleInputChange}
                            className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white">{profileData.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-b sm:border-gray-200 dark:sm:border-gray-700 sm:pt-5 sm:px-6 sm:pb-5">
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 sm:mt-px sm:pt-2">
                        Bio
                      </label>
                      <div className="mt-1 sm:mt-0 sm:col-span-2">
                        {isEditing ? (
                          <textarea
                            id="bio"
                            name="bio"
                            rows={3}
                            className="max-w-lg shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                            value={profileData.bio}
                            onChange={handleInputChange}
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white">{profileData.bio}</p>
                        )}
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Escreva algumas frases sobre você.
                        </p>
                      </div>
                    </div>

                    <div className="pt-5">
                      <div className="flex justify-end px-6 pb-6">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setIsEditing(false)}
                              className="bg-white py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLoading ? 'Salvando...' : 'Salvar'}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Configurações de Segurança
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                    Atualize sua senha e configure a autenticação de dois fatores.
                  </p>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 dark:sm:border-gray-700 sm:pt-5 sm:px-6 sm:py-5">
                      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 sm:mt-px sm:pt-2">
                        Senha Atual
                      </label>
                      <div className="mt-1 sm:mt-0 sm:col-span-2">
                        <input
                          id="current-password"
                          name="currentPassword"
                          type="password"
                          autoComplete="current-password"
                          value={profileData.currentPassword}
                          onChange={handleInputChange}
                          className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                        />
                      </div>
                    </div>

                    <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 dark:sm:border-gray-700 sm:pt-5 sm:px-6 sm:py-5">
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 sm:mt-px sm:pt-2">
                        Nova Senha
                      </label>
                      <div className="mt-1 sm:mt-0 sm:col-span-2">
                        <input
                          id="new-password"
                          name="newPassword"
                          type="password"
                          autoComplete="new-password"
                          value={profileData.newPassword}
                          onChange={handleInputChange}
                          className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                        />
                      </div>
                    </div>

                    <div className="mt-6 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-b sm:border-gray-200 dark:sm:border-gray-700 sm:pt-5 sm:px-6 sm:pb-5">
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 sm:mt-px sm:pt-2">
                        Confirmar Nova Senha
                      </label>
                      <div className="mt-1 sm:mt-0 sm:col-span-2">
                        <input
                          id="confirm-password"
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          value={profileData.confirmPassword}
                          onChange={handleInputChange}
                          className="max-w-lg block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:max-w-xs sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                        />
                      </div>
                    </div>

                    <div className="pt-5">
                      <div className="flex justify-end px-6 pb-6">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Salvando...' : 'Alterar Senha'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
