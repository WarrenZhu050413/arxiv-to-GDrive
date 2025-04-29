# arxiv-pdf-downloader

This is a Chrome extension designed to download PDFs published on arXiv directly to your Google Drive. The folder downloaded can be specified by the user via the Chrome icon popup.

The motivation for developing this extension is to enable better collaboration with Gemini Advanced's GDrive integration to search for research works.

(Note: I am personally new to javascript. Most of the code is written with the help of Gemini 2.5 pro. Do not trust it completely.)

The repository is built on top of https://github.com/yoheikikuta/arxiv-pdf-downloader by yoheikikuta. Currently, it added folder organization functionality beyond the original implementation.

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
- Set your Client ID obtained from the credential into `manifest.json`.
- Add your own email as a Test user to the GDrive App that the credentials links to.
- Allow notifications.
  - On PC
    ![PC setting](https://imgur.com/gDlX2JV.png)
  - For the chrome extension
    ![chrome extension setting](https://imgur.com/U217UbL.png)

## USAGE
- **[CMD + B] (for MAC) or [CTRL + SHIFT + B] (for OTHERS)** on arXiv abstract or PDF pages (you can change the shortcut command in `manifest.json`).
- Perform interactive authentication the first time.
- You can see an `arXiv` directory in your Google Drive that includes the uploaded paper PDF.
