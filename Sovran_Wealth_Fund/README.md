# Sovran Wealth Fund

[![Build & Deploy](https://github.com/Promote76/Sovran_Wealth_Fund/actions/workflows/deploy.yml/badge.svg)](https://github.com/Promote76/Sovran_Wealth_Fund/actions)  
![Docker](https://img.shields.io/badge/Docker-ready-blue)  
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)  
![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen)  

A Web3-powered wealth management and real estate investment portal built for the **Sovran Wealth Fund (SWF)** ecosystem.  
This app connects directly with the **peaq network** and integrates with **DeNet Datakeeper Nodes** for decentralized storage and proof-of-ownership.

---

## ✨ Features

- 🔐 **Wallet Integration** – Connect with MetaMask / WalletConnect  
- 📊 **Investor Dashboard** – Track contributions, rewards, and staking balances  
- 🗄️ **Sovereign Vaults** – Store documents via DeNet nodes with on-chain proofs  
- 🏗️ **Real Estate Tokenization** – Fractionalized property ownership with SWF tokens  
- 🌐 **Decentralized Governance** – Proposals and voting tied to token/NFT ownership  

---

## ⚙️ Requirements

- **Node.js** 20+  
- **Docker** & **Docker Compose** (recommended for deployment)  
- **Git** for version control  
- A **peaq wallet** holding a **Datakeeper License NFT** (to run storage nodes)  
- A **domain name** (e.g., `app.yourdomain.com`) pointing to your server  

---

## 💻 Local Development

Clone the repo and install dependencies:

```bash
git clone https://github.com/Promote76/Sovran_Wealth_Fund.git
cd Sovran_Wealth_Fund
npm install
npm run dev
