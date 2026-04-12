// File: api/get-images.js

export default async function handler(req, res) {
    const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

    const searchVibes = [
        'dark, minimalist, architecture, texture',
        'dark-abstract, dark-gradient',
        'dark-marble, liquid-metal, dark-stone',
        'astrophotography, nebula, deep-space',
        'night-sky, milky-way, dark-universe',
        'monochrome-landscape, midnight'
    ];
    const randomVibe = searchVibes[Math.floor(Math.random() * searchVibes.length)];

    try {
        const apiUrl = `https://api.unsplash.com/photos/random?query=${randomVibe}&orientation=landscape&count=30&client_id=${UNSPLASH_KEY}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error("Unsplash API limit reached");
        }
        
        const data = await response.json();
        res.status(200).json(data);
        
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
}
