// File: api/get-images.js

export default async function handler(req, res) {
    // This file runs securely on Vercel's backend servers, NOT in the user's browser.
    // It pulls your secret key from Vercel's secure vault.
    const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
    const SEARCH_TERMS = 'dark,minimalist,architecture,texture';

    try {
        const response = await fetch(`https://api.unsplash.com/photos/random?query=${SEARCH_TERMS}&orientation=landscape&count=30&client_id=${UNSPLASH_KEY}`);
        
        if (!response.ok) throw new Error("Unsplash API limit reached");
        
        const data = await response.json();
        
        // Send the data back to your frontend
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch images' });
    }
}
