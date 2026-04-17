import { slide1, slide2, slideshowContainer, adaptiveToggle, hueSlider, satSlider, litSlider } from './elements.js';
import { state } from './state.js';
import { updateColorFromGamepad } from './color.js';

export async function fetchImageBatch() {
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
        state.dynamicImageQueue = urls;
    } catch {
        state.dynamicImageQueue = [];
    }
}

export async function changeImage() {
    if (!state.isSlideshowActive) return;
    if (state.dynamicImageQueue.length === 0) {
        await fetchImageBatch();
    }
    if (state.dynamicImageQueue.length === 0) {
        slide1.style.opacity = 0;
        slide2.style.opacity = 0;
        return;
    }
    const nextImage = state.dynamicImageQueue.pop();
    const preloader = new Image();
    preloader.crossOrigin = "Anonymous";
    preloader.src = nextImage;
    try {
        await preloader.decode();
        if (adaptiveToggle.checked) {
            const cvs = document.createElement('canvas');
            const cCtx = cvs.getContext('2d', { willReadFrequently: true });
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
    if (state.activeLayer === 1) {
        slide2.style.zIndex = 1;
        slide1.style.zIndex = 0;
        slide2.style.backgroundImage = `url('${nextImage}')`;
        slide2.style.opacity = 1;
        setTimeout(() => { if (state.activeLayer === 2) slide1.style.opacity = 0; }, 2500);
        state.activeLayer = 2;
    } else {
        slide1.style.zIndex = 1;
        slide2.style.zIndex = 0;
        slide1.style.backgroundImage = `url('${nextImage}')`;
        slide1.style.opacity = 1;
        setTimeout(() => { if (state.activeLayer === 1) slide2.style.opacity = 0; }, 2500);
        state.activeLayer = 1;
    }
    if (!state.slideshowRevealed) {
        state.slideshowRevealed = true;
        const elapsed = Date.now() - state.appStartTime;
        const targetDelay = document.body.classList.contains('has-seconds') ? 3400 : 2600;
        const remainingDelay = Math.max(0, targetDelay - elapsed);
        setTimeout(() => { slideshowContainer.classList.add('revealed'); }, remainingDelay);
    }
}