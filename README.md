# 💧 Kudineer – Water Meter Reading Tracker

A **premium mobile-first PWA** for tracking water meter readings and calculating consumption for **Punjai Thalavaipalayam CWSS 138/238**.

## Features
- 📊 **Yearly Summary** – mirrors the "2026 Average" index sheet from your Excel workbook
- 📋 **Monthly Sheet** – Excel-like daily table with **MLD / Litres toggle**
- ✏️ **Admin Entry** – PIN-protected, enter all-meter readings for any date
- 📈 **Insights** – Monthly consumption bar chart + meter-wise doughnut
- ⚙️ **Settings** – theme toggle, PIN change, CSV export, sample data
- 🌓 Dark / Light mode
- 📱 Mobile-first PWA (installable on Android)
- 🔌 Offline-first (localStorage)

## Stack
- **Vite** (vanilla JS, ES modules)
- **Chart.js** (npm, tree-shaken)
- **Vanilla CSS** (custom design system, HSL tokens)

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build → dist/
npm run preview  # preview production build
```

## Default Admin PIN
`1234` — change it in Settings

## Live Demo
Deployed via **GitHub Pages** (see Actions tab for status).
