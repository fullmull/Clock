const timeDisplay = document.getElementById('time');
const settingsMenu = document.getElementById('clock-settings');
const header = document.getElementById('settings-header');
const fadeControls = document.getElementById('fade-controls');
const colorPicker = document.getElementById('color-picker');
const colorPreview = document.getElementById('color-preview');
const glowSlider = document.getElementById('glow-slider');
const formatToggle = document.getElementById('format-toggle');
const secondsToggle = document.getElementById('seconds-toggle');
const glowToggle = document.getElementById('glow-toggle');
const layoutToggle = document.getElementById('layout-toggle');
const container = document.getElementById('clock-container');
const doneBtn = document.getElementById('done-btn');

let fadeTimer;
let isDragging = false;
let startX, startY, initialLeft, initialTop;

function applyColor(color) {
    document.documentElement.style.setProperty('--main-color', color);
    if (colorPreview) colorPreview.style.backgroundColor = color;
    if (doneBtn) doneBtn.style.backgroundColor = color;
    localStorage.setItem('clockColor', color);
}

function applyGlow(val) {
    document.documentElement.style.setProperty('--glow-blur', val + 'px');
    localStorage.setItem('clockGlow', val);
}

function updateGlowState() {
    container.classList.toggle('no-glow', !glowToggle.checked);
}

function setClockSize(sizeValue) {
    document.documentElement.style.setProperty('--applied-size', sizeValue);
    localStorage.setItem('clockSize', sizeValue);
}

// Initial Load
const savedColor = localStorage.getItem('clockColor') || '#a616c0';
const savedGlow  = localStorage.getItem('clockGlow') || '15';
const savedSize  = localStorage.getItem('clockSize') || '8rem';

applyColor(savedColor);
applyGlow(savedGlow);
setClockSize(savedSize);

colorPicker.value = savedColor;
glowSlider.value = savedGlow;

const activeRadio = document.querySelector(`input[value="${savedSize}"]`);
if (activeRadio) activeRadio.checked = true;

// Initialize toggles from storage
formatToggle.checked = localStorage.getItem('use24H') === 'true';
secondsToggle.checked = (localStorage.getItem('showSec') ?? 'true') === 'true';
glowToggle.checked = (localStorage.getItem('useGlow') ?? 'true') === 'true';
layoutToggle.checked = localStorage.getItem('isStacked') === 'true';

// Apply initial states
updateGlowState();

function showUI() {
    container.classList.remove('hidden-ui');
    fadeControls.classList.remove('hidden-ui');
    
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {
        // Only hide if the settings menu isn't open
        if (settingsMenu.style.display === 'none') {
            container.classList.add('hidden-ui');
            fadeControls.classList.add('hidden-ui');
        }
    }, 5000);
}

// Show UI on mouse move or touch
['pointermove', 'pointerdown'].forEach(ev => document.addEventListener(ev, showUI));

// Dragging Logic for Settings Menu
header.onpointerdown = (e) => {
    isDragging = true;
    startX = e.clientX; startY = e.clientY;
    const rect = settingsMenu.getBoundingClientRect();
    initialLeft = rect.left; initialTop = rect.top;
    header.setPointerCapture(e.pointerId);
};

header.onpointermove = (e) => {
    if (!isDragging) return;
    settingsMenu.style.left = `${initialLeft + (e.clientX - startX) + (settingsMenu.offsetWidth / 2)}px`;
    settingsMenu.style.top = `${initialTop + (e.clientY - startY) + (settingsMenu.offsetHeight / 2)}px`;
    settingsMenu.style.transform = "translate(-50%, -50%)";
    settingsMenu.style.margin = "0";
};

header.onpointerup = (e) => { isDragging = false; header.releasePointerCapture(e.pointerId); };

// Buttons and Interactions
timeDisplay.onclick = (e) => { e.stopPropagation(); settingsMenu.style.display = 'block'; };
doneBtn.onclick = () => { settingsMenu.style.display = 'none'; showUI(); };

colorPicker.oninput = (e) => applyColor(e.target.value);
glowSlider.oninput = (e) => applyGlow(e.target.value);

document.querySelectorAll('input[name="size-option"]').forEach(radio => {
    radio.onchange = (e) => setClockSize(e.target.value);
});

// Update localStorage when toggles change
formatToggle.onchange = () => localStorage.setItem('use24H', formatToggle.checked);
secondsToggle.onchange = () => localStorage.setItem('showSec', secondsToggle.checked);
layoutToggle.onchange = () => localStorage.setItem('isStacked', layoutToggle.checked);
glowToggle.onchange = () => {
    localStorage.setItem('useGlow', glowToggle.checked);
    updateGlowState();
};

// Main Clock Update Function
function updateClock() {
    const now = new Date();
    
    // Apply layout state
    container.classList.toggle('stacked', layoutToggle.checked);
    
    let h = now.getHours();
    if (!formatToggle.checked) h = h % 12 || 12;
    h = h.toString().padStart(2, '0');
    let m = now.getMinutes().toString().padStart(2, '0');
    let s = now.getSeconds().toString().padStart(2, '0');

    if (layoutToggle.checked) {
        timeDisplay.innerHTML = `<div>${h}</div><div>${m}</div>`;
    } else {
        let res = `${h}:${m}`;
        if (secondsToggle.checked) res += `:${s}`;
        timeDisplay.innerHTML = res.replace(/:/g, '<span class="colon">:</span>');
    }
}

// Start Clock
setInterval(updateClock, 1000);
updateClock();
showUI();