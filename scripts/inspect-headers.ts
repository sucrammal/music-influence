
const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';

async function main() {
    const slug = 'Rage_Against_the_Machine';
    console.log(`Fetching wikitext for ${slug}...`);

    const params = new URLSearchParams({
        action: 'parse',
        page: slug.replace(/_/g, ' '),
        prop: 'wikitext',
        format: 'json',
        origin: '*',
        redirects: '1',
    });

    const response = await fetch(`${WIKI_API_URL}?${params.toString()}`);
    const data = await response.json();

    if (!data.parse || !data.parse.wikitext) {
        console.error('No wikitext found');
        return;
    }

    const wikitext = data.parse.wikitext['*'];

    // Regex to find all headers
    // Matches == Header == or === Header ===
    const headerRegex = /(=+)\s*(.+?)\s*\1/g;

    let match;
    console.log('\nFound Headers:');
    while ((match = headerRegex.exec(wikitext)) !== null) {
        console.log(`- ${match[2].trim()} (Level: ${match[1].length})`);
    }
}

main().catch(console.error);
