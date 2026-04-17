import { root, container, fadeControls, settingsMenu, glowSlider, glowToggle, rainbowOrbitToggle, hElem, mElem, sWrap, formatToggle, secondsToggle, layoutToggle, favicon, ctx } from './elements.js';
import { state } from './state.js';

export const applyGlow = (val) => {
    root.style.setProperty('--glow-blur', `${val}px`);
    localStorage.setItem('clockGlow', val);
    const percent = (val / 60) * 100;
    glowSlider.style.background = `linear-gradient(to right, var(--main-color) ${percent}%, #333 ${percent}%)`;
};

export const setClockSize = (sizeValue) => {
    const scaleMap = { '4rem': 0.55, '8rem': 0.70, '12rem': 0.85, '16rem': 1.0 };
    const scale = scaleMap[sizeValue] || 0.85;
    root.style.setProperty('--size-scale', scale);
    localStorage.setItem('clockSize', sizeValue);
};

export const updateGlowState = () => {
    container.classList.toggle('no-glow', !glowToggle.checked);
    localStorage.setItem('useGlow', glowToggle.checked);
};

export const updateRainbowOrbitState = () => {
    container.classList.toggle('rainbow-orbit', rainbowOrbitToggle.checked);
};

export const showUI = () => {
    container.classList.remove('hidden-ui');
    fadeControls.classList.remove('hidden-ui');
    clearTimeout(state.fadeTimer);
    state.fadeTimer = setTimeout(() => {
        if (settingsMenu.style.display !== 'block') {
            container.classList.add('hidden-ui');
            fadeControls.classList.add('hidden-ui');
            document.querySelectorAll('.gp-focus').forEach(e => e.classList.remove('gp-focus'));
            if (document.activeElement) document.activeElement.blur();
        }
    }, 5000);
};

export const openMenu = () => {
    settingsMenu.style.visibility = 'hidden';
    settingsMenu.style.display = 'block';
    let x = parseFloat(settingsMenu.style.left);
    let y = parseFloat(settingsMenu.style.top);
    if (isNaN(x) || isNaN(y)) {
        x = (window.innerWidth - settingsMenu.offsetWidth) / 2;
        y = (window.innerHeight - settingsMenu.offsetHeight) / 2;
    }
    settingsMenu.style.left = `${Math.max(0, Math.min(x, window.innerWidth - settingsMenu.offsetWidth))}px`;
    settingsMenu.style.top = `${Math.max(0, Math.min(y, window.innerHeight - settingsMenu.offsetHeight))}px`;
    settingsMenu.style.visibility = 'visible';
};

export function updateFavicon() {
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
    favicon.href = ctx.canvas.toDataURL('image/png');
}

export function updateClock() {
    const now = new Date();
    container.classList.toggle('stacked', layoutToggle.checked);
    container.classList.toggle('has-seconds', secondsToggle.checked);
    document.body.classList.toggle('has-seconds', secondsToggle.checked);
    
    let h = now.getHours();
    if (!formatToggle.checked) h = h % 12 || 12;
    const hStr = h.toString().padStart(2, '0');
    const mStr = now.getMinutes().toString().padStart(2, '0');
    const sStr = now.getSeconds().toString().padStart(2, '0');

    if(hElem.innerText !== hStr) hElem.innerText = hStr;
    if(mElem.innerText !== mStr) mElem.innerText = mStr;
    
    const isStacked = layoutToggle.checked;
    const showSec = secondsToggle.checked;
    const struct = `${isStacked}-${showSec}`;
    
    if (sWrap.dataset.struct !== struct) {
        if (showSec) {
            sWrap.innerHTML = isStacked ? `<div class="stacked-sec"></div>` : `<span class="colon">:</span><span class="classic-sec"></span>`;
        } else {
            sWrap.innerHTML = "";
        }
        sWrap.dataset.struct = struct;
    }
    
    if (showSec) {
        const secEl = isStacked ? sWrap.querySelector('.stacked-sec') : sWrap.querySelector('.classic-sec');
        if (secEl && secEl.innerText !== sStr) secEl.innerText = sStr;
    }
    
    document.title = `${hStr}:${mStr} | Orbit Clock`;
    updateFavicon();
}