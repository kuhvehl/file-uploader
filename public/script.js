// JavaScript to handle folder selection and display files
const folderSelect = document.getElementById('folder-select');
const folderActions = document.getElementById('folder-actions');
const renameFolderBtn = document.getElementById('rename-folder-btn');
const deleteFolderBtn = document.getElementById('delete-folder-btn');
const fileList = document.getElementById('files');
const fileItems = fileList ? fileList.querySelectorAll('li') : [];

// Get the selected folder ID from the hidden input
const selectedFolderId = document.getElementById('selected-folder-id').value;
let selectedFolderIdState = selectedFolderId;

folderSelect.value = selectedFolderIdState; // Set the dropdown to the selected folder ID

folderSelect.addEventListener('change', (e) => {
  selectedFolderIdState = e.target.value;
  updateFileListVisibility();
});

// Function to update file list visibility based on selected folder
function updateFileListVisibility() {
  let filesVisible = false;

  // Show folder action buttons if a folder is selected
  if (selectedFolderIdState !== 'all') {
    folderActions.style.display = 'flex';
    folderActions.style.justifyContent = 'space-around';
  } else {
    folderActions.style.display = 'none';
  }

  fileItems.forEach((item) => {
    const folderId = item.getAttribute('data-folder-id');

    // Show all files if "All" is selected, otherwise show only files for the selected folder
    if (selectedFolderIdState === 'all' || folderId === selectedFolderIdState) {
      item.style.display = 'block';
      filesVisible = true;
    } else {
      item.style.display = 'none';
    }
  });

  // If no files are visible after filtering, show the "No files" message
  if (!filesVisible) {
    fileList.innerHTML = "<p>You don't have any files in this folder.</p>";
  } else {
    // Reset file list if files are visible
    fileList.innerHTML = ''; // Clear the previous "no files" message
    fileItems.forEach((item) => {
      // Re-add all file items (you may need to append them again)
      fileList.appendChild(item);
    });
  }
}

// Call the function to update file list visibility on page load
updateFileListVisibility();

// Handle folder renaming
renameFolderBtn.addEventListener('click', () => {
  const newName = prompt('Enter a new name for the folder:');
  if (newName) {
    // Send request to update folder name
    fetch(`/folders/${selectedFolderIdState}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName }),
    })
      .then((response) => {
        if (response.ok) {
          // Reload the page to reflect the new name
          window.location.reload();
        }
      })
      .catch((error) => console.error('Error updating folder:', error));
  }
});

// Handle folder deletion
deleteFolderBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to delete this folder?')) {
    // Send request to delete folder
    fetch(`/folders/${selectedFolderIdState}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (response.ok) {
          // Reload the page to reflect the deletion
          window.location.reload();
        }
      })
      .catch((error) => console.error('Error deleting folder:', error));
  }
});

function moveFileToFolder(fileId, folderId) {
  fetch(`/files/${fileId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ folderId }),
  })
    .then((response) => {
      if (response.ok) {
        // Find the file element in the DOM
        const fileElement = document.querySelector(
          `li[data-file-id="${fileId}"]`
        );

        // If moving to "no folder", set data-folder-id to "no-folder"
        const newFolderId = folderId || 'no-folder';

        // Update the file element's folder ID attribute
        fileElement.setAttribute('data-folder-id', newFolderId);

        // Check if the selected folder matches the current view
        if (
          newFolderId !== selectedFolderIdState &&
          selectedFolderIdState !== 'all'
        ) {
          // Hide the file if it no longer belongs to the currently selected folder
          fileElement.style.display = 'none';
        }
      } else {
        console.error('Error moving file:', response.statusText);
      }
    })
    .catch((error) => console.error('Error moving file:', error));
}

function deleteFile(fileId) {
  fetch(`/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        window.location.reload(); // Reloads the dashboard
      } else {
        alert('Error: ' + data.error);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}
