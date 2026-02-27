# Route-Based Separation

```
http://localhost:3000/          → Redirects to /user
http://localhost:3000/user      → Regular user interface
http://localhost:3000/admin     → Admin-only interface
```

## How to Use

### For Development/Testing

1. Start your dev server: `npm run dev`
2. Visit `http://localhost:3000` (redirects to `/user`)
3. Click the **"Switch to Admin View"** button (bottom-right corner)
4. Or directly visit `http://localhost:3000/admin`
5. Switch back anytime with the floating button