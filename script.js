const timeDisplay = document.getElementById('time');
const settingsMenu = document.getElementById('clock-settings');
const header = document.getElementById('settings-header');
const fadeContainer = document.getElementById('fade-controls');

const colorPicker = document.getElementById('color-picker');
const colorPreview = document.getElementById('color-preview');
const glowSlider = document.getElementById('glow-slider');
const formatToggle = document.getElementById('format-toggle');
const secondsToggle = document.getElementById('seconds-toggle');
const pulseToggle = document.getElementById('pulse-toggle');

let fadeTimer;
let isDragging = false;
let offsetX, offsetY;

// --- 1. SETTINGS LOAD/SAVE ---
function applyColor(color) {
    document.documentElement.style.setProperty('--main-color', color);
    if (colorPreview) colorPreview.style.backgroundColor = color;
    localStorage.setItem('clockColor', color);
}

function applyGlow(val) {
    document.documentElement.style.setProperty('--glow-blur', val + 'px');
    localStorage.setItem('clockGlow', val);
}

const savedColor = localStorage.getItem('clockColor') || '#a616c0';
const savedGlow  = localStorage.getItem('clockGlow') || '15';
const savedSize  = localStorage.getItem('clockSize') || '5rem';

applyColor(savedColor);
applyGlow(savedGlow);
colorPicker.value = savedColor;
glowSlider.value = savedGlow;
timeDisplay.style.fontSize = savedSize;

const activeRadio = document.querySelector(`input[value="${savedSize}"]`);
if (activeRadio) activeRadio.checked = true;

formatToggle.checked = localStorage.getItem('use24H') === 'true';
secondsToggle.checked = (localStorage.getItem('showSec') ?? 'true') === 'true';
pulseToggle.checked = (localStorage.getItem('usePulse') ?? 'true') === 'true';

// --- 2. AUTO-FADE & CENTERING ---
function showUI() {
    fadeContainer.classList.remove('hidden-ui');
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {
        if (settingsMenu.style.display === 'none') {
            fadeContainer.classList.add('hidden-ui');
        }
    }, 5000);
}

['mousemove', 'keydown', 'mousedown'].forEach(ev => document.addEventListener(ev, showUI));

// --- 3. DRAGGING LOGIC ---
header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - settingsMenu.offsetLeft;
    offsetY = e.clientY - settingsMenu.offsetTop;
    header.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    settingsMenu.style.left = `${e.clientX - offsetX}px`;
    settingsMenu.style.top = `${e.clientY - offsetY}px`;
    settingsMenu.style.transform = 'none'; 
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    header.style.cursor = 'move';
});

// --- 4. UI LISTENERS ---
timeDisplay.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = settingsMenu.style.display === 'none';
    settingsMenu.style.display = isHidden ? 'block' : 'none';
    if (!isHidden) showUI();
});

colorPicker.addEventListener('input', (e) => applyColor(e.target.value));
glowSlider.addEventListener('input', (e) => applyGlow(e.target.value));

document.querySelectorAll('input[name="size-option"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        timeDisplay.style.fontSize = e.target.value;
        localStorage.setItem('clockSize', e.target.value);
    });
});

formatToggle.addEventListener('change', () => localStorage.setItem('use24H', formatToggle.checked));
secondsToggle.addEventListener('change', () => localStorage.setItem('showSec', secondsToggle.checked));
pulseToggle.addEventListener('change', () => localStorage.setItem('usePulse', pulseToggle.checked));

window.addEventListener('click', (e) => {
    if (!settingsMenu.contains(e.target) && e.target !== timeDisplay) {
        settingsMenu.style.display = 'none';
        showUI(); 
    }
});

// --- 5. CLOCK ENGINE (FIXED) ---
function updateClock() {
    const options = { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: !formatToggle.checked 
    };
    if (secondsToggle.checked) options.second = '2-digit';
    
    // Get time string
    let timeRaw = new Date().toLocaleTimeString([], options);
    
    // Samsung thin-colon logic: Wrap the colons in a span for CSS styling
    timeDisplay.innerHTML = timeRaw.replace(/:/g, '<span class="colon">:</span>');
}

setInterval(updateClock, 500);
updateClock();
showUI();