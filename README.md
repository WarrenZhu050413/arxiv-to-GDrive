# Paper-to-GDrive

A Chrome extension that seamlessly downloads academic papers and web content directly to your Google Drive with intelligent organization and naming.

## Motivation

As AI models become increasingly sophisticated with longer context windows, having a centralized, searchable repository of research papers and web content is becoming essential for productive research workflows. This extension bridges the gap between discovering valuable content online and building a comprehensive knowledge base that can be leveraged by AI tools like Gemini Advanced's Google Drive integration.

The inspiration for this project came from two key realizations:
1. **Future-proofing research workflows**: The most productive researchers will be those who've optimized their workflows for AI collaboration, just as previous generations learned to optimize for search engines and databases.
2. **Data resilience**: After losing years of downloaded papers and books due to a corrupted local file system during an iCloud migration, I recognized the critical importance of cloud-based, organized storage for research materials.

This extension transforms the tedious process of manually downloading, renaming, and organizing papers into a one-click operation, while supporting a wide range of academic sources and even arbitrary web content.

Supported websites:
* arXiv
* ACM
* NSDI
* Any other webpage (saved as HTML)

*Note: This project builds upon the excellent foundation of [arxiv-pdf-downloader](https://github.com/yoheikikuta/arxiv-pdf-downloader) by yoheikikuta, extending it with folder organization, multi-platform support, and enhanced functionality.*

<p align="center">
  <img src="https://imgur.com/utyIndE.gif" />
</p>

## How to install
- Clone this repository.
- Load this extentsion through `Load unpacked`.
  ![chrome extension](https://imgur.com/GIaa4bi.png)
  - FYI: https://support.google.com/chrome/a/answer/2714278
- Enable the Google Drive API at https://console.developers.google.com/apis.
- Create credentials (OAuth 2.0 client ID).
  ![Google Cloud credentials](https://imgur.com/xqVtmCM.png)
  - The Item ID of the credential should match the one in `chrome://extensions/`.
- Set your Client ID obtained from the credential into `manifest.json`.
- Add your own email as a Test user to the GDrive App that the credentials links to.
- Allow notifications.
  - On PC
    ![PC setting](https://imgur.com/gDlX2JV.png)
  - For the chrome extension
    ![chrome extension setting](https://imgur.com/U217UbL.png)

## USAGE

- Perform interactive authentication the first time.
- **Save Paper:** Use **[CMD+E] (for MAC) or [CTRL+SHIFT+E] (for OTHERS)** on supported paper pages (arXiv abstract/PDF, ACM abstract/PDF, NSDI) to save the paper to your specified Google Drive path.
- **Save Webpage as HTML:** Use the same shortcut **[CMD+E] (for MAC) or [CTRL+SHIFT+E] (for OTHERS)** on any unsupported webpage to save it as HTML to your Google Drive.
- **Save Paper with Custom Title:** Use **[CMD+X]** instead of **[CMD+E]** to save with custom titles.
- **Set Google Drive Path:** Use **[CMD+SHIFT+P] (for MAC) or [CTRL+SHIFT+P] (for OTHERS)** to quickly set the target folder path in Google Drive. This opens a small popup where the input field is automatically focused. Type your desired path (e.g., \`research/papers/nlp\` or leave blank to use the default \`papers\`) and press **Enter** to save and close the popup.
- **Default Path:** If no path is set, papers will be saved to a folder named \`papers\` in the root of your Google Drive.

