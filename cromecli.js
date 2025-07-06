import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CFGFILE="./cromecli.cfg"

const cmd = process.argv[2];
const params = process.argv.slice(3)?.join(' ');

function parseCfgFile(filePath) {
    try {
        // Read the file contents
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Split into lines and filter out empty lines
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        
        // Create the dictionary object
        const urlDict = {};
        
        // Process each line
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            
            // Find the last space to separate keywords from URL
            const lastSpaceIndex = trimmedLine.lastIndexOf(' ');
            
            if (lastSpaceIndex === -1) {
                console.warn(`Warning: Line ${index + 1} doesn't contain a space separator: "${trimmedLine}"`);
                return;
            }
            
            // Extract keywords and URL
            const keywordsPart = trimmedLine.substring(0, lastSpaceIndex);
            const url = trimmedLine.substring(lastSpaceIndex + 1);
            
            // Split keywords by comma and process each
            const keywords = keywordsPart.split(',').map(keyword => keyword.trim());
            
            // Add each keyword to the dictionary
            keywords.forEach(keyword => {
                if (keyword) { // Skip empty keywords
                    urlDict[keyword] = url;
                }
            });
        });
        
        return urlDict;
    } catch (error) {
        console.error('Error reading file:', error.message);
        return null;
    }
}


const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null
});


  const isValidUrl = (s) => {
    try {
      new URL(s);
      return true;
    } catch (err) {
      return false;
    }
  };


async function main() {

    const URLS = parseCfgFile(CFGFILE);
    const url = URLS[cmd];
    let pages = [];
    let urlfound = false;

    const targets = await browser.targets();
    for ( const target of targets ) { 
        if( target.type() == 'page' ){
            const page = await target.page();

            if( url && isValidUrl(url) && page.url().startsWith(url) ){
                await page.bringToFront();
                urlfound = true;
            }
            const title = await page.title();
            pages.push( { url: page.url, title: title } )
        }
    };

    if( url && !urlfound ){
        const newpage = await browser.newPage();
        await newpage.goto(url);
    }

    if( !url ){
        console.log(URLS);
    } else {
        console.log(url);
    }
    


}


await main();

/*
let urls = [];
let titles = [];

pages.forEach(page => {
    const url = page.url();
    const title = page.title();
    urls.push(url);
    titles.push(title);
})
*/


await browser.disconnect();



//console.log(urls);