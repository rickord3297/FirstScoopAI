const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cors = require('cors'); // Import the cors package

const app = express();
const port = 3000;

app.use(cors()); // Use cors middleware to allow cross-origin requests
app.use(express.json()); // To parse JSON bodies.

// Error handling function
const handleError = (res, error, message = 'An error occurred') => {
    console.error(error);
    res.status(500).json({ error: message });
};

// Function to fetch and parse RSS feed (retained for server-side use)
const fetchRssFeed = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch RSS feed: ${response.status}`);
        }
        const text = await response.text();
        const parser = new DOMParser(); // Use DOMParser for server-side parsing
        const xmlDoc = new parser.parseFromString(text, "text/xml");
        const items = Array.from(xmlDoc.querySelectorAll('channel > item'));
        return items;
    } catch (error) {
        console.error("Error fetching RSS feed:", error);
        throw error;
    }
};

// Function to scrape trending articles (Example for sports)
const scrapeTrendingArticles = async (url, selector, extract) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const articles = [];
    $(selector).each((index, element) => {
      try{
        const articleData = extract($(element), $);
        if(articleData){
           articles.push(articleData);
        }
      } catch(e){
        console.log("Error extracting article: ", e);
      }

    });
    return articles;
  } catch (error) {
    console.error("Error scraping articles:", error);
    throw error;
  }
};

app.get('/api/articles', async (req, res) => {
    const { topic } = req.query;

    try {
        let articles = [];
        switch (topic) {
            case 'ai':
                const aiRssUrls = [
                    'https://www.technologyreview.com/feed/',
                    'https://www.wired.com/feed/rss',
                    'https://www.theverge.com/rss/index.xml',
                    'https://www.engadget.com/rss-ai.xml',
                    'https://www.nytimes.com/topic/subject/artificial-intelligence/rss.xml',
                    'https://www.newscientist.com/subject/artificial-intelligence/feed/',
                    'https://www.bbc.co.uk/news/technology/ai/index.xml',
                    'https://www.economist.com/science-and-technology/rss.xml',
                    'https://www.ft.com/stream/world-news-about-artificial-intelligence',
                    'https://www.ai.gov/rss/updates.xml'
                ];
                for (const url of aiRssUrls) {
                    const items = await fetchRssFeed(url);
                    articles.push(...items.map(item => ({
                        title: item.querySelector('title')?.textContent || 'No Title',
                        description: item.querySelector('description')?.textContent || 'No description available.',
                        link: item.querySelector('link')?.textContent || '#',
                        pubDate: item.querySelector('pubDate')?.textContent || 'Unknown date',
                        author: item.querySelector('author')?.textContent || item.querySelector('dc\\:creator')?.textContent || '',
                        imageUrl: item.querySelector('enclosure')?.getAttribute('url') || null,
                    })));
                }
                break;
            case 'mac':
                const macRssUrls = [
                    'https://www.macrumors.com/feed/',
                    'http://feeds.macrumors.com/MacRumors-All',
                    'https://www.theverge.com/rss/index.xml',
                    'https://www.engadget.com/rss-mac.xml',
                    'https://www.cnet.com/rss/news/',
                    'https://www.techradar.com/rss/news',
                    'https://www.imore.com/feed',
                    'https://9to5mac.com/feed/',
                    'https://www.macworld.com/feed.xml',
                    'https://arstechnica.com/feed/',
                    'https://www.bloomberg.com/feeds/technology.xml'
                ];
                 for (const url of macRssUrls) {
                    const items = await fetchRssFeed(url);
                    articles.push(...items.map(item => ({
                        title: item.querySelector('title')?.textContent || 'No Title',
                        description: item.querySelector('description')?.textContent || 'No description available.',
                        link: item.querySelector('link')?.textContent || '#',
                        pubDate: item.querySelector('pubDate')?.textContent || 'Unknown date',
                        author: item.querySelector('author')?.textContent || item.querySelector('dc\\:creator')?.textContent || '',
                        imageUrl: item.querySelector('enclosure')?.getAttribute('url') || null,
                    })));
                }
                break;
            case 'sports':
                // Example: Scraping trending articles from ESPN
                const espnUrl = 'https://www.espn.com/';
                const espnSelector = 'div.contentItem__content'; // Adjust this selector as needed.
                const espnExtract = ($element, $) => {
                    const title = $element.find('h2').text().trim();
                    const description = $element.find('p').text().trim();
                    const link = $element.find('a').attr('href');
                    const imageUrl = $element.find('img').attr('src');
                    if(title && link){
                         return { title, description, link:  espnUrl + link, imageUrl };
                    }
                    return null;

                };
                const sportsArticles = await scrapeTrendingArticles(espnUrl, espnSelector, espnExtract);
                articles = sportsArticles;
                break;
            case 'all':
            default:
                const allRssUrls = [
                    'https://www.reuters.com/arc/outbound/rss/0,,M.xml',
                    'http://rss.cnn.com/rss/cnn_topstories.rss',
                    'https://www.bbc.co.uk/news/rss.xml',
                    'https://www.nytimes.com/rss/homepage.xml',
                    'https://www.theguardian.com/international/rss',
                    'https://www.washingtonpost.com/rss/world',
                    'https://www.hindustantimes.com/rss/topnews',
                    'https://www.theglobeandmail.com/rss/world/',
                    'https://www.aljazeera.com/xml/rss/all.xml',
                    'https://www.smh.com.au/rss/feed.xml'
                ];
                for (const url of allRssUrls) {
                    const items = await fetchRssFeed(url);
                     articles.push(...items.map(item => ({
                        title: item.querySelector('title')?.textContent || 'No Title',
                        description: item.querySelector('description')?.textContent || 'No description available.',
                        link: item.querySelector('link')?.textContent || '#',
                        pubDate: item.querySelector('pubDate')?.textContent || 'Unknown date',
                        author: item.querySelector('author')?.textContent || item.querySelector('dc\\:creator')?.textContent || '',
                        imageUrl: item.querySelector('enclosure')?.getAttribute('url') || null,
                    })));
                }
                break;
        }
        // Combine and sort articles by publication date
         articles.sort((a, b) => {
            const dateA = new Date(a.pubDate);
            const dateB = new Date(b.pubDate);
            return dateB.getTime() - dateA.getTime(); // Sort descending
        });
        res.json(articles);
    } catch (error) {
        handleError(res, error, 'Failed to fetch articles');
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
