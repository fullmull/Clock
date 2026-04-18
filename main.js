import { root, timeElem, settingsMenu, header, closeBtn, colorPicker, hueSlider, satSlider, litSlider, glowSlider, formatToggle, secondsToggle, glowToggle, layoutToggle, themeToggle, rainbowOrbitToggle, adaptiveToggle, slideshowToggle, slideshowContainer, fadeControls, hElem, mElem, sWrap, slide1, slide2 } from './js/elements.js';
import { state } from './js/state.js';
import { toggleFullscreen, hexToHsl } from './js/utils.js';
import { updateColorFromGamepad, updateColorFromNative } from './js/color.js';
import { applyGlow, setClockSize, updateGlowState, updateRainbowOrbitState, showUI, openMenu, updateClock } from './js/ui.js';
import { fetchImageBatch, changeImage } from './js/slideshow.js';
import { pollGamepad } from './js/gamepad.js';

header.onpointerdown = (e) => {
    state.isDragging = true;
    const rect = settingsMenu.getBoundingClientRect();
    state.offsetX = e.clientX - rect.left;
    state.offsetY = e.clientY - rect.top;
    header.setPointerCapture(e.pointerId);
};

header.onpointermove = (e) => {
    if (!state.isDragging) return;
    let newX = Math.max(0, Math.min(e.clientX - state.offsetX, window.innerWidth - settingsMenu.offsetWidth));
    let newY = Math.max(0, Math.min(e.clientY - state.offsetY, window.innerHeight - settingsMenu.offsetHeight));
    settingsMenu.style.left = `${newX}px`;
    settingsMenu.style.top = `${newY}px`;
};

header.onpointerup = (e) => {
    state.isDragging = false;
    header.releasePointerCapture(e.pointerId);
};

timeElem.onclick = (e) => {
    e.stopPropagation();
    if (settingsMenu.style.display !== 'block') {
        openMenu();
        setTimeout(() => {
            if(state.isGamepadMode && state.lastMenuFocus) {
                document.querySelectorAll('.gp-focus').forEach(el => el.classList.remove('gp-focus'));
                state.lastMenuFocus.focus();
                state.lastMenuFocus.classList.add('gp-focus');
            }
        }, 10);
    } else {
        settingsMenu.style.display = 'none';
        showUI();
    }
};

closeBtn.onclick = () => {
    settingsMenu.style.display = 'none';
    showUI();
    document.querySelectorAll('.gp-focus').forEach(e => e.classList.remove('gp-focus'));
    const t = (state.lastMainFocus && state.lastMainFocus.offsetParent !== null) ? state.lastMainFocus : timeElem;
    t.focus();
    if(state.isGamepadMode) t.classList.add('gp-focus');
};

window.addEventListener('resize', () => {
    if (settingsMenu.style.display === 'block') {
        const rect = settingsMenu.getBoundingClientRect();
        let newX = Math.max(0, Math.min(rect.left, window.innerWidth - rect.width));
        let newY = Math.max(0, Math.min(rect.top, window.innerHeight - rect.height));
        settingsMenu.style.left = `${newX}px`;
        settingsMenu.style.top = `${newY}px`;
    }
});

['pointermove', 'pointerdown'].forEach(ev => document.addEventListener(ev, () => {
    showUI();
    if (state.isGamepadMode) {
        document.body.classList.remove('gamepad-mode');
        state.isGamepadMode = false;
        if(document.activeElement && document.getElementById('color-row-gp').contains(document.activeElement)) {
            colorPicker.focus();
        }
    }
    document.querySelectorAll('.gp-focus').forEach(e => e.classList.remove('gp-focus'));
}));

slideshowToggle.addEventListener('change', async () => {
    state.isSlideshowActive = slideshowToggle.checked;
    localStorage.setItem('useSlideshow', state.isSlideshowActive);
    
    if (state.isSlideshowActive) {
        document.body.classList.add('slideshow-active');
        if (state.dynamicImageQueue.length === 0) {
            await fetchImageBatch();
        }
        changeImage();
        state.slideshowInterval = setInterval(changeImage, 20000);
    } else {
        document.body.classList.remove('slideshow-active');
        clearInterval(state.slideshowInterval);
        slide1.style.opacity = 0;
        slide2.style.opacity = 0;
        slideshowContainer.classList.remove('revealed');
        state.slideshowRevealed = false;
        
        if (adaptiveToggle.checked) {
            const savedColor = localStorage.getItem('clockColor') || '#2830cc';
            const [h, s, l] = hexToHsl(savedColor);
            hueSlider.value = h;
            satSlider.value = s;
            litSlider.value = l;
            updateColorFromGamepad();
        }
    }
});

themeToggle.onchange = () => {
    const theme = themeToggle.checked ? 'light' : 'dark';
    theme === 'light' ? root.setAttribute('data-theme', 'light') : root.removeAttribute('data-theme');
    localStorage.setItem('theme', theme);
};

[hueSlider, satSlider, litSlider].forEach(el => el.addEventListener('input', updateColorFromGamepad));
colorPicker.addEventListener('input', updateColorFromNative);
glowSlider.oninput = (e) => applyGlow(e.target.value);
formatToggle.onchange = () => { localStorage.setItem('use24H', formatToggle.checked); updateClock(); };
secondsToggle.onchange = () => { localStorage.setItem('showSec', secondsToggle.checked); updateClock(); };
layoutToggle.onchange = () => { localStorage.setItem('isStacked', layoutToggle.checked); updateClock(); };
glowToggle.onchange = updateGlowState;

rainbowOrbitToggle.onchange = () => {
    localStorage.setItem('useRainbowOrbit', rainbowOrbitToggle.checked);
    updateRainbowOrbitState();
};

adaptiveToggle.addEventListener('change', () => {
    localStorage.setItem('useAdaptiveColor', adaptiveToggle.checked);
    document.getElementById('color-row-native').classList.toggle('disabled-control', adaptiveToggle.checked);
    document.getElementById('color-row-gp').classList.toggle('disabled-control', adaptiveToggle.checked);
    root.classList.toggle('adaptive-sync', adaptiveToggle.checked);

    if (!adaptiveToggle.checked) {
        const savedColor = localStorage.getItem('clockColor') || '#2830cc';
        const [h, s, l] = hexToHsl(savedColor);
        hueSlider.value = h;
        satSlider.value = s;
        litSlider.value = l;
        updateColorFromGamepad();
    }
});

document.querySelectorAll('input[name="size-option"]').forEach(radio => {
    radio.onchange = (e) => setClockSize(e.target.value);
});

document.addEventListener('dblclick', toggleFullscreen);
document.addEventListener('keydown', (e) => {
    showUI();
    if (e.key.toLowerCase() === 'f') toggleFullscreen();
});

document.addEventListener('pointerdown', (e) => {
    if (settingsMenu.style.display === 'block' &&
        !settingsMenu.contains(e.target) &&
        !timeElem.contains(e.target)) {
        settingsMenu.style.display = 'none';
        showUI();
    }
});

const init = () => {
    const savedColor = localStorage.getItem('clockColor') || '#2830cc';
    const savedGlow  = localStorage.getItem('clockGlow') || '15';
    const savedSize  = localStorage.getItem('clockSize') || '8rem';
    const savedTheme = localStorage.getItem('theme') || 'dark';

    colorPicker.value = savedColor;
    const [h, s, l] = hexToHsl(savedColor);
    hueSlider.value = h;
    satSlider.value = s;
    litSlider.value = l;
    updateColorFromGamepad();

    applyGlow(savedGlow);
    setClockSize(savedSize);
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
    slideshowToggle.checked = localStorage.getItem('useSlideshow') === 'true';
    
    adaptiveToggle.checked = localStorage.getItem('useAdaptiveColor') === 'true';
    document.getElementById('color-row-native').classList.toggle('disabled-control', adaptiveToggle.checked);
    document.getElementById('color-row-gp').classList.toggle('disabled-control', adaptiveToggle.checked);
    root.classList.toggle('adaptive-sync', adaptiveToggle.checked);

    const activeRadio = document.querySelector(`input[value="${savedSize}"]`);
    if (activeRadio) activeRadio.checked = true;

    if (slideshowToggle.checked) {
        state.isSlideshowActive = true;
        document.body.classList.add('slideshow-active');
        fetchImageBatch().then(() => changeImage());
        state.slideshowInterval = setInterval(changeImage, 20000);
    }

    updateGlowState();
    updateRainbowOrbitState();
    updateClock();
    
    timeElem.setAttribute('tabindex', '0');
    pollGamepad();

    document.body.classList.add('is-loaded');

    const colonElem = document.querySelector('.colon');
    const ringElem = document.getElementById('orbit-ring');
    const startupElements = [ringElem, hElem, colonElem, mElem, sWrap, fadeControls, slideshowContainer];
    
    startupElements.forEach(el => {
        if(el) el.classList.add('startup-anim');
    });

    setTimeout(() => {
        startupElements.forEach(el => {
            if(el) el.classList.remove('startup-anim');
        });
    }, 6500);

    showUI();
};

function tick() {
    const currentSecond = new Date().getSeconds();
    if (currentSecond !== state.lastSecond) {
        state.lastSecond = currentSecond;
        updateClock();
    }
    state.rafId = requestAnimationFrame(tick);
}

function manageClockSync() {
    if (document.hidden) {
        cancelAnimationFrame(state.rafId);
        state.fallbackInterval = setInterval(updateClock, 1000);
    } else {
        clearInterval(state.fallbackInterval);
        updateClock(); 
        state.rafId = requestAnimationFrame(tick);
    }
}

document.addEventListener("visibilitychange", manageClockSync);

init();
manageClockSync();