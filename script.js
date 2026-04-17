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
const hueSlider = document.getElementById('hue-slider');
const satSlider = document.getElementById('sat-slider');
const litSlider = document.getElementById('lit-slider');
const glowSlider = document.getElementById('glow-slider');
const formatToggle = document.getElementById('format-toggle');
const secondsToggle = document.getElementById('seconds-toggle');
const glowToggle = document.getElementById('glow-toggle');
const layoutToggle = document.getElementById('layout-toggle');
const themeToggle = document.getElementById('theme-toggle');
const rainbowOrbitToggle = document.getElementById('rainbow-orbit-toggle');
const adaptiveToggle = document.getElementById('adaptive-toggle');
const slideshowToggle = document.getElementById('slideshow-toggle');
const slideshowContainer = document.getElementById('slideshow-container');
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
let appStartTime = Date.now();
let slideshowRevealed = false;
let gpNavCooldown = 0;
let gpState = { a: false, b: false, x: false, y: false };
let lastMenuFocus = document.getElementById('theme-toggle');
let lastMainFocus = document.getElementById('time');
let isGamepadMode = false;
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}
function hexToHsl(H) {
    let r = 0, g = 0, b = 0;
    if (H.length == 4) {
        r = "0x" + H[1] + H[1];
        g = "0x" + H[2] + H[2];
        b = "0x" + H[3] + H[3];
    } else if (H.length == 7) {
        r = "0x" + H[1] + H[2];
        g = "0x" + H[3] + H[4];
        b = "0x" + H[5] + H[6];
    }
    r /= 255; g /= 255; b /= 255;
    let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin, h = 0, s = 0, l = 0;
    if (delta == 0) h = 0;
    else if (cmax == r) h = ((g - b) / delta) % 6;
    else if (cmax == g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
    return [h, s, l];
}
async function fetchImageBatch() {
    try {
        const orient = window.innerWidth > window.innerHeight ? 'horizontal' : 'vertical';
        const response = await fetch(`/api/get-images?orientation=${orient}&t=${Date.now()}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        
        let urls = data.map(photo => photo.largeImageURL);
        for (let i = urls.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [urls[i], urls[j]] = [urls[j], urls[i]];
        }
        dynamicImageQueue = urls;
    } catch {
        dynamicImageQueue = [];
    }
}
const updateColorFromGamepad = () => {
    const h = hueSlider.value;
    const s = satSlider.value;
    const l = litSlider.value;
    const hex = hslToHex(h, s, l);
    colorPicker.value = hex;
    root.style.setProperty('--main-color', hex);
    localStorage.setItem('clockColor', hex);
    hueSlider.style.background = `linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)`;
    satSlider.style.background = `linear-gradient(to right, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%))`;
    litSlider.style.background = `linear-gradient(to right, #000, hsl(${h}, ${s}%, 50%), #fff)`;
};
const updateColorFromNative = (e) => {
    const hex = e.target.value;
    const [h, s, l] = hexToHsl(hex);
    hueSlider.value = h;
    satSlider.value = s;
    litSlider.value = l;
    root.style.setProperty('--main-color', hex);
    localStorage.setItem('clockColor', hex);
    hueSlider.style.background = `linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)`;
    satSlider.style.background = `linear-gradient(to right, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%))`;
    litSlider.style.background = `linear-gradient(to right, #000, hsl(${h}, ${s}%, 50%), #fff)`;
};
const applyGlow = (val) => {
    root.style.setProperty('--glow-blur', `${val}px`);
    localStorage.setItem('clockGlow', val);
    const percent = (val / 60) * 100;
    glowSlider.style.background = `linear-gradient(to right, var(--main-color) ${percent}%, #333 ${percent}%)`;
};
const setClockSize = (sizeValue) => {
    const scaleMap = {
        '4rem': 0.55,
        '8rem': 0.70,
        '12rem': 0.85,
        '16rem': 1.0
    };
    const scale = scaleMap[sizeValue] || 0.85;
    root.style.setProperty('--size-scale', scale);
    localStorage.setItem('clockSize', sizeValue);
};
const updateGlowState = () => {
    container.classList.toggle('no-glow', !glowToggle.checked);
    localStorage.setItem('useGlow', glowToggle.checked);
};
const updateRainbowOrbitState = () => {
    container.classList.toggle('rainbow-orbit', rainbowOrbitToggle.checked);
};
const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        root.requestFullscreen().catch(() => {});
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
            document.querySelectorAll('.gp-focus').forEach(e => e.classList.remove('gp-focus'));
            if (document.activeElement) document.activeElement.blur();
        }
    }, 5000);
};
const openMenu = () => {
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
        openMenu();
        setTimeout(() => {
            if(isGamepadMode && lastMenuFocus) {
                document.querySelectorAll('.gp-focus').forEach(el => el.classList.remove('gp-focus'));
                lastMenuFocus.focus();
                lastMenuFocus.classList.add('gp-focus');
            }
        }, 10);
    } else {
        settingsMenu.style.display = 'none';
    }
};
closeBtn.onclick = () => {
    settingsMenu.style.display = 'none';
    showUI();
    document.querySelectorAll('.gp-focus').forEach(e => e.classList.remove('gp-focus'));
    const t = (lastMainFocus && lastMainFocus.offsetParent !== null) ? lastMainFocus : document.getElementById('time');
    t.focus();
    if(isGamepadMode) t.classList.add('gp-focus');
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
    const preloader = new Image();
    preloader.crossOrigin = "Anonymous";
    preloader.src = nextImage;
    try {
        await preloader.decode();
        
        if (adaptiveToggle.checked) {
            const cvs = document.createElement('canvas');
            const cCtx = cvs.getContext('2d');
            cvs.width = 64;
            cvs.height = 64;
            cCtx.drawImage(preloader, 0, 0, 64, 64);
            const data = cCtx.getImageData(0, 0, 64, 64).data;
            let r=0, g=0, b=0, count=0;
            for (let i = 0; i < data.length; i += 16) {
                r += data[i]; g += data[i+1]; b += data[i+2]; count++;
            }
            r = Math.floor(r / count); g = Math.floor(g / count); b = Math.floor(b / count);
            let rNorm = r/255, gNorm = g/255, bNorm = b/255;
            let max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
            let h=0, s=0, l = (max + min) / 2;
            if (max !== min) {
                let d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
                    case gNorm: h = (bNorm - rNorm) / d + 2; break;
                    case bNorm: h = (rNorm - gNorm) / d + 4; break;
                }
                h /= 6;
            }
            hueSlider.value = Math.round(h * 360);
            satSlider.value = Math.max(45, Math.round(s * 100));
            litSlider.value = Math.max(70, Math.round(l * 100));
            updateColorFromGamepad();
        }
    } catch(e) {
        return changeImage();
    }
    if (activeLayer === 1) {
        slide2.style.zIndex = 1;
        slide1.style.zIndex = 0;
        slide2.style.backgroundImage = `url('${nextImage}')`;
        slide2.style.opacity = 1;
        setTimeout(() => {
            if (activeLayer === 2) slide1.style.opacity = 0;
        }, 2500);
        activeLayer = 2;
    } else {
        slide1.style.zIndex = 1;
        slide2.style.zIndex = 0;
        slide1.style.backgroundImage = `url('${nextImage}')`;
        slide1.style.opacity = 1;
        setTimeout(() => {
            if (activeLayer === 1) slide2.style.opacity = 0;
        }, 2500);
        activeLayer = 1;
    }
    if (!slideshowRevealed) {
        slideshowRevealed = true;
        const elapsed = Date.now() - appStartTime;
        const targetDelay = document.body.classList.contains('has-seconds') ? 3400 : 2600;
        const remainingDelay = Math.max(0, targetDelay - elapsed);
        setTimeout(() => {
            slideshowContainer.classList.add('revealed');
        }, remainingDelay);
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
const pollGamepad = () => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads.find(g => g !== null);
    if (gp) {
        const btnA = gp.buttons[0]?.pressed;
        const btnB = gp.buttons[1]?.pressed;
        const btnX = gp.buttons[2]?.pressed;
        const btnY = gp.buttons[3]?.pressed;
        const rtDown = gp.buttons[7]?.pressed || gp.buttons[7]?.value > 0.5;
        const dUp = gp.buttons[12]?.pressed || gp.axes[1] < -0.5;
        const dDown = gp.buttons[13]?.pressed || gp.axes[1] > 0.5;
        const dLeft = gp.buttons[14]?.pressed || gp.axes[0] < -0.5;
        const dRight = gp.buttons[15]?.pressed || gp.axes[0] > 0.5;
        const rx = Math.abs(gp.axes[2]) > 0.15 ? gp.axes[2] : 0;
        const ry = Math.abs(gp.axes[3]) > 0.15 ? gp.axes[3] : 0;
        if (rtDown && settingsMenu.style.display === 'block' && (rx !== 0 || ry !== 0)) {
            let curX = parseFloat(settingsMenu.style.left) || 0;
            let curY = parseFloat(settingsMenu.style.top) || 0;
            let newX = Math.max(0, Math.min(curX + rx * 15, window.innerWidth - settingsMenu.offsetWidth));
            let newY = Math.max(0, Math.min(curY + ry * 15, window.innerHeight - settingsMenu.offsetHeight));
            settingsMenu.style.left = `${newX}px`;
            settingsMenu.style.top = `${newY}px`;
        }
        if (btnA || btnB || btnX || btnY || dUp || dDown || dLeft || dRight || rtDown) {
            showUI();
            if (!isGamepadMode) {
                document.body.classList.add('gamepad-mode');
                isGamepadMode = true;
                void document.body.offsetHeight; 
            }
            if (document.activeElement && document.activeElement.tagName !== 'BODY' && !document.activeElement.classList.contains('gp-focus')) {
                document.activeElement.classList.add('gp-focus');
            }
        }
        if (btnX && !gpState.x) {
            toggleFullscreen();
            gpState.x = true;
        } else if (!btnX) {
            gpState.x = false;
        }
        if (btnY && !gpState.y) {
            if (settingsMenu.style.display !== 'block') {
                openMenu();
                setTimeout(() => {
                    document.querySelectorAll('.gp-focus').forEach(e => e.classList.remove('gp-focus'));
                    const target = (lastMenuFocus && lastMenuFocus.offsetParent !== null) ? lastMenuFocus : document.getElementById('theme-toggle');
                    target.focus();
                    if(isGamepadMode) target.classList.add('gp-focus');
                }, 10);
            } else {
                settingsMenu.style.display = 'none';
                showUI();
                document.querySelectorAll('.gp-focus').forEach(e => e.classList.remove('gp-focus'));
                const t = (lastMainFocus && lastMainFocus.offsetParent !== null) ? lastMainFocus : document.getElementById('time');
                t.focus();
                if(isGamepadMode) t.classList.add('gp-focus');
            }
            gpState.y = true;
        } else if (!btnY) {
            gpState.y = false;
        }
        if (btnB && !gpState.b) {
            if (settingsMenu.style.display === 'block') {
                settingsMenu.style.display = 'none';
                showUI();
                document.querySelectorAll('.gp-focus').forEach(e => e.classList.remove('gp-focus'));
                const t = (lastMainFocus && lastMainFocus.offsetParent !== null) ? lastMainFocus : document.getElementById('time');
                t.focus();
                if(isGamepadMode) t.classList.add('gp-focus');
            }
            gpState.b = true;
        } else if (!btnB) {
            gpState.b = false;
        }
        if (btnA && !gpState.a) {
            if (document.activeElement && document.activeElement.tagName !== 'BODY') {
                document.activeElement.click();
            }
            gpState.a = true;
        } else if (!btnA) {
            gpState.a = false;
        }
        if (Date.now() > gpNavCooldown && (dUp || dDown || dLeft || dRight)) {
            const isMenuOpen = settingsMenu.style.display === 'block';
            const focusables = Array.from(document.querySelectorAll('input, button, #time')).filter(el => {
                if (el.getBoundingClientRect().width === 0 || el.closest('.disabled-control')) return false;
                const inMenu = settingsMenu.contains(el);
                return isMenuOpen ? inMenu : !inMenu;
            });
            if (focusables.length > 0) {
                const current = document.activeElement;
                const isRange = current && current.type === 'range';
                if (isRange && (dLeft || dRight)) {
                     let step = (parseFloat(current.max) - parseFloat(current.min)) / 100;
                     step = Math.max(1, Math.round(step));
                     let val = parseFloat(current.value);
                     val += dRight ? step : -step;
                     current.value = Math.max(current.min, Math.min(current.max, val));
                     current.dispatchEvent(new Event('input'));
                     current.classList.add('gp-focus');
                     gpNavCooldown = Date.now() + 30;
                } else if (current && current.id === 'time' && (dLeft || dRight)) {
                     gpNavCooldown = Date.now() + 200;
                } else {
                    if (!current || !focusables.includes(current)) {
                        focusables[0].focus();
                        focusables[0].classList.add('gp-focus');
                        if (settingsMenu.contains(focusables[0])) {
                            lastMenuFocus = focusables[0];
                        } else {
                            lastMainFocus = focusables[0];
                        }
                        gpNavCooldown = Date.now() + 200;
                    } else {
                        const r1 = current.getBoundingClientRect();
                        const c1 = { x: r1.left + r1.width / 2, y: r1.top + r1.height / 2 };
                        let best = null;
                        let bestDist = Infinity;
                        focusables.forEach(el => {
                            if (el === current) return;
                            const r2 = el.getBoundingClientRect();
                            const c2 = { x: r2.left + r2.width / 2, y: r2.top + r2.height / 2 };
                            let valid = false;
                            if (dUp && c2.y < c1.y - 5) valid = true;
                            if (dDown && c2.y > c1.y + 5) valid = true;
                            if (dLeft && c2.x < c1.x - 5) valid = true;
                            if (dRight && c2.x > c1.x + 5) valid = true;
                            if (valid) {
                                const dx = Math.abs(c2.x - c1.x);
                                const dy = Math.abs(c2.y - c1.y);
                                let score = (dUp || dDown) ? (dy * 10 + dx) : (dy * 100 + dx);
                                if (score < bestDist) {
                                    bestDist = score;
                                    best = el;
                                }
                            }
                        });
                        if (best) {
                            document.querySelectorAll('.gp-focus').forEach(e => e.classList.remove('gp-focus'));
                            best.focus();
                            best.classList.add('gp-focus');
                            if (settingsMenu.contains(best)) {
                                lastMenuFocus = best;
                            } else {
                                lastMainFocus = best;
                            }
                            gpNavCooldown = Date.now() + 200;
                        }
                    }
                }
            }
        }
    }
    requestAnimationFrame(pollGamepad);
};
['pointermove', 'pointerdown'].forEach(ev => document.addEventListener(ev, () => {
    showUI();
    if (isGamepadMode) {
        document.body.classList.remove('gamepad-mode');
        isGamepadMode = false;
        if(document.activeElement && document.getElementById('color-row-gp').contains(document.activeElement)) {
            document.getElementById('color-picker').focus();
        }
    }
    document.querySelectorAll('.gp-focus').forEach(e => e.classList.remove('gp-focus'));
}));
slideshowToggle.addEventListener('change', async () => {
    isSlideshowActive = slideshowToggle.checked;
    localStorage.setItem('useSlideshow', isSlideshowActive);
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
    document.body.classList.toggle('adaptive-sync', adaptiveToggle.checked);
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
        !document.getElementById('time').contains(e.target)) {
        settingsMenu.style.display = 'none';
        showUI();
    }
});
function updateClock() {
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
    document.body.classList.toggle('adaptive-sync', adaptiveToggle.checked);

    const activeRadio = document.querySelector(`input[value="${savedSize}"]`);
    if (activeRadio) activeRadio.checked = true;
    if (slideshowToggle.checked) {
        isSlideshowActive = true;
        document.body.classList.add('slideshow-active');
        fetchImageBatch().then(() => changeImage());
        slideshowInterval = setInterval(changeImage, 20000);
    }
    updateGlowState();
    updateRainbowOrbitState();
    updateClock();
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
let lastSecond = new Date().getSeconds();
let rafId;
let fallbackInterval;
function tick() {
    const currentSecond = new Date().getSeconds();
    if (currentSecond !== lastSecond) {
        lastSecond = currentSecond;
        updateClock();
    }
    rafId = requestAnimationFrame(tick);
}
function manageClockSync() {
    if (document.hidden) {
        cancelAnimationFrame(rafId);
        fallbackInterval = setInterval(updateClock, 1000);
    } else {
        clearInterval(fallbackInterval);
        updateClock(); 
        rafId = requestAnimationFrame(tick);
    }
}
document.addEventListener("visibilitychange", manageClockSync);
init();
manageClockSync();
