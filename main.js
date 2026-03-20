const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 700,
    height: 620,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('index.html');
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

// 파일 선택 다이얼로그
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'PDF 파일 선택',
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const stats = fs.statSync(filePath);
  return {
    path: filePath,
    name: path.basename(filePath),
    size: stats.size
  };
});

// 해시 계산 (스트림 기반 + 진행률)
ipcMain.handle('compute-hash', async (event, filePath, algorithm) => {
  return new Promise((resolve, reject) => {
    const stats = fs.statSync(filePath);
    const totalSize = stats.size;
    let processedSize = 0;

    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });

    stream.on('data', (chunk) => {
      hash.update(chunk);
      processedSize += chunk.length;
      const progress = Math.round((processedSize / totalSize) * 100);
      mainWindow.webContents.send('hash-progress', progress);
    });

    stream.on('end', () => {
      const hashValue = hash.digest('hex');
      resolve(hashValue);
    });

    stream.on('error', (err) => {
      reject(err.message);
    });
  });
});
