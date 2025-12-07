<div align="center">
  <img src="public/icon/project-initiation (1).png" alt="CleanSite Builder" width="80" height="80">
  <h1>CleanSite Builder</h1>
  <p><strong>AI-Powered Website Builder</strong></p>
  
  ![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)
  ![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?logo=supabase)
  ![Status](https://img.shields.io/badge/Status-In%20Development-yellow)
</div>

---

## ✨ Features

- 🤖 **AI Website Generation** - Describe your site, AI builds it instantly
- 📝 **Live Editing** - Edit and update websites with natural language prompts
- 📱 **Responsive Preview** - Desktop, tablet, and mobile viewport switching
- 🚀 **One-Click Deploy** - Deploy to Netlify with custom domain support
- 🎨 **Modern UI** - Built with Tailwind CSS, Bootstrap, and animations
- 🔐 **User Auth** - Secure authentication via Supabase

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| AI | DeepSeek API |
| Database | Supabase |
| Styling | Tailwind CSS + Bootstrap |
| Deployment | Netlify |
| Animations | Framer Motion, AOS, Animate.css |

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/Azan80/cleansitebuilder.git
cd cleansitebuilder

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
# Add your API keys to .env.local

# Run development server
yarn dev
```

## ⚙️ Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DEEPSEEK_API_KEY=your_deepseek_api_key
NETLIFY_ACCESS_TOKEN=your_netlify_token
```

## 📂 Project Structure

```
src/
├── app/
│   ├── builder/        # Dashboard & Editor
│   ├── actions/        # Server Actions (AI, Deploy, Projects)
│   └── (auth)/         # Login, Signup, Password Reset
├── components/         # Reusable UI Components
├── landingpage/        # Landing Page Sections
└── utils/              # Supabase Client
```

## 📋 Current Status

- [x] AI Website Generation
- [x] Multi-page Support
- [x] Live Preview with Sandpack
- [x] Netlify Deployment
- [x] Custom Domain Support
- [x] Website Thumbnail Previews
- [ ] Template Gallery
- [ ] Team Collaboration

## 📄 License

MIT © 2025 CleanSite Builder

---

<div align="center">
  <sub>Built with ❤️ using Next.js and AI</sub>
</div>
