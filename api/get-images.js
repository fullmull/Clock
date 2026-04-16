export default async function handler(req, res) {
    try {
        const { orientation = 'vertical' } = req.query;
        
        const searchVibes = [
            'landscape scenic',
            'modern architecture',
            'cityscape night',
            'minimalist building',
            'mountain nature',
            'dark forest',
            'urban geometry',
            'aesthetic wallpaper'
        ];

        const negativeKeywords = '-person -people -face -portrait -clothes -fashion -woman -man';
        const randomVibe = searchVibes[Math.floor(Math.random() * searchVibes.length)];
        const query = encodeURIComponent(`${randomVibe} ${negativeKeywords}`);
        
        const apiKey = process.env.PIXABAY_API_KEY;
        const randomPage = Math.floor(Math.random() * 8) + 1;
        
        const response = await fetch(`https://pixabay.com/api/?key=${apiKey}&q=${query}&image_type=photo&orientation=${orientation}&per_page=30&page=${randomPage}&safesearch=true`);
        
        if (!response.ok) throw new Error();
        
        const data = await response.json();
        res.status(200).json(data.hits);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch images' });
    }
}