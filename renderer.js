const selectFileBtn = document.getElementById('selectFileBtn');
const filePathEl = document.getElementById('filePath');
const fileInfoEl = document.getElementById('fileInfo');
const expectedHashInput = document.getElementById('expectedHash');
const verifyBtn = document.getElementById('verifyBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultDetail = document.getElementById('resultDetail');

let selectedFile = null;

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function getSelectedAlgorithm() {
  return document.querySelector('input[name="algorithm"]:checked').value;
}

function updateVerifyButton() {
  verifyBtn.disabled = !(selectedFile && expectedHashInput.value.trim());
}

// 파일 선택
selectFileBtn.addEventListener('click', async () => {
  const file = await window.electronAPI.selectFile();
  if (file) {
    selectedFile = file;
    filePathEl.textContent = file.path;
    filePathEl.classList.add('has-file');
    fileInfoEl.textContent = `파일명: ${file.name} | 크기: ${formatFileSize(file.size)}`;
    updateVerifyButton();
    // 새 파일 선택 시 이전 결과 숨기기
    resultSection.classList.remove('visible', 'match', 'mismatch');
  }
});

expectedHashInput.addEventListener('input', updateVerifyButton);

// 진행률 업데이트
window.electronAPI.onHashProgress((progress) => {
  progressFill.style.width = progress + '%';
  progressText.textContent = progress + '%';
});

// 검증 시작
verifyBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  const expectedHash = expectedHashInput.value.trim().toLowerCase();
  const algorithm = getSelectedAlgorithm();

  // UI 상태 초기화
  verifyBtn.disabled = true;
  verifyBtn.textContent = '검증 중...';
  selectFileBtn.disabled = true;
  progressFill.style.width = '0%';
  progressText.textContent = '0%';
  progressSection.classList.add('visible');
  resultSection.classList.remove('visible', 'match', 'mismatch');

  try {
    const computedHash = await window.electronAPI.computeHash(selectedFile.path, algorithm);
    const isMatch = computedHash === expectedHash;

    // 결과 표시
    resultSection.classList.add('visible');

    if (isMatch) {
      resultSection.classList.add('match');
      resultIcon.textContent = '\u2705';
      resultTitle.textContent = '일치 - 파일이 변조되지 않았습니다';
    } else {
      resultSection.classList.add('mismatch');
      resultIcon.textContent = '\u274C';
      resultTitle.textContent = '불일치 - 파일이 변조되었을 수 있습니다';
    }

    const algorithmLabel = algorithm.toUpperCase().replace('SHA', 'SHA-');
    resultDetail.innerHTML =
      `<strong>알고리즘:</strong> ${algorithmLabel}<br>` +
      `<strong>계산된 해시:</strong> ${computedHash}<br>` +
      `<strong>입력된 해시:</strong> ${expectedHash}`;

  } catch (err) {
    resultSection.classList.add('visible', 'mismatch');
    resultIcon.textContent = '\u26A0\uFE0F';
    resultTitle.textContent = '오류 발생';
    resultDetail.textContent = err;
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.textContent = '검증 시작';
    selectFileBtn.disabled = false;
  }
});
