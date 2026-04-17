import { settingsMenu, container, themeToggle, timeElem } from './elements.js';
import { state } from './state.js';
import { showUI, openMenu } from './ui.js';
import { toggleFullscreen } from './utils.js';

export const pollGamepad = () => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = Array.from(gamepads).find(g => g !== null && g !== undefined);
    
    if (gp) {
        const btnA = gp.buttons[0]?.pressed;
        const btnB = gp.buttons[1]?.pressed;
        const btnX = gp.buttons[2]?.pressed;
        const btnY = gp.buttons[3]?.pressed;
        const rtDown = gp.buttons[7]?.pressed || (gp.buttons[7]?.value > 0.5);
        const dUp = gp.buttons[12]?.pressed || (gp.axes[1] && gp.axes[1] < -0.5);
        const dDown = gp.buttons[13]?.pressed || (gp.axes[1] && gp.axes[1] > 0.5);
        const dLeft = gp.buttons[14]?.pressed || (gp.axes[0] && gp.axes[0] < -0.5);
        const dRight = gp.buttons[15]?.pressed || (gp.axes[0] && gp.axes[0] > 0.5);
        const rx = gp.axes[2] && Math.abs(gp.axes[2]) > 0.15 ? gp.axes[2] : 0;
        const ry = gp.axes[3] && Math.abs(gp.axes[3]) > 0.15 ? gp.axes[3] : 0;

        const isAnyAction = btnA || btnB || btnX || btnY || dUp || dDown || dLeft || dRight || rtDown;

        if (rtDown && settingsMenu.style.display === 'block' && (rx !== 0 || ry !== 0)) {
            let curX = parseFloat(settingsMenu.style.left) || 0;
            let curY = parseFloat(settingsMenu.style.top) || 0;
            let newX = Math.max(0, Math.min(curX + rx * 15, window.innerWidth - settingsMenu.offsetWidth));
            let newY = Math.max(0, Math.min(curY + ry * 15, window.innerHeight - settingsMenu.offsetHeight));
            settingsMenu.style.left = `${newX}px`;
            settingsMenu.style.top = `${newY}px`;
        }

        if (isAnyAction) {
            const wasHidden = container.classList.contains('hidden-ui');
            showUI();
            
            if (!state.isGamepadMode) {
                document.body.classList.add('gamepad-mode');
                state.isGamepadMode = true;
                void document.body.offsetHeight; 
            }
            if (document.activeElement && document.activeElement.tagName !== 'BODY' && !document.activeElement.classList.contains('gp-focus')) {
                document.activeElement.classList.add('gp-focus');
            }

            if (wasHidden && (dUp || dDown || dLeft || dRight)) {
                state.gpNavCooldown = Date.now() + 200;
            }
        }

        if (btnX && !state.gpState.x) {
            toggleFullscreen();
            state.gpState.x = true;
        } else if (!btnX) {
            state.gpState.x = false;
        }

        if (btnY && !state.gpState.y) {
            if (settingsMenu.style.display !== 'block') {
                openMenu();
                setTimeout(() => {
                    document.querySelectorAll('.gp-focus').forEach(e => e.classList.remove('gp-focus'));
                    const target = (state.lastMenuFocus && state.lastMenuFocus.offsetParent !== null) ? state.lastMenuFocus : themeToggle;
                    target.focus();
                    if(state.isGamepadMode) target.classList.add('gp-focus');
                }, 10);
            } else {
                settingsMenu.style.display = 'none';
                showUI();
                document.querySelectorAll('.gp-focus').forEach(e => e.classList.remove('gp-focus'));
                const t = (state.lastMainFocus && state.lastMainFocus.offsetParent !== null) ? state.lastMainFocus : timeElem;
                t.focus();
                if(state.isGamepadMode) t.classList.add('gp-focus');
            }
            state.gpState.y = true;
        } else if (!btnY) {
            state.gpState.y = false;
        }

        if (btnB && !state.gpState.b) {
            if (settingsMenu.style.display === 'block') {
                settingsMenu.style.display = 'none';
                showUI();
                document.querySelectorAll('.gp-focus').forEach(e => e.classList.remove('gp-focus'));
                const t = (state.lastMainFocus && state.lastMainFocus.offsetParent !== null) ? state.lastMainFocus : timeElem;
                t.focus();
                if(state.isGamepadMode) t.classList.add('gp-focus');
            }
            state.gpState.b = true;
        } else if (!btnB) {
            state.gpState.b = false;
        }

        if (btnA && !state.gpState.a) {
            if (document.activeElement && document.activeElement.tagName !== 'BODY') {
                document.activeElement.click();
            }
            state.gpState.a = true;
        } else if (!btnA) {
            state.gpState.a = false;
        }

        if (Date.now() > state.gpNavCooldown && (dUp || dDown || dLeft || dRight)) {
            const isMenuOpen = settingsMenu.style.display === 'block';
            
            const focusables = Array.from(document.querySelectorAll('input, button, #time')).filter(el => {
                if (el.id === 'color-picker' && state.isGamepadMode) return false;
                if (el.closest('.disabled-control')) return false;
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
                     state.gpNavCooldown = Date.now() + 30;
                } else if (current && current.id === 'time' && (dLeft || dRight)) {
                     state.gpNavCooldown = Date.now() + 200;
                } else {
                    if (!current || !focusables.includes(current)) {
                        focusables[0].focus();
                        focusables[0].classList.add('gp-focus');
                        if (settingsMenu.contains(focusables[0])) {
                            state.lastMenuFocus = focusables[0];
                        } else {
                            state.lastMainFocus = focusables[0];
                        }
                        state.gpNavCooldown = Date.now() + 200;
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
                                state.lastMenuFocus = best;
                            } else {
                                state.lastMainFocus = best;
                            }
                            state.gpNavCooldown = Date.now() + 200;
                        }
                    }
                }
            }
        }
    }
    requestAnimationFrame(pollGamepad);
};