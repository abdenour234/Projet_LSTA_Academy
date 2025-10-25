# Landing Page Images Setup

## Required Images

You need to add 2 images to the `frontend/public/` folder:

### 1. **logo.png** - LSTA Academy Logo
- Location: `frontend/public/logo.png`
- Recommended size: 200x60 pixels (or similar aspect ratio)
- Format: PNG with transparent background
- This will appear in the header navigation

### 2. **image.png** - Hero Section Illustration  
- Location: `frontend/public/image.png`
- Recommended size: 800x600 pixels (or larger for high-res displays)
- Format: PNG or JPG
- This is the main illustration showing students learning (like in your reference image)

## How to Add the Images

1. Place both image files in the `frontend/public/` folder
2. Make sure the filenames match exactly: `logo.png` and `image.png`
3. The frontend will automatically find them at the root of the public folder

## Fallback Behavior

If the images are not found:
- **logo.png**: The text "LSTA ACADEMY" will be displayed instead
- **image.png**: A placeholder SVG will be shown with text "Image will be here"

## Testing

After adding the images, navigate to http://localhost/ to see the new landing page!

## Colors Used

The landing page uses the LSTA Academy brand color:
- Primary Blue: `#0B5F7F`
- Light Blue accent: `#B8E6F5`
- White background with subtle gradients

## Navigation Features

- **Connexion** button → Always goes to login page
- **Mon espace** button → Goes to dashboard if logged in, otherwise to login page
- **Méthode, Espace, Clubs, Contact** → Show "Under Construction" pages
- Old schools directory → Now at `/schools` route
