# Page Compare - Document Authoring App

A Document Authoring (DA) application that compares pre-go-live pages with current site pages for content and placement matching. This app provides the same functionality as the Chrome extension but integrated into the DA environment.

## Features

- **Content Analysis**: Compares text content, headings, and metadata between pages
- **Layout Analysis**: Analyzes element positioning and visual hierarchy
- **Progress Tracking**: Real-time progress updates during comparison
- **Export Reports**: Export detailed comparison reports as JSON files
- **DA Integration**: Fully integrated with Document Authoring environment
- **Context Display**: Shows DA context information for better integration

## Setup

### 1. File Structure

Ensure your files are organized as follows:

```
tools/
├── page-compare.html          # Main HTML file
└── page-compare/
    ├── page-compare.js        # JavaScript logic
    └── README.md              # This file
```

### 2. DA App Configuration

The app follows the DA App SDK structure:

- **HTML**: `tools/page-compare.html` - Main interface
- **JavaScript**: `tools/page-compare/page-compare.js` - App logic
- **SDK**: Imports `https://da.live/nx/utils/sdk.js`

### 3. Access URLs

- **Development**: `https://da.live/app/{{ORG}}/{{SITE}}/tools/page-compare?ref=local`
- **Production**: `https://da.live/app/{{ORG}}/{{SITE}}/tools/page-compare`

## Usage

### 1. Input Fields

- **Pre-Go-Live URL**: Enter the URL of the pre-go-live page you want to compare
- **Current Site URL**: Enter the URL of the current live page
- **Success Threshold**: Set the percentage threshold for passing comparison (default: 90%)

### 2. Comparison Process

1. Fill in both URLs and set your desired threshold
2. Click "Compare Pages" to start the analysis
3. Monitor progress in real-time
4. View results with detailed breakdown

### 3. Results Analysis

The app provides:

- **Overall Score**: Weighted average of content and layout scores
- **Content Score**: Text content, headings, and metadata similarity
- **Layout Score**: Element positioning and visual hierarchy analysis
- **Detailed Breakdown**: Specific areas of similarity and differences

### 4. Export Options

- **Clear Results**: Remove current comparison results
- **Export Report**: Download detailed JSON report with all analysis data

## Technical Details

### Comparison Algorithm

The app uses the same sophisticated comparison algorithm as the Chrome extension:

1. **Content Analysis (60% weight)**:
   - Title similarity (10%)
   - Text content similarity (40%)
   - Structure similarity (30%)
   - Metadata similarity (20%)

2. **Layout Analysis (40% weight)**:
   - Element positioning (50%)
   - Layout structure (30%)
   - Visual hierarchy (15%)
   - Styling differences (15%)

### Data Processing

- **HTML Parsing**: Regex-based parsing for cross-origin compatibility
- **Text Extraction**: Extracts text from headings, paragraphs, links, and other elements
- **Structure Analysis**: Analyzes page structure including headings, lists, and containers
- **Similarity Calculation**: Uses Levenshtein distance for text similarity

### DA Integration

- **Context Display**: Shows DA context information at the top of the app
- **SDK Integration**: Uses DA App SDK for authentication and context
- **Local Storage**: Saves settings and results locally for persistence
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Development

### Local Development

To develop locally:

1. Set up your local development environment
2. Use `ref=local` parameter: `https://da.live/app/{{ORG}}/{{SITE}}/tools/page-compare?ref=local`
3. DA will iframe your app at `http://localhost:3000`

### Testing

Test the app with various page types:

- **Simple pages**: Basic HTML content
- **Complex pages**: Pages with dynamic content
- **Different layouts**: Pages with varying structures
- **Cross-origin**: Pages from different domains

### Debugging

- Check browser console for detailed logs
- Monitor network requests for page fetching
- Review localStorage for saved data
- Use browser dev tools for performance analysis

## Configuration

### Apps Sheet Configuration

To make the app available in DA, add it to your site config:

```json
{
  "title": "Page Compare",
  "description": "Compare pre-go-live pages with current site pages",
  "image": "https://your-site.aem.live/img/tools/page-compare.jpg",
  "path": "https://da.live/app/{{ORG}}/{{SITE}}/tools/page-compare"
}
```

### Customization

You can customize the app by modifying:

- **Styling**: Update CSS in the HTML file
- **Algorithm**: Modify comparison weights in the JavaScript
- **UI Elements**: Add or remove features as needed
- **Export Format**: Change the export format or add new export options

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure pages are accessible from the DA environment
2. **Timeout Issues**: Large pages may take longer to process
3. **Memory Issues**: Very large pages might cause performance issues
4. **Network Errors**: Check internet connectivity and page availability

### Error Messages

- **"Please enter both URLs"**: Fill in both URL fields
- **"Failed to fetch page"**: Check URL validity and accessibility
- **"Invalid threshold"**: Ensure threshold is between 0-100
- **"No results to export"**: Run a comparison first

## Security Considerations

- **Cross-Origin Requests**: App handles CORS appropriately
- **Data Privacy**: No data is sent to external servers
- **Local Storage**: All data is stored locally in the browser
- **Input Validation**: All user inputs are validated

## Performance

- **Optimized Parsing**: Efficient regex-based HTML parsing
- **Progress Updates**: Real-time progress feedback
- **Memory Management**: Efficient memory usage for large pages
- **Caching**: Local storage for settings and results

## Future Enhancements

Potential improvements:

- **Batch Processing**: Compare multiple pages at once
- **Visual Diff**: Side-by-side visual comparison
- **Screenshot Comparison**: Visual layout comparison
- **API Integration**: Connect to external comparison services
- **Advanced Filters**: Filter comparison by specific elements
- **Historical Tracking**: Track changes over time

## Support

For issues or questions:

1. Check the browser console for error messages
2. Verify URL accessibility and format
3. Test with simpler pages first
4. Review the comparison algorithm documentation

---

**Note**: This DA app provides the same powerful page comparison functionality as the Chrome extension, but integrated seamlessly into the Document Authoring environment for better workflow integration. 