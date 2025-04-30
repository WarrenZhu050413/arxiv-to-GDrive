const folderPathInput = document.getElementById('folderPathInput');
const saveButton = document.getElementById('savePathButton');
const statusDiv = document.getElementById('status');

// Load the saved folder path when the popup opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['driveFolderPath'], (result) => {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving folder path:", chrome.runtime.lastError);
      statusDiv.textContent = 'Error loading settings.';
      statusDiv.style.color = 'red';
    } else if (result.driveFolderPath) {
      folderPathInput.value = result.driveFolderPath;
    } else {
      // Set a default placeholder if nothing is saved yet
      folderPathInput.placeholder = 'Default: papers';
      folderPathInput.value = 'papers'; // Also set default value
    }
  });
});

// Save the folder path when the button is clicked
saveButton.addEventListener('click', () => {
  // Basic path cleanup: remove leading/trailing slashes and spaces
  const folderPath = folderPathInput.value.trim().replace(/^\/+|\/+$/g, '');

  if (folderPath) {
    chrome.storage.sync.set({ driveFolderPath: folderPath }, () => { // Changed key
      if (chrome.runtime.lastError) {
        console.error("Error saving folder path:", chrome.runtime.lastError);
        statusDiv.textContent = 'Error saving settings.';
        statusDiv.style.color = 'red';
      } else {
        console.log('Folder path saved:', folderPath);
        statusDiv.textContent = 'Folder path saved!';
        statusDiv.style.color = 'green';
        // Clear the status message after a few seconds
        setTimeout(() => { statusDiv.textContent = ''; }, 3000);
      }
    });
  } else {
    // If the input is empty, reset to default 'arXiv'
     chrome.storage.sync.set({ driveFolderPath: 'papers' }, () => { // Changed key
        statusDiv.textContent = 'Path cannot be empty. Reset to default "papers".';
        statusDiv.style.color = 'orange';
         folderPathInput.value = 'papers'; // Reset input field too
         setTimeout(() => { statusDiv.textContent = ''; }, 3000);
     });
  }
});