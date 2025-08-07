import DA_SDK from 'https://da.live/nx/utils/sdk.js';

(async function init() {
    // Get DA SDK context and actions
    const { context, token, actions } = await DA_SDK;
    
    // Display DA context information
    displayDAContext(context);
    
    // Initialize the page comparison app
    initializePageCompareApp();
    
    console.log('Page Compare DA App initialized with context:', context);
}());

function displayDAContext(context) {
    const contextInfo = document.getElementById('contextInfo');
    const contextHtml = Object.keys(context).map(key => {
        return `<strong>${key}:</strong> ${context[key]}`;
    }).join('<br>');
    
    contextInfo.innerHTML = contextHtml || 'No context information available';
}

function initializePageCompareApp() {
    const compareBtn = document.getElementById('compareBtn');
    const preGoLiveUrlInput = document.getElementById('preGoLiveUrl');
    const currentUrlInput = document.getElementById('currentUrl');
    const successThresholdInput = document.getElementById('successThreshold');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const score = document.getElementById('score');
    const details = document.getElementById('details');
    const error = document.getElementById('error');
    const clearResultsBtn = document.getElementById('clearResultsBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const exportResultsBtn = document.getElementById('exportResultsBtn');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const contentAnalysis = document.getElementById('contentAnalysis');
    const layoutAnalysis = document.getElementById('layoutAnalysis');

    // Load saved values from localStorage
    loadSavedValues();

    compareBtn.addEventListener('click', async function() {
        const preGoLiveUrl = preGoLiveUrlInput.value.trim();
        const currentUrl = currentUrlInput.value.trim();
        const successThreshold = parseInt(successThresholdInput.value);

        // Validate inputs
        if (!preGoLiveUrl || !currentUrl) {
            showError('Please enter both URLs');
            return;
        }

        if (isNaN(successThreshold) || successThreshold < 0 || successThreshold > 100) {
            showError('Please enter a valid threshold between 0 and 100');
            return;
        }

        // Save values
        saveValues();

        // Show loading
        showLoading(true);
        hideError();
        hideResults();

        try {
            // Start comparison
            console.log('Starting page comparison...');
            const result = await comparePages(preGoLiveUrl, currentUrl, successThreshold);
            showResults(result);
        } catch (err) {
            console.error('Error during comparison:', err);
            showError(`Failed to compare pages: ${err.message}`);
        } finally {
            showLoading(false);
        }
    });

    function loadSavedValues() {
        const saved = JSON.parse(localStorage.getItem('pageCompareSettings') || '{}');
        if (saved.preGoLiveUrl) preGoLiveUrlInput.value = saved.preGoLiveUrl;
        if (saved.currentUrl) currentUrlInput.value = saved.currentUrl;
        if (saved.successThreshold) successThresholdInput.value = saved.successThreshold;
        
        // Restore last results if they exist
        const lastResults = JSON.parse(localStorage.getItem('pageCompareResults') || 'null');
        if (lastResults) {
            showResults(lastResults);
        }
    }

    function saveValues() {
        const settings = {
            preGoLiveUrl: preGoLiveUrlInput.value,
            currentUrl: currentUrlInput.value,
            successThreshold: successThresholdInput.value
        };
        localStorage.setItem('pageCompareSettings', JSON.stringify(settings));
    }

    function showLoading(show) {
        loading.style.display = show ? 'block' : 'none';
        compareBtn.disabled = show;
        cancelBtn.style.display = show ? 'block' : 'none';
    }

    function updateProgress(percent) {
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
    }

    function showResults(data) {
        const { overallScore, contentScore, placementScore, details: comparisonDetails } = data;
        const timestamp = new Date().toLocaleString();
        
        score.textContent = `${overallScore}%`;
        score.className = `score ${overallScore >= parseInt(successThresholdInput.value) ? 'pass' : 'fail'}`;
        
        details.innerHTML = `
            <div style="font-size: 12px; color: #ccc; margin-bottom: 10px;">Last compared: ${timestamp}</div>
            <strong>Content Match:</strong> ${contentScore}%<br>
            <strong>Placement Match:</strong> ${placementScore}%<br>
            <strong>Threshold:</strong> ${successThresholdInput.value}%<br>
            <strong>Result:</strong> ${overallScore >= parseInt(successThresholdInput.value) ? 'PASS' : 'FAIL'}<br><br>
            <strong>Details:</strong><br>
            ${comparisonDetails}
        `;
        
        // Update analysis sections
        contentAnalysis.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>Content Score:</strong> ${contentScore}%
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${contentScore}%"></div>
                </div>
            </div>
            <div style="font-size: 12px;">
                Analyzed text content, headings, and metadata similarity
            </div>
        `;
        
        layoutAnalysis.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>Layout Score:</strong> ${placementScore}%
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${placementScore}%"></div>
                </div>
            </div>
            <div style="font-size: 12px;">
                Analyzed element positioning and visual hierarchy
            </div>
        `;
        
        results.style.display = 'block';
        
        // Save results
        const resultsWithTimestamp = { ...data, timestamp: timestamp };
        localStorage.setItem('pageCompareResults', JSON.stringify(resultsWithTimestamp));
    }

    function showError(message) {
        error.textContent = message;
        error.style.display = 'block';
    }

    function hideError() {
        error.style.display = 'none';
    }

    function hideResults() {
        results.style.display = 'none';
    }

    // Clear results button handler
    clearResultsBtn.addEventListener('click', function() {
        localStorage.removeItem('pageCompareResults');
        hideResults();
        console.log('Results cleared');
    });

    // Export results button handler
    exportResultsBtn.addEventListener('click', function() {
        const results = JSON.parse(localStorage.getItem('pageCompareResults') || 'null');
        if (results) {
            exportReport(results);
        } else {
            showError('No results to export. Please run a comparison first.');
        }
    });

    // Cancel button handler
    cancelBtn.addEventListener('click', function() {
        showLoading(false);
        console.log('Comparison cancelled');
    });
}

// Page comparison functionality
async function comparePages(preGoLiveUrl, currentUrl, successThreshold) {
    console.log('Starting comparison between:', preGoLiveUrl, 'and', currentUrl);
    
    // Update progress
    updateProgress(10);
    
    try {
        // Fetch both pages
        const [preGoLiveHtml, currentHtml] = await Promise.all([
            fetchPageData(preGoLiveUrl),
            fetchPageData(currentUrl)
        ]);
        
        updateProgress(50);
        
        // Parse and compare pages
        console.log('Starting page comparison...');
        const result = await comparePagesData(preGoLiveHtml, currentHtml, preGoLiveUrl, currentUrl, successThreshold);
        
        updateProgress(100);
        console.log('Comparison result:', result);
        
        return result;
    } catch (error) {
        console.error('Error in comparison:', error);
        throw error;
    }
}

// Fetch page data
async function fetchPageData(url) {
    try {
        console.log('Fetching page data from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        console.log('Successfully fetched HTML, length:', html.length);
        return html;
    } catch (error) {
        console.error('Error fetching page data:', error);
        throw error;
    }
}

// Compare pages using the same algorithm as the Chrome extension
async function comparePagesData(preGoLiveHtml, currentHtml, preGoLiveUrl, currentUrl, successThreshold) {
    try {
        // Parse both pages
        const preGoLiveData = parsePageData(preGoLiveHtml, preGoLiveUrl);
        const currentData = parsePageData(currentHtml, currentUrl);
        
        // Perform content comparison
        const contentScore = compareContent(preGoLiveData, currentData);
        console.log('Content score result:', contentScore);
        
        // Perform placement comparison
        const placementScore = comparePlacement(preGoLiveData, currentData);
        console.log('Placement score result:', placementScore);
        
        // Calculate overall score (weighted average)
        const overallScore = Math.round((contentScore * 0.6) + (placementScore * 0.4));
        console.log('Overall score result:', overallScore);
        
        // Generate detailed comparison report
        const details = generateComparisonDetails(preGoLiveData, currentData);
        
        return {
            overallScore: overallScore || 0,
            contentScore: contentScore || 0,
            placementScore: placementScore || 0,
            details: details || 'No details available',
            preGoLiveData,
            currentData
        };
    } catch (error) {
        console.error('Error in comparison:', error);
        throw error;
    }
}

// Parse page data (same as Chrome extension)
function parsePageData(html, url) {
    try {
        console.log('Parsing page data for URL:', url);
        
        return {
            url: url,
            title: extractTitleFromHTML(html),
            textContent: extractTextContentFromHTML(html),
            elements: extractElementsFromHTML(html),
            structure: extractStructureFromHTML(html),
            metadata: extractBasicMetadataFromHTML(html)
        };
    } catch (error) {
        console.error('Error parsing page data:', error);
        return {
            url: url,
            title: extractTitleFromHTML(html),
            textContent: extractTextContentFromHTML(html),
            elements: [],
            structure: extractBasicStructureFromHTML(html),
            metadata: extractBasicMetadataFromHTML(html)
        };
    }
}

// Content comparison (same as Chrome extension)
function compareContent(preGoLive, current) {
    console.log('Comparing content:', { preGoLive, current });
    
    let totalScore = 0;
    let totalWeight = 0;
    const details = [];

    // Compare title
    const titleScore = compareText(preGoLive.title, current.title);
    console.log('Title score:', titleScore);
    totalScore += titleScore * 10;
    totalWeight += 10;
    details.push(`Title similarity: ${titleScore}%`);

    // Compare text content
    const textScore = compareTextContent(preGoLive.textContent, current.textContent);
    console.log('Text score:', textScore);
    totalScore += textScore * 40;
    totalWeight += 40;
    details.push(`Text content similarity: ${textScore}%`);

    // Compare structure
    const structureScore = compareStructure(preGoLive.structure, current.structure);
    console.log('Structure score:', structureScore);
    totalScore += structureScore * 30;
    totalWeight += 30;
    details.push(`Structure similarity: ${structureScore}%`);

    // Compare metadata
    const metadataScore = compareMetadata(preGoLive.metadata, current.metadata);
    console.log('Metadata score:', metadataScore);
    totalScore += metadataScore * 20;
    totalWeight += 20;
    details.push(`Metadata similarity: ${metadataScore}%`);

    const finalScore = Math.round(totalScore / totalWeight);
    console.log('Final content score:', finalScore);
    
    return finalScore || 0;
}

// Placement comparison (same as Chrome extension)
function comparePlacement(preGoLive, current) {
    console.log('Comparing placement:', { preGoLive, current });
    
    let totalScore = 0;
    let totalWeight = 0;
    const details = [];

    // Compare element positioning
    const positioningScore = compareElementPositioning(preGoLive.elements, current.elements);
    console.log('Positioning score:', positioningScore);
    totalScore += positioningScore * 50;
    totalWeight += 50;
    details.push(`Element positioning: ${positioningScore}%`);

    // Compare layout structure
    const layoutScore = compareLayoutStructure(preGoLive.structure, current.structure);
    console.log('Layout score:', layoutScore);
    totalScore += layoutScore * 30;
    totalWeight += 30;
    details.push(`Layout structure: ${layoutScore}%`);

    // Compare visual hierarchy
    const hierarchyScore = compareVisualHierarchy(preGoLive.structure, current.structure);
    console.log('Hierarchy score:', hierarchyScore);
    totalScore += hierarchyScore * 15;
    totalWeight += 15;
    details.push(`Visual hierarchy: ${hierarchyScore}%`);

    // Compare styling differences
    const stylingScore = analyzeStylingDifferences(preGoLive.structure, current.structure);
    console.log('Styling score:', stylingScore);
    totalScore += stylingScore * 15;
    totalWeight += 15;
    details.push(`Styling differences: ${stylingScore}%`);

    const finalScore = Math.round(totalScore / totalWeight);
    console.log('Final placement score:', finalScore);
    
    return finalScore || 0;
}

// Helper functions (same as Chrome extension)
function extractTitleFromHTML(html) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : '';
}

function extractTextContentFromHTML(html) {
    const texts = [];
    
    // Remove script and style tags first
    const cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                         .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Extract text from various elements
    const patterns = [
        { tag: 'h1', regex: /<h1[^>]*>([^<]+)<\/h1>/gi },
        { tag: 'h2', regex: /<h2[^>]*>([^<]+)<\/h2>/gi },
        { tag: 'h3', regex: /<h3[^>]*>([^<]+)<\/h3>/gi },
        { tag: 'h4', regex: /<h4[^>]*>([^<]+)<\/h4>/gi },
        { tag: 'h5', regex: /<h5[^>]*>([^<]+)<\/h5>/gi },
        { tag: 'h6', regex: /<h6[^>]*>([^<]+)<\/h6>/gi },
        { tag: 'p', regex: /<p[^>]*>([^<]+)<\/p>/gi },
        { tag: 'span', regex: /<span[^>]*>([^<]+)<\/span>/gi },
        { tag: 'div', regex: /<div[^>]*>([^<]+)<\/div>/gi },
        { tag: 'a', regex: /<a[^>]*>([^<]+)<\/a>/gi },
        { tag: 'li', regex: /<li[^>]*>([^<]+)<\/li>/gi }
    ];
    
    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(cleanHtml)) !== null) {
            const text = match[1].trim();
            if (text && text.length > 3) {
                texts.push({
                    text: text,
                    tag: pattern.tag,
                    className: '',
                    id: ''
                });
            }
        }
    });
    
    return texts;
}

function extractElementsFromHTML(html) {
    const elements = [];
    
    // Remove script and style tags first
    const cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                         .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Extract all elements with content
    const elementRegex = /<(\w+)[^>]*>([^<]+)<\/\1>/gi;
    let match;
    
    while ((match = elementRegex.exec(cleanHtml)) !== null) {
        const tag = match[1].toLowerCase();
        const text = match[2].trim();
        
        if (text && text.length > 0) {
            elements.push({
                tag: tag,
                className: '',
                id: '',
                text: text.substring(0, 100),
                position: {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                }
            });
        }
    }
    
    return elements;
}

function extractStructureFromHTML(html) {
    const structure = {
        headings: [],
        paragraphs: [],
        links: [],
        images: [],
        lists: [],
        containers: []
    };

    // Remove script and style tags first
    const cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                         .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Headings
    for (let i = 1; i <= 6; i++) {
        const headingRegex = new RegExp(`<h${i}[^>]*>([^<]+)<\/h${i}>`, 'gi');
        let match;
        while ((match = headingRegex.exec(cleanHtml)) !== null) {
            structure.headings.push({
                level: i,
                text: match[1].trim(),
                className: '',
                id: '',
                style: ''
            });
        }
    }

    // Paragraphs
    const paragraphRegex = /<p[^>]*>([^<]+)<\/p>/gi;
    let match;
    while ((match = paragraphRegex.exec(cleanHtml)) !== null) {
        structure.paragraphs.push({
            text: match[1].trim(),
            className: '',
            id: '',
            style: ''
        });
    }

    // Links
    const linkRegex = /<a[^>]*>([^<]+)<\/a>/gi;
    while ((match = linkRegex.exec(cleanHtml)) !== null) {
        structure.links.push({
            text: match[1].trim(),
            href: '',
            className: '',
            id: '',
            style: ''
        });
    }

    // Images
    const imageRegex = /<img[^>]*>/gi;
    while ((match = imageRegex.exec(cleanHtml)) !== null) {
        structure.images.push({
            src: '',
            alt: '',
            className: '',
            id: '',
            style: ''
        });
    }

    // Lists
    const listRegex = /<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
    while ((match = listRegex.exec(cleanHtml)) !== null) {
        const listType = match[1].toLowerCase();
        const listContent = match[2];
        const items = [];
        
        // Extract list items
        const itemRegex = /<li[^>]*>([^<]+)<\/li>/gi;
        let itemMatch;
        while ((itemMatch = itemRegex.exec(listContent)) !== null) {
            items.push(itemMatch[1].trim());
        }
        
        structure.lists.push({
            type: listType,
            items: items,
            className: '',
            id: '',
            style: ''
        });
    }

    // Container elements
    const containerRegex = /<(div|section|article|main|aside|header|footer)[^>]*>([^<]+)<\/\1>/gi;
    while ((match = containerRegex.exec(cleanHtml)) !== null) {
        structure.containers.push({
            tag: match[1].toLowerCase(),
            className: '',
            id: '',
            style: ''
        });
    }

    return structure;
}

function extractBasicMetadataFromHTML(html) {
    const metadata = {
        title: extractTitleFromHTML(html),
        description: '',
        keywords: '',
        viewport: '',
        charset: ''
    };

    // Extract description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (descMatch) metadata.description = descMatch[1];

    // Extract keywords
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    if (keywordsMatch) metadata.keywords = keywordsMatch[1];

    // Extract viewport
    const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i);
    if (viewportMatch) metadata.viewport = viewportMatch[1];

    // Extract charset
    const charsetMatch = html.match(/<meta[^>]*charset=["']([^"']+)["']/i);
    if (charsetMatch) metadata.charset = charsetMatch[1];

    return metadata;
}

function extractBasicStructureFromHTML(html) {
    return {
        headings: [],
        paragraphs: [],
        links: [],
        images: [],
        lists: []
    };
}

// Comparison helper functions
function compareText(text1, text2) {
    return calculateTextSimilarity(text1, text2);
}

function compareTextContent(preGoLiveTexts, currentTexts) {
    if (preGoLiveTexts.length === 0 && currentTexts.length === 0) return 100;
    if (preGoLiveTexts.length === 0 || currentTexts.length === 0) return 0;

    let totalSimilarity = 0;
    let totalComparisons = 0;

    preGoLiveTexts.forEach(preText => {
        let bestMatch = 0;
        currentTexts.forEach(currentText => {
            const similarity = calculateTextSimilarity(preText.text, currentText.text);
            if (similarity > bestMatch) {
                bestMatch = similarity;
            }
        });
        totalSimilarity += bestMatch;
        totalComparisons++;
    });

    return Math.round(totalSimilarity / totalComparisons);
}

function compareStructure(preGoLiveStructure, currentStructure) {
    let totalScore = 0;
    let totalWeight = 0;

    // Compare headings
    const headingScore = compareHeadings(preGoLiveStructure.headings, currentStructure.headings);
    totalScore += headingScore * 30;
    totalWeight += 30;

    // Compare paragraphs
    const paragraphScore = compareParagraphs(preGoLiveStructure.paragraphs, currentStructure.paragraphs);
    totalScore += paragraphScore * 25;
    totalWeight += 25;

    // Compare links
    const linkScore = compareLinks(preGoLiveStructure.links, currentStructure.links);
    totalScore += linkScore * 20;
    totalWeight += 20;

    // Compare images
    const imageScore = compareImages(preGoLiveStructure.images, currentStructure.images);
    totalScore += imageScore * 15;
    totalWeight += 15;

    // Compare lists
    const listScore = compareLists(preGoLiveStructure.lists, currentStructure.lists);
    totalScore += listScore * 10;
    totalWeight += 10;

    return Math.round(totalScore / totalWeight);
}

function compareElementPositioning(preGoLiveElements, currentElements) {
    if (preGoLiveElements.length === 0 && currentElements.length === 0) return 100;
    if (preGoLiveElements.length === 0 || currentElements.length === 0) return 0;

    // Analyze structural differences rather than just text similarity
    const preGoLiveTags = preGoLiveElements.map(el => el.tag);
    const currentTags = currentElements.map(el => el.tag);
    
    // Compare tag distribution (layout structure)
    const tagDistributionSimilarity = compareTagDistribution(preGoLiveTags, currentTags);
    
    // Compare element count differences
    const countDifference = Math.abs(preGoLiveElements.length - currentElements.length);
    const maxCount = Math.max(preGoLiveElements.length, currentElements.length);
    const countSimilarity = maxCount > 0 ? Math.max(0, 100 - (countDifference / maxCount) * 100) : 100;
    
    // Weight the factors (tag distribution is more important for layout)
    const finalScore = Math.round((tagDistributionSimilarity * 0.7) + (countSimilarity * 0.3));
    
    return finalScore;
}

function compareTagDistribution(tags1, tags2) {
    if (tags1.length === 0 && tags2.length === 0) return 100;
    if (tags1.length === 0 || tags2.length === 0) return 0;
    
    // Count tag frequencies
    const freq1 = {};
    const freq2 = {};
    
    tags1.forEach(tag => freq1[tag] = (freq1[tag] || 0) + 1);
    tags2.forEach(tag => freq2[tag] = (freq2[tag] || 0) + 1);
    
    // Calculate similarity based on tag frequency differences
    const allTags = new Set([...tags1, ...tags2]);
    let totalDifference = 0;
    let totalTags = 0;
    
    allTags.forEach(tag => {
        const count1 = freq1[tag] || 0;
        const count2 = freq2[tag] || 0;
        const maxCount = Math.max(count1, count2);
        if (maxCount > 0) {
            totalDifference += Math.abs(count1 - count2) / maxCount;
            totalTags++;
        }
    });
    
    const averageDifference = totalTags > 0 ? totalDifference / totalTags : 0;
    const similarity = Math.max(0, 100 - (averageDifference * 100));
    
    return Math.round(similarity);
}

function calculateTextSimilarity(text1, text2) {
    if (text1 === text2) return 100;
    if (text1.length === 0 || text2.length === 0) return 0;

    const distance = levenshteinDistance(text1.toLowerCase(), text2.toLowerCase());
    const maxLength = Math.max(text1.length, text2.length);
    return Math.round(((maxLength - distance) / maxLength) * 100);
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[str2.length][str1.length];
}

function compareHeadings(headings1, headings2) {
    return compareTextContent(headings1.map(h => h.text), headings2.map(h => h.text));
}

function compareParagraphs(paragraphs1, paragraphs2) {
    return compareTextContent(paragraphs1.map(p => p.text), paragraphs2.map(p => p.text));
}

function compareLinks(links1, links2) {
    return compareTextContent(links1.map(l => l.text), links2.map(l => l.text));
}

function compareImages(images1, images2) {
    if (images1.length === 0 && images2.length === 0) return 100;
    if (images1.length === 0 || images2.length === 0) return 0;

    let totalSimilarity = 0;
    let totalComparisons = 0;

    images1.forEach(img1 => {
        let bestMatch = 0;
        images2.forEach(img2 => {
            const similarity = calculateTextSimilarity(img1.alt || '', img2.alt || '');
            if (similarity > bestMatch) {
                bestMatch = similarity;
            }
        });
        totalSimilarity += bestMatch;
        totalComparisons++;
    });

    return Math.round(totalSimilarity / totalComparisons);
}

function compareLists(lists1, lists2) {
    if (lists1.length === 0 && lists2.length === 0) return 100;
    if (lists1.length === 0 || lists2.length === 0) return 0;

    let totalSimilarity = 0;
    let totalComparisons = 0;

    lists1.forEach(list1 => {
        let bestMatch = 0;
        lists2.forEach(list2 => {
            const similarity = compareTextContent(list1.items, list2.items);
            if (similarity > bestMatch) {
                bestMatch = similarity;
            }
        });
        totalSimilarity += bestMatch;
        totalComparisons++;
    });

    return Math.round(totalSimilarity / totalComparisons);
}

function compareMetadata(metadata1, metadata2) {
    let totalScore = 0;
    let totalWeight = 0;

    const titleScore = compareText(metadata1.title, metadata2.title);
    totalScore += titleScore * 40;
    totalWeight += 40;

    const descScore = compareText(metadata1.description, metadata2.description);
    totalScore += descScore * 30;
    totalWeight += 30;

    const keywordsScore = compareText(metadata1.keywords, metadata2.keywords);
    totalScore += keywordsScore * 20;
    totalWeight += 20;

    const viewportScore = compareText(metadata1.viewport, metadata2.viewport);
    totalScore += viewportScore * 10;
    totalWeight += 10;

    return Math.round(totalScore / totalWeight);
}

function compareLayoutStructure(structure1, structure2) {
    // Compare the overall layout structure
    const headingCount1 = structure1.headings.length;
    const headingCount2 = structure2.headings.length;
    const paragraphCount1 = structure1.paragraphs.length;
    const paragraphCount2 = structure2.paragraphs.length;
    const linkCount1 = structure1.links.length;
    const linkCount2 = structure2.links.length;
    const imageCount1 = structure1.images.length;
    const imageCount2 = structure2.images.length;
    const listCount1 = structure1.lists.length;
    const listCount2 = structure2.lists.length;

    // Calculate ratios with proper handling for zero values
    const headingRatio = (headingCount1 === 0 && headingCount2 === 0) ? 1 : 
                        (headingCount1 === 0 || headingCount2 === 0) ? 0 :
                        Math.min(headingCount1, headingCount2) / Math.max(headingCount1, headingCount2);
    
    const paragraphRatio = (paragraphCount1 === 0 && paragraphCount2 === 0) ? 1 : 
                          (paragraphCount1 === 0 || paragraphCount2 === 0) ? 0 :
                          Math.min(paragraphCount1, paragraphCount2) / Math.max(paragraphCount1, paragraphCount2);
    
    const linkRatio = (linkCount1 === 0 && linkCount2 === 0) ? 1 : 
                     (linkCount1 === 0 || linkCount2 === 0) ? 0 :
                     Math.min(linkCount1, linkCount2) / Math.max(linkCount1, linkCount2);
    
    const imageRatio = (imageCount1 === 0 && imageCount2 === 0) ? 1 : 
                      (imageCount1 === 0 || imageCount2 === 0) ? 0 :
                      Math.min(imageCount1, imageCount2) / Math.max(imageCount1, imageCount2);
    
    const listRatio = (listCount1 === 0 && listCount2 === 0) ? 1 : 
                     (listCount1 === 0 || listCount2 === 0) ? 0 :
                     Math.min(listCount1, listCount2) / Math.max(listCount1, listCount2);

    // Weight the ratios based on their importance for layout
    const weightedAverage = (
        (headingRatio * 0.25) +      // Headings are important for structure
        (paragraphRatio * 0.20) +    // Paragraphs are common
        (linkRatio * 0.15) +         // Links affect layout
        (imageRatio * 0.25) +        // Images significantly affect layout
        (listRatio * 0.15)           // Lists affect layout
    );
    
    const finalScore = Math.round(weightedAverage * 100);
    
    return finalScore;
}

function analyzeStylingDifferences(structure1, structure2) {
    const styleKeywords = ['margin', 'padding', 'width', 'height', 'display', 'position', 'float', 'flex', 'grid'];
    
    let styleDifferences = 0;
    let totalElements = 0;
    
    // Compare styling across all element types
    const elementTypes = ['headings', 'paragraphs', 'links', 'images', 'lists', 'containers'];
    
    elementTypes.forEach(type => {
        const elements1 = structure1[type] || [];
        const elements2 = structure2[type] || [];
        
        elements1.forEach(elem1 => {
            const matchingElem = elements2.find(elem2 => 
                elem1.className === elem2.className || elem1.id === elem2.id
            );
            
            if (matchingElem) {
                totalElements++;
                const style1 = elem1.style.toLowerCase();
                const style2 = matchingElem.style.toLowerCase();
                
                // Check for layout-affecting style differences
                styleKeywords.forEach(keyword => {
                    const hasStyle1 = style1.includes(keyword);
                    const hasStyle2 = style2.includes(keyword);
                    
                    if (hasStyle1 !== hasStyle2) {
                        styleDifferences++;
                    }
                });
            }
        });
    });
    
    const styleSimilarity = totalElements > 0 ? 
        Math.max(0, 100 - (styleDifferences / totalElements) * 100) : 100;
    
    return Math.round(styleSimilarity);
}

function compareVisualHierarchy(structure1, structure2) {
    // Compare heading hierarchy
    const headingLevels1 = structure1.headings.map(h => h.level);
    const headingLevels2 = structure2.headings.map(h => h.level);

    if (headingLevels1.length === 0 && headingLevels2.length === 0) return 100;
    if (headingLevels1.length === 0 || headingLevels2.length === 0) return 0;

    let totalSimilarity = 0;
    let totalComparisons = 0;

    headingLevels1.forEach(level1 => {
        let bestMatch = 0;
        headingLevels2.forEach(level2 => {
            const similarity = level1 === level2 ? 100 : Math.max(0, 100 - Math.abs(level1 - level2) * 20);
            if (similarity > bestMatch) {
                bestMatch = similarity;
            }
        });
        totalSimilarity += bestMatch;
        totalComparisons++;
    });

    return Math.round(totalSimilarity / totalComparisons);
}

function generateComparisonDetails(preGoLiveData, currentData) {
    const details = [];
    
    details.push(`Pre-Go-Live URL: ${preGoLiveData.url}`);
    details.push(`Current URL: ${currentData.url}`);
    details.push(`Pre-Go-Live Title: ${preGoLiveData.title}`);
    details.push(`Current Title: ${currentData.title}`);
    details.push(`Pre-Go-Live Elements: ${preGoLiveData.elements.length}`);
    details.push(`Current Elements: ${currentData.elements.length}`);
    details.push(`Pre-Go-Live Text Blocks: ${preGoLiveData.textContent.length}`);
    details.push(`Current Text Blocks: ${currentData.textContent.length}`);

    return details.join('<br>');
}

function updateProgress(percent) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    if (progressFill && progressText) {
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
    }
}

function exportReport(data) {
    try {
        const reportData = {
            ...data,
            exportDate: new Date().toISOString(),
            exportSource: 'DA Page Compare App'
        };
        
        const blob = new Blob([JSON.stringify(reportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `page-compare-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Report exported successfully');
    } catch (error) {
        console.error('Error exporting report:', error);
        showError('Failed to export report: ' + error.message);
    }
}

function showError(message) {
    const error = document.getElementById('error');
    if (error) {
        error.textContent = message;
        error.style.display = 'block';
    }
} 