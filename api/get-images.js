export default async function handler(req, res) {
    try {
        const searchVibes = [
            'abstract dark texture',
            'minimalist geometric',
            'fluid liquid macro',
            'nebula cosmos deep space',
            'cinematic moody atmospheric',
            'dark gradient blur',
            'aesthetic wallpaper'
        ];

        const randomVibe = searchVibes[Math.floor(Math.random() * searchVibes.length)];
        const query = encodeURIComponent(randomVibe);
        const apiKey = process.env.PIXABAY_API_KEY;
        const randomPage = Math.floor(Math.random() * 8) + 1;
        
        const response = await fetch(`https://pixabay.com/api/?key=${apiKey}&q=${query}&image_type=photo&orientation=vertical&per_page=30&page=${randomPage}&safesearch=true`);
        
        if (!response.ok) throw new Error();
        
        const data = await response.json();
        res.status(200).json(data.hits);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch images' });
    }
}
