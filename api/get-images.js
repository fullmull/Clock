export default async function handler(req, res) {
    try {
        const searchVibes = [
            'colorful abstract gradient',
            'minimalist pastel gradient',
            'vibrant fluid liquid abstract',
            'colorful nebula deep space',
            'vibrant galaxy cosmos',
            'neon light gradient blur'
        ];

        const randomVibe = searchVibes[Math.floor(Math.random() * searchVibes.length)];
        const query = encodeURIComponent(randomVibe);
        const apiKey = process.env.PIXABAY_API_KEY;
        
        const response = await fetch(`https://pixabay.com/api/?key=${apiKey}&q=${query}&image_type=photo&orientation=vertical&per_page=30&safesearch=true`);
        
        if (!response.ok) throw new Error();
        
        const data = await response.json();
        res.status(200).json(data.hits);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch images' });
    }
}
