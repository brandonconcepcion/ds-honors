# Deployment Guide

This is a static website that can be deployed to various platforms. Here are the recommended options:

## Option 1: GitHub Pages (Recommended - Free & Easy)

Since this is already a GitHub repository, GitHub Pages is the simplest option.

### Steps:

1. **Push your code to GitHub** (if not already done):

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin master
   ```

2. **Enable GitHub Pages**:

   - Go to your repository on GitHub
   - Click on **Settings** tab
   - Scroll down to **Pages** section (in the left sidebar)
   - Under **Source**, select **Deploy from a branch**
   - Choose **master** (or **main**) branch
   - Select **/ (root)** folder
   - Click **Save**

3. **Your site will be live at**:

   ```
   https://[your-username].github.io/ds-honors/
   ```

4. **Custom domain** (optional):
   - In the same Pages settings, you can add a custom domain

### Notes:

- Changes pushed to the master branch will automatically update the site
- It may take a few minutes for changes to go live
- The site will be publicly accessible

---

## Option 2: Netlify (Free - Drag & Drop)

1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Drag and drop your entire project folder onto Netlify's dashboard
3. Your site will be live immediately with a URL like: `https://random-name.netlify.app`
4. For Git integration: Connect your GitHub repo for automatic deployments

---

## Option 3: Vercel (Free)

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a static site
5. Click "Deploy"
6. Your site will be live with a URL like: `https://ds-honors.vercel.app`

---

## Option 4: Cloudflare Pages (Free)

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Sign up/login
3. Connect your GitHub repository
4. Select the repository and branch
5. Build settings: Leave blank (no build command needed)
6. Deploy!

---

## Quick Deploy Commands

### Using Surge.sh (Command Line)

```bash
npm install -g surge
surge
# Follow prompts to deploy
```

### Using Netlify CLI

```bash
npm install -g netlify-cli
netlify deploy --prod
```

---

## Testing Locally Before Deploying

Before deploying, test your site locally:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Then visit http://localhost:8000
```

---

## Troubleshooting

- **Images not loading?** Make sure all image paths are relative (e.g., `images/food-delivery/diagram.png`)
- **404 errors?** Ensure `index.html` is in the root directory
- **JavaScript errors?** Check browser console for any issues
- **GitHub Pages not updating?** Wait 5-10 minutes, or check the Actions tab for build status
