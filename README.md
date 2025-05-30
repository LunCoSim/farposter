# 🌙 Farpost - Lunar Mining Game

A multiplayer lunar resource extraction game built for Farcaster with Supabase backend and Netlify hosting.

## 🎮 Game Overview

Farpost is an engaging lunar mining simulation where players:
- Manage lunar territory through a hexagonal grid system
- Deploy expeditions to extract valuable resources
- Upgrade operations with powerful boosters
- Progress through levels to unlock advanced resources
- Build a thriving lunar colony

## ��️ Architecture

### ✨ **New Modular Architecture** (2025)

The game has been completely refactored from a monolithic design to a modern, modular architecture:

```
js/core/
├── GameStateManager.js    # State management & validation
├── ResourceManager.js     # Resource extraction & boosters  
├── UIController.js        # UI updates & interactions
└── GameEngine.js          # Main coordinator & public API
```

**Benefits:**
- 🔧 **Maintainable**: Clear separation of concerns
- 🧪 **Testable**: Individual module testing capabilities
- 📈 **Scalable**: Easy to add new features
- ⚡ **Performance**: Optimized update cycles
- 🐛 **Debuggable**: Better error tracking and logging

### Frontend
- **Modular JavaScript Architecture** - Event-driven components with clear boundaries
- **HTML5/CSS3** - Pure web technologies for maximum compatibility
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Real-time Updates** - Live progress tracking and animations
- **Event System** - Loose coupling via reactive updates

### Backend
- **Supabase** - PostgreSQL database with real-time capabilities
- **Netlify Functions** - Serverless API endpoints
- **Row Level Security** - Secure user data isolation
- **JWT Authentication** - Secure user sessions

### Infrastructure
- **Netlify** - Static hosting with global CDN
- **GitHub** - Version control and CI/CD
- **Custom Domain** - Professional deployment ready

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Supabase account
- Netlify account

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd farposter
   npm install
   ```

2. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Get your API keys from Settings > API

3. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Update configuration**
   - Edit `js/config.js` with your Supabase URL and keys

5. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:8888` to play the game locally.

## 📖 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy to Netlify

1. Push code to GitHub
2. Connect repository to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy automatically

## 🎯 Game Features

### Resource Management
- **10 Unique Resources** - From Lunar Regolith to Helium-3
- **Dynamic Pricing** - Resources have different values and extraction times
- **Progressive Unlocks** - Advanced resources unlock with player level

### Territory System
- **Hexagonal Grid** - 18 cells of lunar territory
- **Cell Progression** - Purchase and upgrade individual cells
- **Visual Feedback** - Real-time extraction progress and status

### Booster System
- **5 Booster Types** - Speed up extraction operations
- **Strategic Application** - Use on specific cells or globally
- **Resource Optimization** - Plan boosters for maximum efficiency

### Progression
- **Level System** - Gain XP and unlock new content
- **Expeditions** - Purchase and deploy resource extraction missions
- **Economic Growth** - Build wealth through smart resource management

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in existing user
- `POST /api/auth/signout` - Sign out current user

### Game State
- `GET /api/game-state` - Load complete game state
- `PUT /api/game-state` - Save game state updates

### Game Actions
- `POST /api/game-actions` - Execute game actions:
  - `purchase_expedition` - Buy expedition equipment
  - `purchase_booster` - Buy performance boosters
  - `purchase_cell` - Expand territory
  - `deploy_expedition` - Start resource extraction
  - `collect_resource` - Harvest completed extractions
  - `sell_resources` - Convert resources to points
  - `apply_booster` - Activate speed boosters

## 🗄️ Database Schema

### Core Tables
- `player_profiles` - User progression and stats
- `game_cells` - Territory ownership and status
- `player_resources` - Resource inventory
- `player_expeditions` - Expedition equipment
- `player_boosters` - Booster inventory
- `game_sessions` - Analytics and tracking

### Security
- Row Level Security (RLS) enabled on all tables
- JWT-based authentication
- User isolation through database policies

## 🎨 Tech Stack

### Frontend Technologies
- **Vanilla JavaScript** - No frameworks, pure performance
- **CSS Grid & Flexbox** - Modern responsive layouts
- **CSS Animations** - Smooth UI transitions
- **Local Storage Fallback** - Offline capability

### Backend Technologies
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Robust relational database
- **Netlify Functions** - Serverless compute
- **Node.js** - Server-side JavaScript

### Development Tools
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Git Hooks** - Pre-commit validation

## 🔐 Security Features

- **Authentication Required** - All game actions require valid JWT
- **Input Validation** - Server-side validation of all actions
- **Rate Limiting** - Prevent abuse of game mechanics
- **CORS Protection** - Restrict cross-origin requests
- **SQL Injection Prevention** - Parameterized queries only

## 🌟 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📊 Monitoring

### Analytics
- Player engagement metrics
- Resource extraction patterns
- Level progression tracking
- Economic balance monitoring

### Error Tracking
- Client-side error capture
- Server function monitoring
- Database performance metrics
- User feedback collection

## 🔮 Future Enhancements

### Multiplayer Features
- **Resource Trading** - Player-to-player commerce
- **Alliances** - Cooperative gameplay
- **Competitions** - Leaderboards and tournaments
- **Real-time Chat** - Community interaction

### Advanced Mechanics
- **Territory Wars** - Competitive cell claiming
- **Research Tree** - Technology progression
- **Market Dynamics** - Supply/demand pricing
- **Special Events** - Limited-time challenges

### Technical Improvements
- **Progressive Web App** - Mobile app-like experience
- **Offline Mode** - Play without internet
- **Push Notifications** - Extraction completion alerts
- **Social Integration** - Share achievements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

## 🙏 Acknowledgments

- **Supabase Team** - Amazing backend platform
- **Netlify Team** - Excellent hosting solution
- **Farcaster Community** - Inspiration and support
- **Open Source Contributors** - Various libraries and tools

---

**Ready to mine the moon?** 🚀 Deploy your own instance and start extracting lunar resources today!
