// --- DOM ELEMENTS ---
const root = document.documentElement;
const hElem = document.getElementById('h'),
      mElem = document.getElementById('m'),
      sWrap = document.getElementById('s-wrap');

const settingsMenu = document.getElementById('clock-settings'),
      header = document.getElementById('settings-header'),
      closeBtn = document.getElementById('close-settings-btn'),
      fadeControls = document.getElementById('fade-controls'),
      container = document.getElementById('clock-container');

const colorPicker = document.getElementById('color-picker'),
      glowSlider = document.getElementById('glow-slider'),
      formatToggle = document.getElementById('format-toggle'),
      secondsToggle = document.getElementById('seconds-toggle'),
      glowToggle = document.getElementById('glow-toggle'),
      layoutToggle = document.getElementById('layout-toggle'),
      themeToggle = document.getElementById('theme-toggle');

// --- STATE & VARS ---
let fadeTimer;
let isDragging = false;
let startX, startY, initialLeft, initialTop;

// --- CORE FUNCTIONS ---
const applyColor = (color) => {
    root.style.setProperty('--main-color', color);
    localStorage.setItem('clockColor', color);
};

const applyGlow = (val) => {
    root.style.setProperty('--glow-blur', `${val}px`);
    localStorage.setItem('clockGlow', val);
};

const updateGlowState = () => {
    container.classList.toggle('no-glow', !glowToggle.checked);
};

const setClockSize = (sizeValue) => {
    root.style.setProperty('--applied-size', sizeValue);
    localStorage.setItem('clockSize', sizeValue);
};

const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        root.requestFullscreen().catch(console.error);
    } else {
        document.exitFullscreen();
    }
};

const showUI = () => {
    container.classList.remove('hidden-ui');
    fadeControls.classList.remove('hidden-ui');
    clearTimeout(fadeTimer);
    
    fadeTimer = setTimeout(() => {
        if (settingsMenu.style.display !== 'block') {
            container.classList.add('hidden-ui');
            fadeControls.classList.add('hidden-ui');
        }
    }, 6000);
};

// --- INITIALIZATION ---
const init = () => {
    const savedColor = localStorage.getItem('clockColor') || '#a616c0';
    const savedGlow  = localStorage.getItem('clockGlow') || '15';
    const savedSize  = localStorage.getItem('clockSize') || '8rem';
    const savedTheme = localStorage.getItem('theme') || 'dark';

    // Apply Styles
    applyColor(savedColor);
    applyGlow(savedGlow);
    setClockSize(savedSize);
    colorPicker.value = savedColor;
    glowSlider.value = savedGlow;

    // Apply Theme
    if (savedTheme === 'light') {
        root.setAttribute('data-theme', 'light');
        themeToggle.checked = true;
    }

    // Apply Toggles
    formatToggle.checked = localStorage.getItem('use24H') === 'true';
    secondsToggle.checked = (localStorage.getItem('showSec') ?? 'true') === 'true';
    glowToggle.checked = (localStorage.getItem('useGlow') ?? 'true') === 'true';
    layoutToggle.checked = localStorage.getItem('isStacked') === 'true';

    const activeRadio = document.querySelector(`input[value="${savedSize}"]`);
    if (activeRadio) activeRadio.checked = true;

    updateGlowState();
    updateClock();
    showUI();
};

// --- EVENT HANDLERS ---
themeToggle.onchange = () => {
    const theme = themeToggle.checked ? 'light' : 'dark';
    theme === 'light' ? root.setAttribute('data-theme', 'light') : root.removeAttribute('data-theme');
    localStorage.setItem('theme', theme);
};

header.onpointerdown = (e) => {
    isDragging = true;
    const rect = settingsMenu.getBoundingClientRect();
    startX = e.clientX; 
    startY = e.clientY;
    initialLeft = rect.left; 
    initialTop = rect.top;
    header.setPointerCapture(e.pointerId);
};

header.onpointermove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    // We remove the translate and use absolute positioning for precision
    settingsMenu.style.transform = "none";
    settingsMenu.style.margin = "0";
    settingsMenu.style.left = `${initialLeft + dx}px`;
    settingsMenu.style.top = `${initialTop + dy}px`;
};

header.onpointerup = (e) => { 
    isDragging = false; 
    header.releasePointerCapture(e.pointerId); 
};

document.getElementById('time').onclick = (e) => { 
    e.stopPropagation(); 
    const isVisible = settingsMenu.style.display === 'block';
    settingsMenu.style.display = isVisible ? 'none' : 'block'; 
};

closeBtn.onclick = () => {
    settingsMenu.style.display = 'none';
    showUI();
};

// Toggle event listeners
colorPicker.oninput = (e) => applyColor(e.target.value);
glowSlider.oninput = (e) => applyGlow(e.target.value);
formatToggle.onchange = () => localStorage.setItem('use24H', formatToggle.checked);
secondsToggle.onchange = () => localStorage.setItem('showSec', secondsToggle.checked);
layoutToggle.onchange = () => localStorage.setItem('isStacked', layoutToggle.checked);
glowToggle.onchange = () => {
    localStorage.setItem('useGlow', glowToggle.checked);
    updateGlowState();
};

document.querySelectorAll('input[name="size-option"]').forEach(radio => {
    radio.onchange = (e) => setClockSize(e.target.value);
});

// Global listeners
['pointermove', 'pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, showUI));
document.addEventListener('dblclick', toggleFullscreen);

// Click outside to close settings
document.addEventListener('pointerdown', (e) => {
    if (settingsMenu.style.display === 'block' && !settingsMenu.contains(e.target) && !document.getElementById('time').contains(e.target)) {
        settingsMenu.style.display = 'none';
        showUI();
    }
});

// --- CLOCK ENGINE ---
function updateClock() {
    const now = new Date();
    container.classList.toggle('stacked', layoutToggle.checked);
    
    let h = now.getHours();
    if (!formatToggle.checked) h = h % 12 || 12;
    
    const hStr = h.toString().padStart(2, '0');
    const mStr = now.getMinutes().toString().padStart(2, '0');
    const sStr = now.getSeconds().toString().padStart(2, '0');

    if(hElem.innerText !== hStr) hElem.innerText = hStr;
    if(mElem.innerText !== mStr) mElem.innerText = mStr;

    let newHTML = "";
    if (secondsToggle.checked) {
        newHTML = layoutToggle.checked 
            ? `<div class="stacked-sec">${sStr}</div>` 
            : `<span class="colon">:</span>${sStr}`;
    }
    
    if (sWrap.innerHTML !== newHTML) sWrap.innerHTML = newHTML;
}

// Start
setInterval(updateClock, 1000);
init();