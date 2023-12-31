const puppeteer = require('puppeteer');
const axios = require('axios');

let logs = [];
const originalConsoleLog = console.log;
console.log = function(message) {
    logs.push(message);
    originalConsoleLog.apply(console, arguments);
};

const targetUrl = process.argv[2] || 'https://maitridesigns.com'; // Default to 'https://maitridesigns.com' if no argument is provided

if (!targetUrl) {
    console.error("No target URL provided.");
    process.exit(1); // Exit the script with an error code
}

const maxDepth = 1;
const visitedUrls = new Set(); // Set to track visited URLs

async function scrapeWebMap(url, depth = 0) {
    if (depth > maxDepth || visitedUrls.has(url)) {
        return { name: url };
    }

    console.log(`Scraping URL: ${url} (Depth: ${depth})`); // Log the current URL being scraped

    visitedUrls.add(url); // Mark the URL as visited

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });

    const links = await page.$$eval('a', anchors => {
        return anchors.map(anchor => anchor.href);
    });

    await browser.close();

    const uniqueLinks = [...new Set(links)];
    const children = [];

    for (let link of uniqueLinks) {
        if (link.startsWith(targetUrl)) {
            const childData = await scrapeWebMap(link, depth + 1);
            children.push(childData);
        }
    }

    return {
        name: url,
        children: children.length > 0 ? children : undefined
    };
}

async function storeWebMapData(data) {
    try {
        const response = await axios.post('http://localhost:8000/api/store-webmap', data);
        console.log('Data stored:', response.data);
    } catch (error) {
        console.error('Error storing web map data:', error);
    }
}

async function main() {
    console.log('Starting web scraping...'); // Log the start of the scraping process
    const webMapData = await scrapeWebMap(targetUrl);
    await storeWebMapData(webMapData);
    console.log('Web scraping completed!'); // Log the completion of the scraping process
}

main();




/*
const puppeteer = require('puppeteer');
const axios = require('axios');

// Function to introduce a delay (for rate limiting)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to scrape links and titles from a given webpage
async function scrapeLinks(url) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        const links = await page.$$eval('a', anchors => {
            return anchors.map(anchor => ({ href: anchor.href, title: anchor.textContent.trim() }))
                          .filter(link => link.href.startsWith('https://maitridesigns.com/'));  // Filter links to only include those within the domain
        });

        await browser.close();
        return links;
    } catch (error) {
        console.error(`Failed to scrape ${url}: ${error.message}`);
        await browser.close();
        return [];
    }
}

// Recursive function to build the web map in a hierarchical manner
async function buildWebMap(url, visited = new Set(), depth = 0, maxDepth = 2) {
    if (depth > maxDepth || visited.has(url)) return null;

    visited.add(url);

    const links = await scrapeLinks(url);
    let children = [];

    for (let linkObj of links) {
        const childData = await buildWebMap(linkObj.href, visited, depth + 1, maxDepth);
        if (childData) {
            children.push(childData);
        }
    }

    return {
        url: url,
        title: links.find(link => link.href === url)?.title || '',
        links: children
    };
}

buildWebMap('https://maitridesigns.com', new Set(), 0, 2).then(webMap => {
    // Send the hierarchical webMap to the backend
    axios.post('http://localhost:8000/api/store-webmap', webMap)
         .then(response => {
             console.log(`Data sent to backend:`, response.data);
         })
         .catch(error => {
             console.error(`Error sending data to backend:`, error);
         });
});

module.exports = buildWebMap;


*/
/* 
const puppeteer = require('puppeteer');
const axios = require('axios');

// Function to introduce a delay (for rate limiting)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to scrape links from a given webpage
async function scrapeLinks(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        const links = await page.$$eval('a', anchors => {
            return anchors.map(anchor => anchor.href);
        });

        await browser.close();
        return links;
    } catch (error) {
        console.error(`Failed to scrape ${url}: ${error.message}`);
        await browser.close();
        return [];
    }
}

// Function to build the web map
async function buildWebMap(startUrl, depth = 2) {
    let webMap = {};

    async function crawl(url, level) {
        if (level > depth) return;

        const links = await scrapeLinks(url);
        webMap[url] = links;

        process.stdout.write('#');

        // Use Promise.all() to handle multiple pages concurrently
        const promises = [];
        for (let link of links) {
            if (!webMap[link]) {
                promises.push(crawl(link, level + 1));
            }
        }
        await Promise.all(promises);
    }

    await crawl(startUrl, 1);
    console.log(`\nCrawling completed.`);
    return webMap;
}

buildWebMap('https://maitridesigns.com', 2).then(webMap => {
    // Iterate over the webMap object and send each URL and its links to the backend
    for (let [url, links] of Object.entries(webMap)) {
        axios.post('http://localhost:8000/api/store-webmap', { url: url, links: links })
             .then(response => {
                 console.log(`Data for ${url} sent to backend:`, response.data);
             })
             .catch(error => {
                 console.error(`Error sending data for ${url} to backend:`, error);
             });
    }
});


module.exports = buildWebMap;

*/