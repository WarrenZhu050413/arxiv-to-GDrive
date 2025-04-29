const folderInput = document.getElementById('folderNameInput');
const saveButton = document.getElementById('saveFolderButton');
const statusDiv = document.getElementById('status');

// Load the saved folder name when the popup opens
document.addEventListener('DOMContentLoaded', () => {
  // Use 'sync' to allow settings to sync across devices if the user is signed into Chrome
  // Use 'local' if you only want settings saved on the current device
  chrome.storage.sync.get(['driveFolderName'], (result) => {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving folder name:", chrome.runtime.lastError);
      statusDiv.textContent = 'Error loading settings.';
      statusDiv.style.color = 'red';
    } else if (result.driveFolderName) {
      folderInput.value = result.driveFolderName;
    } else {
      // Optional: Set a default placeholder if nothing is saved yet
      folderInput.placeholder = 'Default: arXiv';
    }
  });
});

// Save the folder name when the button is clicked
saveButton.addEventListener('click', () => {
  const folderName = folderInput.value.trim();
  if (folderName) {
    chrome.storage.sync.set({ driveFolderName: folderName }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving folder name:", chrome.runtime.lastError);
        statusDiv.textContent = 'Error saving settings.';
        statusDiv.style.color = 'red';
      } else {
        console.log('Folder name saved:', folderName);
        statusDiv.textContent = 'Folder name saved!';
        statusDiv.style.color = 'green';
        // Clear the status message after a few seconds
        setTimeout(() => { statusDiv.textContent = ''; }, 3000);
      }
    });
  } else {
    // If the input is empty, maybe remove the setting or set a default?
    // For now, let's just inform the user it's saved (as empty/default state)
    // Or remove the setting: chrome.storage.sync.remove('driveFolderName', ...)
     chrome.storage.sync.set({ driveFolderName: 'arXiv' }, () => { // Save 'arXiv' as default if empty
        statusDiv.textContent = 'Folder name reset to default "arXiv".';
        statusDiv.style.color = 'orange';
         folderInput.value = 'arXiv';
         setTimeout(() => { statusDiv.textContent = ''; }, 3000);
     });
  }
});