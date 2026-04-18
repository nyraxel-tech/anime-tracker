export default async function handler(req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const res = await fetch("https://animeheaven.me/new.php", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://animeheaven.me/",
      },
    });

    if (!res.ok) throw new Error(`AH returned ${res.status}`);
    const html = await res.text();

    // Parse anime entries from the HTML
    const animes = [];
    
    // Match pattern: image URL, title, episode count, time ago
    const blockRegex = /image\.php\?(\w+)[\s\S]*?anime\.php\?(\w+)[^>]*>\s*[\s\S]*?<\/a>\s*(?:[\s\S]*?add\.svg[\s\S]*?)(\d+)\s*\n[\s\S]*?\[([^\]]+)\]([\s\S]*?)(\d+\s*(?:h|d)\s*ago)/g;

    // Simpler targeted regex — extract each card
    const cardRegex = /\[([^\]]+)\]\(https:\/\/animeheaven\.me\/image\.php\?(\w+)\)\s*\n\n(\d+)\]\(https:\/\/animeheaven\.me\/anime\.php\?(\w+)\)[\s\S]*?\[([^\]]+)\]\(https:\/\/animeheaven\.me\/anime\.php\?\w+\)\s*\n\n([^\n]+)\n\n(\d+[^\n]+ago)/g;

    // Use a line-by-line approach on the raw HTML instead
    // Extract all anime.php links with their context
    const imgMatches = [...html.matchAll(/image\.php\?(\w+)/g)];
    const ahIdMatches = [...html.matchAll(/anime\.php\?(\w+)/g)];
    const titleMatches = [...html.matchAll(/\[([^\]]+)\]\(https:\/\/animeheaven\.me\/anime\.php\?(\w+)\)/g)];

    // Parse structured blocks: look for patterns with title, ep count, time
    const entryRegex = /\[([^\]]*)\]\(https:\/\/animeheaven\.me\/image\.php\?(\w+)\)\n\n(\d+)\]\(https:\/\/animeheaven\.me\/anime\.php\?(\w+)\)/g;
    const timeRegex = /(\d+)\s*(h|d)\s*ago/g;

    // Markdown-based extraction (fetch returns markdown via edge)
    // Try a different cleaner approach - extract from raw HTML directly
    const titleRegex = /<a[^>]+href="\/anime\.php\?(\w+)"[^>]*>\s*([^<]+?)\s*<\/a>/g;
    const epRegex = /<a[^>]+href="\/anime\.php\?(\w+)"[^>]*>\s*\n?\s*<img[^>]+src="\/image\.php\?(\w+)"/g;
    
    // Parse the HTML to extract anime data
    // Split by the add.svg marker which appears between each entry
    const sections = html.split('add.svg');
    
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      
      // Extract ahId from anime.php link
      const ahIdMatch = section.match(/anime\.php\?(\w+)/);
      // Extract image code
      const imgMatch = section.match(/image\.php\?(\w+)/);
      // Extract episode number (the number after the ahId link)
      const epMatch = section.match(/\n\n(\d+)\n/);
      // Extract title
      const titleMatch = section.match(/\[([^\]]+)\]\(https:\/\/animeheaven\.me\/anime\.php\?\w+\)/);
      // Extract Japanese title (second line after main title)
      const titleLines = section.match(/\[([^\]]+)\]\(https:\/\/animeheaven\.me\/anime\.php\?\w+\)\n\n([^\n]+)\n/);
      // Extract time ago
      const timeMatch = section.match(/(\d+)\s*(h|d)\s*ago/);

      if (ahIdMatch && imgMatch && epMatch && titleMatch && timeMatch) {
        const titre = titleMatch[1].trim();
        // Skip navigation links and non-anime entries
        if (titre.length < 2 || titre === "New" || titre === "Popular" || titre === "Fall" || titre === "Random" || titre === "MORE") continue;
        
        const ahId = ahIdMatch[1];
        const img = imgMatch[1];
        const ep = parseInt(epMatch[1]);
        const timeNum = parseInt(timeMatch[1]);
        const timeUnit = timeMatch[2];
        const ago = `${timeNum}${timeUnit}`;
        const titreJp = titleLines && titleLines[2] && titleLines[2] !== "-" ? titleLines[2].trim() : "";

        // Avoid duplicates
        if (!animes.find(a => a.ahId === ahId)) {
          animes.push({ titre, titreJp, ep, ago, img, ahId });
        }
      }
    }

    // If parsing failed, return a helpful error
    if (animes.length === 0) {
      return new Response(JSON.stringify({ error: "Could not parse AnimeHeaven", animes: [] }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ animes, updatedAt: new Date().toISOString() }), {
      status: 200,
      headers: { ...corsHeaders, "Cache-Control": "s-maxage=1800, stale-while-revalidate" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, animes: [] }), {
      status: 200,
      headers: corsHeaders,
    });
  }
}
