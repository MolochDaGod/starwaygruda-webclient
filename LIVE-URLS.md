# 🚀 StarWayGRUDA — GRUDA Wars MMO · Live URLs

## ✅ UPDATED — March 2026

---

## 🌐 Production URL

```
https://starwaygruda-webclient-as2n.vercel.app
```

---

## 🎮 Route Map

### ⭐ 1. GRUDA Wars MMO (Primary)
```
https://starwaygruda-webclient-as2n.vercel.app/
https://starwaygruda-webclient-as2n.vercel.app/game
https://starwaygruda-webclient-as2n.vercel.app/play
```
All three routes serve `index-mmo.html`.

**Features (March 2026):**
- ✅ 5-step character creation wizard (Race → Class → Name → Avatar → Summary)
- ✅ 8-tab GRUDA Main Panel (`C` key) — Equipment, Skills, Professions, Crew, GOULD
- ✅ KayKit characters with 10 weapon types, 20-state animation machine
- ✅ 3-hit combo system with Mixamo FBX fallback
- ✅ Grudge Studio auth (login/guest/wallet) + offline fallbacks
- ✅ WoW-style Tab targeting, radial menu, skill bar, chat
- ✅ EnhancedCharacterController (capsule physics, first/third person)
- ✅ Gouldstone GOULD companion system (up to 15 AI clones)

**Controls:**
- `W` — Forward (camera-relative)
- `A`/`D` — Turn
- `Q`/`E` — Strafe
- `Space` — Jump
- `Shift` — Sprint
- `C` — GRUDA Main Panel
- `Tab` — Cycle targets
- `1–4` — Skills | `6–8` — Consumables
- `Z` — Battle cry (Z-key combat mechanic)
- `V` — Toggle view mode

---

### 🏗️ 2. Crafting Portal
```
https://starwaygruda-webclient-as2n.vercel.app/crafting
```
Inventory · Crafting Interface · Island Manager · AccountSync

---

### ⚙️ 3. Admin Dashboard
```
https://starwaygruda-webclient-as2n.vercel.app/admin
```

---

### 🚀 4. Space Flight
```
https://starwaygruda-webclient-as2n.vercel.app/index-space.html
```

---

### 🌌 5. Advanced Space / Ground Hybrid
```
https://starwaygruda-webclient-as2n.vercel.app/index.html
```

---

### 🏜️ 6. Planetary Ground Mode
```
https://starwaygruda-webclient-as2n.vercel.app/game.html
```

---

### 🌎 7. Landing / Game Selector
```
https://starwaygruda-webclient-as2n.vercel.app/index-landing.html
```

> ⚠️ `test-population.html` is **dev-only** and excluded from the production build.

---

## 📊 Build Info

**Build Date:** March 18, 2026  
**Build Time:** ~52s  
**Status:** ✅ SUCCESS (exit 0)  
**Modules:** 1,344 transformed  

**Files Built:**
- ✅ index-mmo.html (21.1 KB) — **PRIMARY**
- ✅ index.html (5.4 KB)
- ✅ index-space.html (8.1 KB)
- ✅ game.html (9.1 KB)
- ✅ index-landing.html (14.7 KB)
- ✅ crafting.html (1.2 KB) — **NEW**
- ✅ admin.html (29.0 KB)

**Key Chunks:**
- vendor-three.js: 759 KB (210 KB gzip)
- main-advanced.js: 490 KB (124 KB gzip)
- UIManager.js: 226 KB (41 KB gzip)
- vendor-monaco.js: 4,246 KB (Monaco TS workers — inherent)

---

## 🎯 Recommended User Flow

1. **Visit** → `starwaygruda-webclient-as2n.vercel.app`
2. **Login** → Grudge ID, guest, or wallet auth
3. **Create Character** → 5-step wizard (Race → Class → Name → Avatar → Summary)
4. **Enter World** → Loading screen (~10s)
5. **Play!** → `C` for Main Panel, `Tab` to target, `1–4` skills, `Z` battle cry

---

## 🔧 **TROUBLESHOOTING**

### Game Won't Load?
1. Hard refresh: `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)
2. Clear cache: `Ctrl + Shift + Delete`
3. Try incognito/private mode
4. Check browser console (F12) for errors

### Black Screen?
- Wait 15 seconds for assets to load
- Check WebGL 2.0 support: visit https://get.webgl.org/webgl2/
- Try Chrome or Firefox

### Controls Don't Work?
- Click the canvas to lock mouse pointer
- Make sure character creation is complete
- Press `H` for help

### Can't See Buildings?
- Teleport to center: `/tp 0 30 0` in chat
- Use minimap (bottom-right) to navigate
- Sprint towards buildings with `SHIFT`

---

## 📱 **BROWSER REQUIREMENTS**

✅ **Supported:**
- Chrome 90+
- Firefox 88+
- Edge 90+

❌ **Not Supported:**
- Internet Explorer
- Safari (limited WebGL 2.0)
- Mobile browsers (coming soon)

---

## 🎊 Deployment Status

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✅ LIVE | GRUDA Wars MMO |
| `/crafting` | ✅ LIVE | Crafting Portal (new) |
| `/admin` | ✅ LIVE | Admin Dashboard |
| `/game` `/play` | ✅ LIVE | Alias → `/` |
| `/index-space.html` | ✅ LIVE | Space Flight |
| `/index-landing.html` | ✅ LIVE | Game Selector |
| `test-population.html` | ❌ DEV ONLY | Excluded from prod build |

**All production routes operational!** 🚀

---

## 🔗 Share Link

Send this to players:
```
https://starwaygruda-webclient-as2n.vercel.app
```

---

## 💡 Pro Tips

1. **`C` key** — Opens the 8-tab GRUDA Main Panel
2. **`Tab`** — Cycles through nearby targets (WoW-style)
3. **`Z` key** — Battle cry — stacks buffs with combat
4. **Sprint** — Hold `Shift` for 2x speed
5. **Crafting Portal** — Visit `/crafting` for island + inventory
6. **Offline Mode** — Works without backend; guest account auto-creates
7. **`V` key** — Toggle first/third person view

---

## 📞 **SUPPORT**

If you encounter issues:
1. Check browser console (F12)
2. Verify WebGL 2.0 support
3. Try different browser
4. Clear cache and reload

---

**Last Updated:** March 18, 2026  
**Deployment:** Production  
**Status:** ✅ FULLY OPERATIONAL  
**Version:** 3.0 — GRUDA Wars · Weapon System · Character Overhaul

Co-Authored-By: Oz <oz-agent@warp.dev>
