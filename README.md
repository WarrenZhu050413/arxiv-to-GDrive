# Paper-to-GDrive

This is a Chrome extension designed to download papers directly to your Google Drive. The folder downloaded can be specified by the user via the Chrome icon popup.

The motivation for developing this extension is to enable better collaboration with Gemini Advanced's GDrive integration to search for research works.

(Note: I am personally new to javascript. Most of the code is written with the help of Gemini 2.5 pro. Do not trust it completely.)

The repository is built on top of https://github.com/yoheikikuta/arxiv-pdf-downloader by yoheikikuta. Currently, it added folder organization functionality beyond the original implementation, and adds websites beyond arXiv.

Supported Websites:

* arXiv
* ACM
* NSDI

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
- **Save Paper with Custom Title:** Use **[CMD+X]** instead of **[CMD+E]** to save with custom titles.
- **Set Google Drive Path:** Use **[CMD+SHIFT+P] (for MAC) or [CTRL+SHIFT+P] (for OTHERS)** to quickly set the target folder path in Google Drive. This opens a small popup where the input field is automatically focused. Type your desired path (e.g., \`research/papers/nlp\` or leave blank to use the default \`papers\`) and press **Enter** to save and close the popup.
- **Default Path:** If no path is set, papers will be saved to a folder named \`papers\` in the root of your Google Drive.

