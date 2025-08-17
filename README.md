# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/befbcb62-29e9-4466-bcdf-92bd2fd65325

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/befbcb62-29e9-4466-bcdf-92bd2fd65325) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

**Recommended Node.js version**: v22.15.0 (tested and working)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## 🚀 Управление версиями

### Команды релиза:

- `npm run release:fix` - исправления багов (1.2.0 → 1.2.1)
- `npm run release:feature` - новые функции (1.2.0 → 1.3.0)  
- `npm run release:breaking` - кардинальные изменения (1.2.0 → 2.0.0)
- `npm run release:info` - показать доступные команды релиза

### Как работают команды:

1. **Автоматически увеличивают версию** в package.json
2. **Создают git commit** с сообщением о новой версии
3. **Создают git tag** (например v1.3.0)
4. **Отправляют изменения** в репозиторий (git push)

### Пример использования:

```bash
# Посмотреть доступные команды
npm run release:info

# Исправить баг и выпустить патч (1.2.0 → 1.2.1)
npm run release:fix

# Добавить новую функцию (1.2.0 → 1.3.0)
npm run release:feature

# Кардинальные изменения (1.2.0 → 2.0.0)
npm run release:breaking
```

**⚠️ Важно:** Все изменения должны быть закоммичены перед выполнением команд релиза.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/befbcb62-29e9-4466-bcdf-92bd2fd65325) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
