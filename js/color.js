import { root, colorPicker, hueSlider, satSlider, litSlider } from './elements.js';
import { hslToHex, hexToHsl } from './utils.js';

export const updateColorFromGamepad = () => {
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

export const updateColorFromNative = (e) => {
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