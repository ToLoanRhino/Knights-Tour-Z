# Vercel Deployment Guide

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ToLoanRhino/Knights-Tour-Z)

## Environment Variables

Add these to Vercel Dashboard → Project Settings → Environment Variables:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0a72cf50CB2a02Ae8828Af79Db11C8B0CB5eFcCe
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_NETWORK_NAME=sepolia
NEXT_PUBLIC_RELAYER_URL=https://relayer.testnet.zama.org
```

## Manual Deployment Steps

### 1. Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import from GitHub: `ToLoanRhino/Knights-Tour-Z`

### 2. Configure Root Directory

**IMPORTANT:** Set Root Directory to `frontend`

```
Root Directory: frontend
```

### 3. Add Environment Variables

In Vercel Dashboard:
- Go to **Settings** → **Environment Variables**
- Add each variable from above
- Apply to: **Production**, **Preview**, **Development**

### 4. Deploy

Click **Deploy** button

## Build Settings

Framework: **Next.js**
- Build Command: `npm run build` (auto-detected)
- Output Directory: `.next` (auto-detected)
- Install Command: `npm install` (auto-detected)

## After Deployment

Your app will be live at:
```
https://knights-tour-z.vercel.app
```

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain
3. Follow DNS configuration steps

---

**Note:** Make sure the contract is deployed on Sepolia testnet before deploying frontend.

Contract Address: `0x0a72cf50CB2a02Ae8828Af79Db11C8B0CB5eFcCe`
