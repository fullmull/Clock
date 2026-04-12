const root = document.documentElement;
const container = document.getElementById('clock-container');
const hElem = document.getElementById('h');
const mElem = document.getElementById('m');
const sWrap = document.getElementById('s-wrap');
const fadeControls = document.getElementById('fade-controls');
const settingsMenu = document.getElementById('clock-settings');
const header = document.getElementById('settings-header');
const closeBtn = document.getElementById('close-settings-btn');
const colorPicker = document.getElementById('color-picker');
const glowSlider = document.getElementById('glow-slider');
const formatToggle = document.getElementById('format-toggle');
const secondsToggle = document.getElementById('seconds-toggle');
const glowToggle = document.getElementById('glow-toggle');
const layoutToggle = document.getElementById('layout-toggle');
const themeToggle = document.getElementById('theme-toggle');
const rainbowOrbitToggle = document.getElementById('rainbow-orbit-toggle');
const slideshowToggle = document.getElementById('slideshow-toggle');
const slide1 = document.getElementById('slide-1');
const slide2 = document.getElementById('slide-2');
const favicon = document.getElementById('favicon');
const canvas = document.createElement('canvas');

canvas.width = 32;
canvas.height = 32;
const ctx = canvas.getContext('2d');

let fadeTimer;
let isDragging = false;
let offsetX, offsetY;
let slideshowInterval;
let isSlideshowActive = false;
let activeLayer = 1;
let dynamicImageQueue = [];

async function fetchImageBatch() {
    try {
        const response = await fetch('/api/get-images');
        if (!response.ok) throw new Error("Backend failed");
        const data = await response.json();
        dynamicImageQueue = data.map(photo => photo.urls.regular);
    } catch (error) {
        dynamicImageQueue = [];
    }
}

const applyColor = (color) => {
    root.style.setProperty('--main-color', color);
    localStorage.setItem('clockColor', color);
};

const applyGlow = (val) => {
    root.style.setProperty('--glow-blur', `${val}px`);
    localStorage.setItem('clockGlow', val);
};

const setClockSize = (sizeValue) => {
    root.style.setProperty('--applied-size', sizeValue);
    localStorage.setItem('clockSize', sizeValue);
};

const updateGlowState = () => {
    container.classList.toggle('no-glow', !glowToggle.checked);
};

const updateRainbowOrbitState = () => {
    container.classList.toggle('rainbow-orbit', rainbowOrbitToggle.checked);
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
    }, 5000);
};

const centerMenu = () => {
    settingsMenu.style.visibility = 'hidden';
    settingsMenu.style.display = 'block';
    
    const x = (window.innerWidth - settingsMenu.offsetWidth) / 2;
    const y = (window.innerHeight - settingsMenu.offsetHeight) / 2;
    
    settingsMenu.style.left = `${x}px`;
    settingsMenu.style.top = `${y}px`;
    settingsMenu.style.visibility = 'visible';
};

header.onpointerdown = (e) => {
    isDragging = true;
    const rect = settingsMenu.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    header.setPointerCapture(e.pointerId);
};

header.onpointermove = (e) => {
    if (!isDragging) return;
    let newX = Math.max(0, Math.min(e.clientX - offsetX, window.innerWidth - settingsMenu.offsetWidth));
    let newY = Math.max(0, Math.min(e.clientY - offsetY, window.innerHeight - settingsMenu.offsetHeight));
    settingsMenu.style.left = `${newX}px`;
    settingsMenu.style.top = `${newY}px`;
};

header.onpointerup = (e) => { 
    isDragging = false; 
    header.releasePointerCapture(e.pointerId); 
};

document.getElementById('time').onclick = (e) => { 
    e.stopPropagation(); 
    if (settingsMenu.style.display !== 'block') {
        centerMenu();
    } else {
        settingsMenu.style.display = 'none';
    }
};

closeBtn.onclick = () => {
    settingsMenu.style.display = 'none';
    showUI();
};

async function changeImage() {
    if (!isSlideshowActive) return;

    if (dynamicImageQueue.length === 0) {
        await fetchImageBatch();
    }

    if (dynamicImageQueue.length === 0) {
        slide1.style.opacity = 0;
        slide2.style.opacity = 0;
        return; 
    }

    const nextImage = dynamicImageQueue.pop();

    if (activeLayer === 1) {
        slide2.style.backgroundImage = `url('${nextImage}')`;
        slide2.style.opacity = 1;
        slide1.style.opacity = 0;
        activeLayer = 2;
    } else {
        slide1.style.backgroundImage = `url('${nextImage}')`;
        slide1.style.opacity = 1;
        slide2.style.opacity = 0;
        activeLayer = 1;
    }
}

function updateFavicon() {
    ctx.clearRect(0, 0, 32, 32);
    const color = getComputedStyle(root).getPropertyValue('--main-color').trim();

    ctx.beginPath();
    ctx.arc(16, 16, 12, 0, Math.PI * 2);
    ctx.lineWidth = 4;

    if (rainbowOrbitToggle.checked) {
        const grad = ctx.createConicGradient(0, 16, 16);
        grad.addColorStop(0, "red"); grad.addColorStop(0.2, "yellow");
        grad.addColorStop(0.4, "green"); grad.addColorStop(0.6, "cyan");
        grad.addColorStop(0.8, "blue"); grad.addColorStop(1, "red");
        ctx.strokeStyle = grad;
    } else {
        ctx.strokeStyle = color;
    }

    ctx.stroke();
    favicon.href = canvas.toDataURL('image/png');
}

slideshowToggle.addEventListener('change', async () => {
    isSlideshowActive = slideshowToggle.checked;
    
    if (isSlideshowActive) {
        document.body.classList.add('slideshow-active');
        if (dynamicImageQueue.length === 0) {
            await fetchImageBatch();
        }
        changeImage(); 
        slideshowInterval = setInterval(changeImage, 20000); 
    } else {
        document.body.classList.remove('slideshow-active');
        clearInterval(slideshowInterval);
        slide1.style.opacity = 0;
        slide2.style.opacity = 0;
    }
});

themeToggle.onchange = () => {
    const theme = themeToggle.checked ? 'light' : 'dark';
    theme === 'light' ? root.setAttribute('data-theme', 'light') : root.removeAttribute('data-theme');
    localStorage.setItem('theme', theme);
};

colorPicker.oninput = (e) => applyColor(e.target.value);
glowSlider.oninput = (e) => applyGlow(e.target.value);
formatToggle.onchange = () => localStorage.setItem('use24H', formatToggle.checked);
secondsToggle.onchange = () => localStorage.setItem('showSec', secondsToggle.checked);
layoutToggle.onchange = () => localStorage.setItem('isStacked', layoutToggle.checked);

glowToggle.onchange = () => {
    localStorage.setItem('useGlow', glowToggle.checked);
    updateGlowState();
};

rainbowOrbitToggle.onchange = () => {
    localStorage.setItem('useRainbowOrbit', rainbowOrbitToggle.checked);
    updateRainbowOrbitState();
};

document.querySelectorAll('input[name="size-option"]').forEach(radio => {
    radio.onchange = (e) => setClockSize(e.target.value);
});

['pointermove', 'pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, showUI));
document.addEventListener('dblclick', toggleFullscreen);

document.addEventListener('pointerdown', (e) => {
    if (settingsMenu.style.display === 'block' && 
        !settingsMenu.contains(e.target) && 
        !document.getElementById('time').contains(e.target)) {
        settingsMenu.style.display = 'none';
        showUI();
    }
});

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
    
    document.title = `${hStr}:${mStr} | Orbit Clock`;
    updateFavicon();
}

const init = () => {
    const savedColor = localStorage.getItem('clockColor') || '#2830cc';
    const savedGlow  = localStorage.getItem('clockGlow') || '15';
    const savedSize  = localStorage.getItem('clockSize') || '8rem';
    const savedTheme = localStorage.getItem('theme') || 'dark';

    applyColor(savedColor);
    applyGlow(savedGlow);
    setClockSize(savedSize);
    colorPicker.value = savedColor;
    glowSlider.value = savedGlow;

    if (savedTheme === 'light') {
        root.setAttribute('data-theme', 'light');
        themeToggle.checked = true;
    }

    formatToggle.checked = localStorage.getItem('use24H') === 'true';
    secondsToggle.checked = (localStorage.getItem('showSec') ?? 'true') === 'true';
    glowToggle.checked = (localStorage.getItem('useGlow') ?? 'true') === 'true';
    layoutToggle.checked = localStorage.getItem('isStacked') === 'true';
    rainbowOrbitToggle.checked = localStorage.getItem('useRainbowOrbit') === 'true';

    const activeRadio = document.querySelector(`input[value="${savedSize}"]`);
    if (activeRadio) activeRadio.checked = true;

    updateGlowState();
    updateRainbowOrbitState();
    updateClock();
    showUI();
};

setInterval(updateClock, 1000);
init();