# Gerenciador de Tarefas - Frontend

Aplicativo web moderno para gerenciamento de tarefas, construído com React, TypeScript, Vite e Tailwind CSS.

## 🚀 Tecnologias

- [React](https://reactjs.org/) - Biblioteca JavaScript para construir interfaces de usuário
- [TypeScript](https://www.typescriptlang.org/) - JavaScript tipado
- [Vite](https://vitejs.dev/) - Ferramenta de build rápida
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitário
- [React Router](https://reactrouter.com/) - Roteamento para React
- [React Query](https://tanstack.com/query) - Gerenciamento de estado do servidor
- [Zustand](https://github.com/pmndrs/zustand) - Gerenciamento de estado global
- [React Hook Form](https://react-hook-form.com/) - Validação de formulários
- [date-fns](https://date-fns.org/) - Manipulação de datas
- [React Hot Toast](https://react-hot-toast.com/) - Notificações

## 🛠️ Configuração do Ambiente

1. **Pré-requisitos**
   - Node.js (versão 18 ou superior)
   - npm (versão 9 ou superior) ou Yarn (versão 1.22 ou superior)
   - Git

2. **Instalação**
   ```bash
   # Clone o repositório
   git clone [URL_DO_REPOSITORIO]
   
   # Instale as dependências
   npm install
   
   # Ou com Yarn
   # yarn install
   ```

3. **Variáveis de Ambiente**
   - Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`
   - Configure a URL da API e outras variáveis necessárias

4. **Executando o Projeto**
   ```bash
   # Modo de desenvolvimento
   npm run dev
   
   # Ou com Yarn
   # yarn dev
   ```
   
   O aplicativo estará disponível em [http://localhost:3000](http://localhost:3000)

5. **Build para Produção**
   ```bash
   # Build para produção
   npm run build
   
   # Visualizar build de produção localmente
   npm run preview
   ```

## 🗂 Estrutura do Projeto

```
src/
├── assets/           # Arquivos estáticos (imagens, fontes, etc.)
├── components/       # Componentes reutilizáveis
├── context/          # Contextos do React
├── features/         # Funcionalidades da aplicação
├── hooks/            # Hooks personalizados
├── layouts/          # Layouts da aplicação
├── lib/              # Bibliotecas e utilitários
├── pages/            # Páginas da aplicação
├── services/         # Serviços de API
├── types/            # Tipos TypeScript
└── utils/            # Utilitários
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar testes em modo watch
npm test -- --watch
```

## 🛡️ Padrões de Código

- **ESLint**: Para linting de código
- **Prettier**: Para formatação de código
- **Husky**: Para git hooks
- **Commitlint**: Para mensagens de commit padronizadas

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Dê push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Desenvolvido com ❤️ por [Seu Nome](https://github.com/seu-usuario)
```
