// Global State
let highestZ = 100;
let isBooting = true;
let idleTime = 0;
let pendingTada = false;

const clickSound = document.getElementById('audio-click');
const dialupSound = document.getElementById('audio-dialup');
const tadaSound = document.getElementById('audio-tada');
const chordSound = document.getElementById('audio-chord');
const mailSound = document.getElementById('audio-mail');

// 66. Safe Mode Boot listener
document.addEventListener('keydown', (e) => {
    if (isBooting && e.key === 'Delete') enterBiosSetup();
});

const keySound = new Audio('https://archive.org/download/win98sounds/Ding.wav');
const startupSound = new Audio('https://archive.org/download/win98sounds/Windows%20Logon%20Sound.wav');
const clickCustomSound = new Audio('https://archive.org/download/win98sounds/Chord.wav');
keySound.volume = 0.2;
clickCustomSound.volume = 0.5;

document.addEventListener('DOMContentLoaded', () => {
    // Override window.alert
    window.alert = function(msg) {
        const alertWin = document.getElementById('os-alert-window');
        if (!alertWin) return;
        document.getElementById('os-alert-msg').innerText = msg;
        
        const icon = document.getElementById('os-alert-icon');
        const m = msg.toLowerCase();
        if (m.includes('error') || m.includes('denied') || m.includes('corrupt') || m.includes('boom')) {
            icon.src = "https://win98icons.alexmeub.com/icons/png/msg_error-0.png";
        } else if (m.includes('warning') || m.includes('empty') || m.includes('incorrect') || m.includes('invalid')) {
            icon.src = "https://win98icons.alexmeub.com/icons/png/msg_warning-0.png";
        } else {
            icon.src = "https://win98icons.alexmeub.com/icons/png/msg_information-0.png";
        }

        openApp('os-alert-window');
        bringToFront(alertWin);
        
        const snd = document.getElementById('audio-chord');
        if(snd) snd.play().catch(()=>{});
    };

    updateClock();
});

document.addEventListener('mousedown', () => {
    try { clickCustomSound.cloneNode(true).play(); } catch(e) {}
});
document.addEventListener('keydown', () => {
    try { keySound.cloneNode(true).play(); } catch(e) {}
});

// Boot Sequence
const biosLines = [
    "Award Modular BIOS v4.51PG, An Energy Star Ally",
    "Copyright (C) 1984-98, Award Software, Inc.",
    "ASUS P2B-F ACPI BIOS Revision 1013",
    "",
    "Intel(R) Pentium(R) II Processor 350MHz",
    "Memory Test :  131072K OK",
    "",
    "Award Plug and Play BIOS Extension v1.0A",
    "Initialize Plug and Play Cards...",
    "PNP Init Completed",
    "",
    "Detecting Primary Master   ... Seagate ST39140A",
    "Detecting Primary Slave    ... None",
    "Detecting Secondary Master ... LITE-ON LTR-12101B 52X CD-ROM",
    "Detecting Secondary Slave  ... None",
    "",
    "Pri Master HDD Error",
    "CMOS checksum error - Defaults loaded",
    "",
    "<span style='color: red;'>SMART Failure Predicted on Primary Master: Seagate ST39140A</span>",
    "<span style='color: red;'>WARNING: Immediately back-up your data and replace your hard disk drive. A failure may be imminent.</span>",
    "",
    "Disk boot failure, insert system disk and press enter",

];

let lineIndex = 0;
let charIndex = 0;
const biosTextElement = document.getElementById('bios-text');

function typeBios() {
    if (!biosTextElement || inBios) return;
    if (lineIndex < biosLines.length) {
        let currentLine = biosLines[lineIndex];
        
        if (currentLine.startsWith("<span")) {
            biosTextElement.innerHTML += currentLine + "<br>";
            lineIndex++;
            setTimeout(typeBios, 300);
            return;
        }

        if (currentLine.startsWith("Memory Test :")) {
            biosTextElement.innerHTML += "Memory Test :  ";
            let ram = 0;
            const memSpan = document.createElement('span');
            biosTextElement.appendChild(memSpan);
            const ramInterval = setInterval(() => {
                if(inBios) { clearInterval(ramInterval); return; }
                ram += 4096;
                memSpan.innerText = ram + "K OK";
                if(ram >= 131072) {
                    clearInterval(ramInterval);
                    biosTextElement.innerHTML += "<br>";
                    lineIndex++;
                    setTimeout(typeBios, 200);
                }
            }, 10);
            return;
        }

        if (charIndex < currentLine.length) {
            biosTextElement.innerHTML += currentLine.charAt(charIndex);
            charIndex++;
            setTimeout(typeBios, 10);
        } else {
            biosTextElement.innerHTML += "<br>";
            lineIndex++;
            charIndex = 0;
            setTimeout(typeBios, 200);
        }
    } else {
        setTimeout(() => {
            if(inBios) return;
            document.getElementById('bios-screen').style.display = 'none';
            if(document.body.classList.contains('haunted-mode')) {
                document.getElementById('login-overlay').style.display = 'flex';
                autoTypeLogin();
            } else {
                // If not safe mode, maybe randomly BSOD or scandisk here, but we'll just login
                document.getElementById('login-overlay').style.display = 'flex';
                autoTypeLogin();
            }
        }, 800);
    }
}

function autoTypeLogin() {
    const passField = document.getElementById('login-password');
    if (passField) {
        passField.value = "";
        passField.focus();
    }
}

let inBios = false;
function enterBiosSetup() {
    if(!isBooting) return;
    inBios = true;
    document.getElementById('bios-screen').style.display = 'none';
    const biosSetup = document.getElementById('bios-setup-screen');
    if(biosSetup) biosSetup.style.display = 'flex';
}
window.exitBiosSetup = function() {
    inBios = false;
    document.getElementById('bios-setup-screen').style.display = 'none';
    document.getElementById('bios-screen').style.display = 'block';
    typeBios();
}

window.startWebcam = function() {
    const video = document.getElementById('webcam-video');
    video.style.display = 'block';
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            alert("Webcam not detected or permission denied!");
            video.style.display = 'none';
        });
};
if(window.location.search.includes('scandisk=true')) {
    isBooting = true;
    document.getElementById('bios-screen').style.display = 'none';
    const sc = document.getElementById('scandisk-screen');
    if(sc) {
        sc.style.display = 'flex';
        let p = 0;
        const ival = setInterval(() => {
            p += Math.random() * 5;
            if(p > 100) p = 100;
            document.getElementById('scandisk-progress').style.width = p + '%';
            document.getElementById('scandisk-percent').innerText = Math.floor(p) + '% completed';
            if(p > 20) document.getElementById('scandisk-folders').innerText = 'OK';
            if(p > 60) document.getElementById('scandisk-files').innerText = 'OK';
            if(p > 90) document.getElementById('scandisk-free').innerText = 'OK';
            if(p >= 100) {
                clearInterval(ival);
                setTimeout(() => {
                    window.location.href = window.location.pathname;
                }, 2000);
            }
        }, 200);
    }
} else {
    typeBios();
}

window.showWarning = function(msg) {
    const w = document.getElementById('warning-dialog');
    const wm = document.getElementById('warning-msg');
    if(w && wm) {
        highestZ += 10;
        w.style.zIndex = Math.max(highestZ, 100000);
        wm.innerText = msg;
        w.style.display = 'block';
        if(chordSound) { chordSound.currentTime = 0; chordSound.play().catch(e=>{}); }
    } else {
        alert(msg);
    }
}

window.executeCmd = function() {
    const input = document.getElementById('cmd-input');
    const output = document.getElementById('cmd-output');
    const cmd = input.value.trim().toLowerCase();
    input.value = '';
    
    if(!cmd) return;
    
    let res = '';
    if(cmd === 'dir') res = 'Volume in drive C is WINDOWS98\nDirectory of C:\\WINDOWS\n\nSYSTEM         <DIR>\nDESKTOP        <DIR>\nEXPLORER.EXE   250KB\nNOTEPAD.EXE    64KB\n';
    else if(cmd === 'win') res = 'Windows 98 is already running.';
    else if(cmd.startsWith('echo ')) res = cmd.substring(5);
    else if(cmd === 'cls') { output.innerText = ''; return; }
    else if(cmd === 'format c:') triggerBSOD('FORMAT_C_DRIVE');
    else if(cmd === 'virus') triggerBSOD('MALWARE_DETECTED');
    else if(cmd === 'ipconfig') res = 'Windows 98 IP Configuration\n\nEthernet adapter:\n\n\tIP Address. . . . . . . . . : 192.168.1.100\n\tSubnet Mask . . . . . . . . : 255.255.255.0\n\tDefault Gateway . . . . . . : 192.168.1.1';
    else if(cmd === 'systeminfo') res = 'OS Name: Microsoft Windows 98\nSystem Type: X86-based PC\nTotal Physical Memory: 64 MB';
    else if(cmd.startsWith('cd ')) res = `C:\\WINDOWS\\${cmd.substring(3).toUpperCase()}>`;
    else res = 'Bad command or file name';
    
    output.innerText += `\nC:\\WINDOWS> ${cmd}\n${res}\n`;
    const w = document.getElementById('cmd-window');
    w.querySelector('.window-body').scrollTop = w.querySelector('.window-body').scrollHeight;
};

window.finishLogin = function() {
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password');
    if(user === 'Admin' && pass.value !== 'password123') {
        showWarning("Incorrect password for Admin.");
        return;
    }
    const loginOverlay = document.getElementById('login-overlay');
    if(loginOverlay) loginOverlay.style.display = 'none';
    isBooting = false;
    
    if(user === 'Admin') {
        document.getElementById('desktop').style.backgroundColor = '#600000';
    }
    
    if(tadaSound) { 
        tadaSound.currentTime = 0; 
        tadaSound.play().catch(e => { pendingTada = true; }); 
    }
}



// Cursor Trails
document.addEventListener('mousemove', (e) => {
    if(isBooting) return;
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    trail.style.left = e.pageX + 'px'; trail.style.top = e.pageY + 'px';
    document.body.appendChild(trail); setTimeout(() => trail.remove(), 200);
});

// Global Click Handlers


document.addEventListener('mousedown', (e) => {
    if (pendingTada && tadaSound) { tadaSound.currentTime = 0; tadaSound.play().catch(e=>{}); pendingTada = false; }
    if (isBooting) return;
    if (clickSound) { clickSound.currentTime = 0; clickSound.play().catch(e=>{}); }
    if (e.button === 0 && Math.random() < 0.001 && document.getElementById('bsod-screen').style.display === 'none') {
        triggerBSOD('VXD VMM(01)');
    }
});

// 72. Context BSOD
window.triggerBSOD = function(moduleName = 'VXD VMM(01)') {
    const bsodScreen = document.getElementById('bsod-screen');
    const container = bsodScreen.querySelector('.bsod-text');
    bsodScreen.style.display = 'flex';
    bsodScreen.style.zIndex = '9999999';
    if (chordSound) { chordSound.currentTime = 0; chordSound.play().catch(e=>{}); }

    const fullHtml = `A fatal exception 0E has occurred at 0028:C0011E36 in <span style="color: yellow;">${moduleName}</span> + <br>
00010E36. The current application will be terminated.<br><br>
* Press any key to terminate the current application.<br>
* Press CTRL+ALT+DEL again to restart your computer.<br><br>
Press any key to continue _`;

    container.innerHTML = '';
    let i = 0;
    let isTag = false;
    let currentHtml = '';
    
    function type() {
        if(i < fullHtml.length) {
            let char = fullHtml.charAt(i);
            currentHtml += char;
            if(char === '<') isTag = true;
            if(char === '>') isTag = false;
            
            container.innerHTML = currentHtml;
            i++;
            setTimeout(type, isTag ? 0 : 5);
        } else {
            setTimeout(() => window.location.href = window.location.pathname + '?scandisk=true', 5000);
        }
    }
    type();
}

// Clock & Hourly Chime (48)
let lastHour = new Date().getHours();

// Global Enter key handler for all inputs
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const active = document.activeElement;
        if (!active) return;
        if (active.id === 'run-input') window.executeRun();
        if (active.id === 'bonzi-search-input') window.executeBonziSearch();
        if (active.id === 'chat-input') window.sendChat();
        if (active.id === 'dial-number') window.dialCall();
        if (active.id === 'cmd-input') window.executeCmd();
        if (active.id === 'login-password') { if (typeof window.login === 'function') window.login(); }
    }
});

function initDesktop() {
    createIcons();

    // Random weird ads popping up occasionally
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance every 10 seconds
            spawnRandomAd();
        }
    }, 10000);
}
function updateClock() {
    const now = new Date();
    let h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12; m = m < 10 ? '0'+m : m; s = s < 10 ? '0'+s : s;
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.textContent = h + ':' + m + ' ' + ampm;
    
    // Update Calendar Popup
    const calDate = document.getElementById('calendar-date');
    const calTime = document.getElementById('calendar-time');
    if(calDate) calDate.textContent = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if(calTime) calTime.textContent = h + ':' + m + ':' + s + ' ' + ampm;
    
    if(now.getHours() !== lastHour) {
        lastHour = now.getHours();
        if(tadaSound) { tadaSound.currentTime = 0; tadaSound.play().catch(e=>{}); }
    }
}
setInterval(updateClock, 1000); updateClock();

const clockEl = document.getElementById('clock');
if(clockEl) {
    clockEl.style.cursor = 'pointer';
    clockEl.onclick = (e) => {
        e.stopPropagation();
        const popup = document.getElementById('calendar-popup');
        popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
    };
}

// Volume Slider (49)
const volPopup = document.getElementById('volume-popup');
const volIcon = document.getElementById('volume-icon');
if(volIcon) {
    volIcon.onclick = (e) => { e.stopPropagation(); volPopup.style.display = volPopup.style.display === 'none' ? 'flex' : 'none'; };
}
if(volPopup) {
    const s = document.getElementById('vol-slider');
    s.oninput = () => {
        const v = s.value / 100;
        if(clickSound) clickSound.volume = v;
        if(dialupSound) dialupSound.volume = v;
        if(tadaSound) tadaSound.volume = v;
        if(chordSound) chordSound.volume = v;
        if(mailSound) mailSound.volume = v;
    };
    document.addEventListener('mousedown', (e) => {
        if(!e.target.closest('#volume-popup') && e.target !== volIcon) volPopup.style.display = 'none';
    });
}

// Start Menu Logic
document.getElementById('start-btn').addEventListener('click', () => {
    const menu = document.getElementById('start-menu');
    const btn = document.getElementById('start-btn');
    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'flex'; btn.classList.add('active');
    } else {
        menu.style.display = 'none'; btn.classList.remove('active');
        const sub = document.getElementById('sub-programs');
        if (sub) sub.style.display = 'none';
    }
});
const startPrograms = document.getElementById('start-programs');
if (startPrograms) {
    startPrograms.addEventListener('mouseenter', () => {
        const sub = document.getElementById('sub-programs');
        if (sub) sub.style.display = 'block';
    });
}
const startMenu = document.getElementById('start-menu');
if (startMenu) {
    startMenu.addEventListener('mouseleave', () => {
        const sub = document.getElementById('sub-programs');
        if (sub) sub.style.display = 'none';
    });
}
document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('#start-menu') && e.target.id !== 'start-btn' && !e.target.closest('#start-btn')) {
        const menu = document.getElementById('start-menu');
        const btn = document.getElementById('start-btn');
        if (menu) menu.style.display = 'none';
        if (btn) btn.classList.remove('active');
        const sub = document.getElementById('sub-programs');
        if (sub) sub.style.display = 'none';
    }
});

// Window Management
window.bringToFront = function(win) {
    document.querySelectorAll('.app-window').forEach(w => w.classList.add('inactive'));
    win.classList.remove('inactive'); highestZ++; win.style.zIndex = highestZ;
    updateTaskbarActive(win.id);
}

const appIcons = {
    'os-alert-window': 'https://win98icons.alexmeub.com/icons/png/msg_information-0.png',
    'ie-window': 'https://win98icons.alexmeub.com/icons/png/msie1-2.png',
    'notepad-window': 'https://win98icons.alexmeub.com/icons/png/notepad-5.png',
    'paint-window': 'https://win98icons.alexmeub.com/icons/png/paint_file-5.png',
    'calc-window': 'https://win98icons.alexmeub.com/icons/png/calculator-1.png',
    'cmd-window': 'https://win98icons.alexmeub.com/icons/png/console_prompt-0.png',
    'minesweeper-window': 'https://win98icons.alexmeub.com/icons/png/minesweeper-0.png',
    'explorer-window': 'https://win98icons.alexmeub.com/icons/png/computer_explorer-4.png',
    'control-panel': 'https://win98icons.alexmeub.com/icons/png/settings_gear_cool-1.png',
    'game-window': 'https://win98icons.alexmeub.com/icons/png/game_freecell-1.png',
    'messenger-window': 'https://win98icons.alexmeub.com/icons/png/network_internet_pcs_installer-2.png',
    'dialer-window': 'https://win98icons.alexmeub.com/icons/png/phone_dial-0.png',
    'webcam-window': 'https://win98icons.alexmeub.com/icons/png/camera3-2.png',
    'run-dialog': 'https://win98icons.alexmeub.com/icons/png/executable_script-0.png',
    'deletion-window': 'https://win98icons.alexmeub.com/icons/png/msg_error-0.png'
};

let isIEOpen = false;
window.startDialup = function() {
    const btn = document.querySelector('#dialup-dialog button');
    btn.innerText = "Dialing..."; btn.disabled = true; btn.style.width = '100px';
    if (dialupSound) { dialupSound.currentTime = 0; dialupSound.play().catch(e=>{}); }
    setTimeout(() => {
        document.getElementById('dialup-dialog').style.display = 'none';
        btn.innerText = "Connect"; btn.disabled = false;
        isIEOpen = true;
        openApp('ie-window');
        const javaApplet = document.getElementById('java-applet');
        if(javaApplet) {
            javaApplet.style.display = 'block';
            setTimeout(() => javaApplet.style.display = 'none', 5000);
        }
    }, 6000);
}

const taskbarTasks = document.getElementById('taskbar-tasks');
window.openApp = function(appId) {
    if(appId === 'null') { alert("Recycle Bin is empty."); return; }
    
    if(appId === 'dontclick') {
        openApp('dontclick-window');
        setTimeout(() => triggerBSOD("SYSTEM_CORE_CORRUPTION"), 5000);
        return;
    }
    
    window.cleanSystem = function() {
        // Remove all ads
        document.querySelectorAll('.window').forEach(el => {
            if (el.style.backgroundImage && el.style.backgroundImage.includes('url')) {
                el.remove();
            }
        });
        
        // Restore background
        document.getElementById('desktop').style.background = '#008080';
        document.getElementById('desktop').style.backgroundImage = 'url("win98_wallpaper.png")';
        
        alert('System Cleaned Successfully! Viruses and ads have been removed.');
    };
    
    // 43. Dial up logic
    if(appId === 'ie-window' && !isIEOpen) {
        document.getElementById('dialup-dialog').style.display = 'flex';
        bringToFront(document.getElementById('dialup-dialog'));
        return;
    }
    


    // Hourglass
    document.body.classList.add('loading');
    setTimeout(() => document.body.classList.remove('loading'), 1000);
    
    const win = document.getElementById(appId);
    if (!win) return;
    
    if (win.style.display === 'none' || win.style.display === '') {
        win.style.display = 'flex';
        
        // Add to Taskbar
        if (!document.getElementById('task-' + appId) && taskbarTasks) {
            const task = document.createElement('div');
            task.className = 'task'; task.id = 'task-' + appId;
            const tbText = win.querySelector('.title-bar-text');
            const title = tbText ? tbText.textContent : appId;
            const iconSrc = appIcons[appId] || 'https://win98icons.alexmeub.com/icons/png/window-0.png';
            task.innerHTML = `<img src="${iconSrc}"> <span>${title}</span>`;
            task.onclick = () => {
                if (win.style.display === 'none') { win.style.display = 'flex'; bringToFront(win); }
                else if (win.classList.contains('inactive')) bringToFront(win);
                else { win.style.display = 'none'; task.classList.remove('active'); }
            };
            taskbarTasks.appendChild(task);
        }
    }
    bringToFront(win);
    document.getElementById('start-menu').style.display = 'none';
}

window.closeApp = function(appId) {
    const win = document.getElementById(appId);
    if(win) win.style.display = 'none';
    const t = document.getElementById('task-' + appId);
    if(t) t.remove();
    // Fix Dialup Loophole
    if(appId === 'dialup-dialog') isIEOpen = false; 
}

window.startOEMScan = function() {
    let btn = document.getElementById('av-scan-btn');
    let bar = document.getElementById('av-progress');
    if(!btn || !bar || btn.disabled) return;
    btn.disabled = true;
    let progress = 0;
    let intv = setInterval(() => {
        progress += Math.random() * 5;
        if(progress > 85) progress += 10;
        if(progress >= 100) {
            progress = 100;
            clearInterval(intv);
            setTimeout(() => {
                triggerBSOD("SYSTEM_DEFENDER_CRITICAL_FAULT");
            }, 500);
        }
        bar.style.width = progress + '%';
    }, 200);
}

function updateTaskbarActive(activeId) {
    document.querySelectorAll('.task').forEach(t => t.classList.remove('active'));
    const t = document.getElementById('task-' + activeId);
    if (t) t.classList.add('active');
}

document.querySelectorAll('.app-window').forEach(win => {
    win.addEventListener('mousedown', () => bringToFront(win));
    const titleBar = win.querySelector('.title-bar');
    const btnMin = win.querySelector('.btn-min');
    const btnMax = win.querySelector('.btn-max');
    const btnClose = win.querySelector('.btn-close');
    
    if(btnMin) btnMin.onclick = (e) => { e.stopPropagation(); win.style.display = 'none'; updateTaskbarActive(''); };
    
    if(btnClose && !btnClose.hasAttribute('onclick')) {
        btnClose.onclick = (e) => { e.stopPropagation(); closeApp(win.id); };
    }
    
    if(btnMax) btnMax.onclick = (e) => {
        e.stopPropagation();
        if(win.dataset.maximized === 'true') {
            win.style.width = win.dataset.oldW; win.style.height = win.dataset.oldH;
            win.style.left = win.dataset.oldL; win.style.top = win.dataset.oldT;
            win.dataset.maximized = 'false';
        } else {
            win.dataset.oldW = win.style.width; win.dataset.oldH = win.style.height;
            win.dataset.oldL = win.style.left; win.dataset.oldT = win.style.top;
            win.style.width = '100vw'; win.style.height = 'calc(100vh - 30px)';
            win.style.left = '0'; win.style.top = '0';
            win.dataset.maximized = 'true';
        }
        bringToFront(win);
    };

    if(titleBar) {
        let isDragging = false, startX, startY, startLeft, startTop;
        titleBar.addEventListener('mousedown', (e) => {
            if(e.target.closest('button') || win.dataset.maximized === 'true') return;
            isDragging = true; startX = e.clientX; startY = e.clientY;
            startLeft = win.offsetLeft; startTop = win.offsetTop;
        });
        document.addEventListener('mousemove', (e) => {
            if(!isDragging) return;
            win.style.left = (startLeft + e.clientX - startX) + 'px';
            win.style.top = (startTop + e.clientY - startY) + 'px';
            if (Math.random() < 0.4) {
                const trail = win.cloneNode(true);
                trail.removeAttribute('id');
                trail.style.pointerEvents = 'none';
                trail.style.zIndex = highestZ - 1;
                trail.classList.add('drag-artifact');
                document.getElementById('desktop').appendChild(trail);
            }
        });
        document.addEventListener('mouseup', () => { 
            isDragging = false; 
            document.querySelectorAll('.drag-artifact').forEach(el => el.remove()); 
        });
    }
    
    const resizer = win.querySelector('.resize-handle');
    if(resizer) {
        let isResizing = false, rStartX, rStartY, rStartW, rStartH;
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true; rStartX = e.clientX; rStartY = e.clientY;
            rStartW = parseInt(window.getComputedStyle(win).width, 10);
            rStartH = parseInt(window.getComputedStyle(win).height, 10);
            e.stopPropagation();
        });
        document.addEventListener('mousemove', (e) => {
            if(isResizing) {
                win.style.width = Math.max(200, rStartW + e.clientX - rStartX) + 'px';
                win.style.height = Math.max(100, rStartH + e.clientY - rStartY) + 'px';
            }
        });
        document.addEventListener('mouseup', () => isResizing = false);
    }
});

// Close internals (Dialog Cancel Buttons)
document.querySelectorAll('.btn-close-internal').forEach(btn => {
    btn.onclick = (e) => {
        e.stopPropagation();
        const win = e.target.closest('.app-window');
        if(win) closeApp(win.id);
    }
});

// Setup Icons & Group Dragging (11)
let selectedIcons = [];

function setupIcon(icon) {
    icon.addEventListener('mousedown', (e) => {
        if(e.button !== 0) return;
        e.stopPropagation();
        if(!e.ctrlKey && !icon.classList.contains('selected')) {
            document.querySelectorAll('.icon-wrapper').forEach(i => i.classList.remove('selected'));
        }
        icon.classList.add('selected');
        selectedIcons = Array.from(document.querySelectorAll('.icon-wrapper.selected'));
    });
    icon.addEventListener('dblclick', () => { if(icon.dataset.app) openApp(icon.dataset.app); });
}

let clippyClicks = 0;
const clippyMessages = [
    "It looks like you're trying to click me. Need help?",
    "Please don't click too hard, my pages are fragile.",
    "Did you know? Deleting System32 frees up space!",
    "I'm watching you browse...",
    "Stop clicking me, I'm trying to sleep.",
    "Why are you still here? The system is compromised.",
    "Help! I'm trapped in a retro OS simulation!",
    "You have 3 seconds to close this window before I crash the OS."
];
window.triggerClippyEvents = function() {
    if(document.body.classList.contains('haunted-mode')) return;
    clippyClicks++;
    let cl = document.getElementById('clippy-speech');
    if(!cl) return;
    cl.style.display = 'block';
    
    // Pick a random message
    let msg = clippyMessages[Math.floor(Math.random() * clippyMessages.length)];
    cl.innerText = msg;
    
    // Perform chaos on every 3 clicks
    if(clippyClicks % 3 === 0) {
        let chaosTypes = [
            () => triggerBSOD('CLIPPY_FATAL_ERROR'),
            () => window.spamErrorSounds(),
            () => document.getElementById('audio-chord').play().catch(e=>{}),
            () => { document.body.style.filter = "hue-rotate(" + (Math.random()*360) + "deg)"; },
            () => { document.body.style.transform = "rotate(" + (Math.random() > 0.5 ? 5 : -5) + "deg)"; }
        ];
        chaosTypes[Math.floor(Math.random() * chaosTypes.length)]();
    }
    
    setTimeout(() => {
        if(clippyClicks % 3 !== 0) cl.style.display = 'none';
    }, 4000);
};
document.querySelectorAll('.icon-wrapper').forEach(setupIcon);

// Keyboard Nav
document.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && document.activeElement.classList.contains('icon-wrapper')) {
        const appId = document.activeElement.dataset.app;
        if(appId) openApp(appId);
    }
});
document.getElementById('desktop').addEventListener('mousedown', (e) => {
    if(e.target === document.getElementById('desktop')) document.querySelectorAll('.icon-wrapper').forEach(i => i.classList.remove('selected'));
});

// Selection Box
const desktop = document.getElementById('desktop');
const selBox = document.getElementById('selection-box');
let isSelecting = false, selStartX, selStartY;
desktop.addEventListener('mousedown', (e) => {
    if(e.target !== desktop || e.button !== 0) return;
    isSelecting = true; selStartX = e.pageX; selStartY = e.pageY;
    if(selBox) {
        selBox.hidden = false; selBox.style.left = selStartX + 'px'; selBox.style.top = selStartY + 'px';
        selBox.style.width = '0px'; selBox.style.height = '0px';
    }
});
document.addEventListener('mousemove', (e) => {
    if(!isSelecting) return;
    const currentX = e.pageX, currentY = e.pageY;
    const boxL = Math.min(selStartX, currentX); const boxT = Math.min(selStartY, currentY);
    const boxW = Math.abs(currentX - selStartX); const boxH = Math.abs(currentY - selStartY);
    if(selBox) {
        selBox.style.left = boxL + 'px'; selBox.style.top = boxT + 'px';
        selBox.style.width = boxW + 'px'; selBox.style.height = boxH + 'px';
    }
    document.querySelectorAll('.icon-wrapper').forEach(icon => {
        if(icon.style.display === 'none') return;
        const rect = icon.getBoundingClientRect();
        if(rect.left < boxL + boxW && rect.right > boxL && rect.top < boxT + boxH && rect.bottom > boxT) icon.classList.add('selected');
        else icon.classList.remove('selected');
    });
});
document.addEventListener('mouseup', () => { isSelecting = false; if(selBox) selBox.hidden = true; });

// IE Features
window.showIEView = function(view) {
    const g = document.getElementById('ie-google');
    const y = document.getElementById('ie-yahoo');
    if(g) g.style.display = 'none';
    if(y) y.style.display = 'none';
    const target = document.getElementById('ie-' + view);
    if(target) target.style.display = (view==='google'?'flex':'block');
    const addr = document.getElementById('ie-address');
    if(addr) addr.value = (view==='google'?'http://www.google.com':'http://www.yahoo.com');
}
window.toggleIEHistory = function() {
    const sb = document.getElementById('ie-sidebar');
    const ct = document.getElementById('ie-sidebar-content');
    const title = document.getElementById('ie-sidebar-title');
    if(!sb || !ct || !title) return;
    if(sb.style.display === 'block' && title.innerText === 'History') { sb.style.display = 'none'; return; }
    sb.style.display = 'block'; title.innerText = 'History';
    ct.innerHTML = '<ul style="padding-left:15px;margin:0;"><li>google.com</li><li>yahoo.com</li><li>askjeeves.com</li></ul>';
}
window.toggleIEFavorites = function() {
    const sb = document.getElementById('ie-sidebar');
    const ct = document.getElementById('ie-sidebar-content');
    const title = document.getElementById('ie-sidebar-title');
    if(!sb || !ct || !title) return;
    if(sb.style.display === 'block' && title.innerText === 'Favorites') { sb.style.display = 'none'; return; }
    sb.style.display = 'block'; title.innerText = 'Favorites';
    ct.innerHTML = '<ul style="padding-left:15px;margin:0;"><li><a href="#" onclick="showIEView(\'yahoo\')">Yahoo!</a></li><li><a href="#">Games</a></li></ul>';
}
window.handleSearch = function(e) {
    e.preventDefault();
    const query = document.getElementById('search-input').value;
    document.getElementById('ie-iframe').src = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
    
    const bar = document.getElementById('fake-loading-bar');
    if(bar) { bar.style.display = 'block'; bar.style.width = '0%'; }
    if (dialupSound) { dialupSound.currentTime = 0; dialupSound.play().catch(e=>{}); }
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10; if(bar) bar.style.width = progress + '%';
        if(progress >= 100) { clearInterval(interval); }
    }, 200);
};

// Download Manager
window.startDownloadManager = function() {
    openApp('download-window');
    let p = 0;
    const bar = document.getElementById('dl-progress');
    const tm = document.getElementById('dl-time');
    const int = setInterval(() => {
        p += 5; if(bar) bar.style.width = p + '%';
        if(tm) tm.innerText = `39 min 12 sec (${(Math.random()*2+2).toFixed(1)} KB/Sec)`;
        if(p >= 100) { clearInterval(int); closeApp('download-window'); }
    }, 1000);
}

// Webcam Pro
// Webcam functionality defined above

// Calc logic
let calcVal = '';
let isScientific = false;
window.calcPress = function(v) { calcVal += v; const d = document.getElementById('calc-display'); if(d) d.value = calcVal; };
window.calcEval = function() { 
    const d = document.getElementById('calc-display');
    try { let result = eval(calcVal); if (result === Infinity || isNaN(result)) throw new Error(); calcVal = result.toString(); if(d) d.value = calcVal; } 
    catch(e) { if(d) d.value = 'Error'; calcVal = ''; } 
};
window.calcClear = function() { calcVal = ''; const d = document.getElementById('calc-display'); if(d) d.value = ''; };
window.toggleCalcMode = function() {
    isScientific = !isScientific;
    const win = document.getElementById('calc-window');
    const grid = document.getElementById('calc-grid');
    if(!win || !grid) return;
    if(isScientific) {
        win.style.width = '400px';
        grid.style.gridTemplateColumns = 'repeat(6, 1fr)';
        grid.innerHTML = `<button onclick="calcPress('Math.sin(')">sin</button><button onclick="calcPress('Math.cos(')">cos</button><button onclick="calcPress('7')">7</button><button onclick="calcPress('8')">8</button><button onclick="calcPress('9')">9</button><button onclick="calcPress('/')">/</button><button onclick="calcPress('Math.tan(')">tan</button><button onclick="calcPress('Math.log(')">log</button><button onclick="calcPress('4')">4</button><button onclick="calcPress('5')">5</button><button onclick="calcPress('6')">6</button><button onclick="calcPress('*')">*</button><button onclick="calcPress('(')">(</button><button onclick="calcPress(')')">)</button><button onclick="calcPress('1')">1</button><button onclick="calcPress('2')">2</button><button onclick="calcPress('3')">3</button><button onclick="calcPress('-')">-</button><button onclick="calcPress('Math.PI')">pi</button><button onclick="calcPress('Math.sqrt(')">sqrt</button><button onclick="calcPress('0')">0</button><button onclick="calcPress('.')">.</button><button onclick="calcEval()">=</button><button onclick="calcPress('+')">+</button><button onclick="calcClear()" style="grid-column: span 6;">Clear</button>`;
    } else {
        win.style.width = '250px';
        grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        grid.innerHTML = `<button onclick="calcPress('7')">7</button><button onclick="calcPress('8')">8</button><button onclick="calcPress('9')">9</button><button onclick="calcPress('/')">/</button><button onclick="calcPress('4')">4</button><button onclick="calcPress('5')">5</button><button onclick="calcPress('6')">6</button><button onclick="calcPress('*')">*</button><button onclick="calcPress('1')">1</button><button onclick="calcPress('2')">2</button><button onclick="calcPress('3')">3</button><button onclick="calcPress('-')">-</button><button onclick="calcPress('0')">0</button><button onclick="calcPress('.')">.</button><button onclick="calcEval()">=</button><button onclick="calcPress('+')">+</button><button onclick="calcClear()" style="grid-column: span 4;">Clear</button>`;
    }
}

// CMD Logic
const cmdInput = document.getElementById('cmd-input');
const cmdOutput = document.getElementById('cmd-output');
const cmdBody = document.getElementById('cmd-body');
if(cmdInput && cmdOutput) {
window.executeCmd = function() {
    const val = cmdInput.value.toLowerCase().trim();
    if(!val) {
        showWarning("Please enter a command.");
        return;
    }
    if (val === 'format c:' || val === 'virus') {
        cmdOutput.innerHTML += "C:\\WINDOWS> " + val + "<br>";
        triggerBSOD('FATAL_USER_COMMAND');
    }
    else {
        cmdOutput.innerHTML += "C:\\WINDOWS> " + val + "<br>";
        if(val === 'dir') cmdOutput.innerHTML += " Volume in drive C has no label.<br> Directory of C:\\WINDOWS<br>SYSTEM32 &lt;DIR&gt;<br>";
        else if (val === 'cls') cmdOutput.innerHTML = '';
        else if (val === 'help') cmdOutput.innerHTML += "Available commands:<br>DIR - Displays a list of files and subdirectories in a directory.<br>CLS - Clears the screen.<br>FORMAT C: - Formats the disk.<br>EXIT - Quits the MS-DOS Prompt.<br>";
        else if (val === 'exit') document.getElementById('cmd-window').style.display = 'none';
        else if (val.startsWith('color ')) {
            const code = val.split(' ')[1];
            if(code === '0a') { cmdBody.style.background = '#000'; cmdBody.style.color = '#0f0'; }
        }
        else if (val === 'tree') cmdOutput.innerHTML += "C:\\<br>â”œâ”€WINDOWS<br>â”œâ”€SYSTEM32<br>â””â”€PROGRAM FILES<br>";
        else if (val !== '') cmdOutput.innerHTML += "Bad command or file name.<br>Type 'help' for a list of commands.<br>";
        cmdInput.value = '';
        if(cmdBody) cmdBody.scrollTop = cmdBody.scrollHeight;
    }
};
}

// Paint logic
const paintCanvas = document.getElementById('paint-canvas');
if(paintCanvas) {
    const ctx = paintCanvas.getContext('2d');
    let isDrawing = false; 
    window.paintColor = 'black';
    window.paintTool = 'pencil';
    window.setPaintTool = function(tool) { window.paintTool = tool; };

    paintCanvas.addEventListener('mousedown', (e) => { 
        if(window.paintTool === 'fill') {
            ctx.fillStyle = window.paintColor;
            ctx.fillRect(0,0, paintCanvas.width, paintCanvas.height);
            return;
        }
        isDrawing = true; 
        ctx.beginPath(); 
        ctx.moveTo(e.offsetX, e.offsetY); 
    });
    paintCanvas.addEventListener('mousemove', (e) => { 
        if(!isDrawing || window.paintTool === 'fill') return; 
        ctx.lineTo(e.offsetX, e.offsetY); 
        ctx.strokeStyle = window.paintTool === 'eraser' ? 'white' : window.paintColor; 
        ctx.lineWidth = window.paintTool === 'brush' ? 6 : (window.paintTool === 'eraser' ? 20 : 2); 
        ctx.lineCap = 'round'; 
        ctx.lineJoin = 'round'; 
        ctx.stroke(); 
    });
    paintCanvas.addEventListener('mouseup', () => isDrawing = false);
    paintCanvas.addEventListener('mouseout', () => isDrawing = false);
}

// MSN Messenger
window.sendChat = function() {
    const input = document.getElementById('msn-input');
    const text = input.value.trim();
    if(!text) return;
    input.value = '';
    const hist = document.getElementById('msn-chat-history');
    hist.innerHTML += `<div><b>You:</b> ${text}</div>`;
    hist.scrollTop = hist.scrollHeight;
    
    setTimeout(() => {
        const replies = ["brb lol", "asl?", "rofl", "omg literally same", "g2g bye!"];
        const reply = replies[Math.floor(Math.random()*replies.length)];
        hist.innerHTML += `<div><b style="color: blue;">SmaterChild:</b> ${reply}</div>`;
        hist.scrollTop = hist.scrollHeight;
        try { mailSound.play(); } catch(e) {}
    }, 1500);
};

// Dialer
window.dialCall = function() {
    if (dialupSound) { dialupSound.currentTime = 0; dialupSound.play().catch(e=>{}); }
    setTimeout(() => alert("Busy signal..."), 2000);
}

// Winamp Visualizer
// Winamp logic removed

// 67. Run Dialog
window.executeRun = function() {
    const runInput = document.getElementById('run-input');
    if(runInput && !runInput.value.trim()) {
        showWarning("Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.");
        return;
    }
    const v = runInput.value.toLowerCase();
    closeApp('run-dialog');
    if(v === 'calc') openApp('calc-window');
    else if(v === 'cmd') openApp('cmd-window');
    else if(v === 'notepad') openApp('notepad-window');
    else triggerBSOD('KERNEL32.DLL');
}

// 69. Save As
window.checkSaveBeforeClose = function() {
    document.getElementById('saveas-dialog').style.display = 'flex';
    bringToFront(document.getElementById('saveas-dialog'));
};

window.downloadWordpad = function() {
    // Generate a random position on the desktop
    const rx = Math.max(200, Math.random() * (window.innerWidth - 100));
    const ry = Math.max(50, Math.random() * (window.innerHeight - 100));
    
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'icon-wrapper';
    iconWrapper.style.top = ry + 'px';
    iconWrapper.style.left = rx + 'px';
    iconWrapper.tabIndex = 0;
    
    // On click, open notepad with this content? Or just BSOD? Let's make it open notepad with this content or crash. Let's just BSOD to be evil.
    iconWrapper.onclick = function() { triggerBSOD('FILE_SYSTEM_ERROR'); };
    
    iconWrapper.innerHTML = `<img src="https://win98icons.alexmeub.com/icons/png/notepad-0.png"><span class="icon-text">Document.txt</span>`;
    
    document.getElementById('desktop').appendChild(iconWrapper);
    
    // Play a "chord" sound to simulate success
    if (chordSound) { chordSound.currentTime = 0; chordSound.play().catch(e=>{}); }
};

// 71. Authentic Shutdown Sequence
window.shutDown = function() {
    const sm = document.getElementById('start-menu');
    if(sm) sm.style.display = 'none';
    
    const waitScreen = document.getElementById('shutdown-wait-screen');
    if(waitScreen) waitScreen.style.display = 'flex';
    
    setTimeout(() => {
        if(waitScreen) waitScreen.style.display = 'none';
        const finalScreen = document.getElementById('shutdown-final-screen');
        if(finalScreen) finalScreen.style.display = 'flex';
    }, 4000);
}

// 61. Evading Error Dialog
setInterval(() => {
    if(isBooting || document.body.classList.contains('haunted-mode') || Math.random() > 0.05) return;
    openApp('evading-error');
}, 60000);
window.cloneErrorWindow = function(btn) {
    const original = btn.closest('.viral-error');
    if (!original) return;
    if (errorSound) { let s = errorSound.cloneNode(); s.play().catch(e=>{}); }
    for(let i=0; i<3; i++) {
        const clone = original.cloneNode(true);
        highestZ++; clone.style.zIndex = highestZ;
        clone.style.top = (Math.random() * 80 + 10) + '%';
        clone.style.left = (Math.random() * 80 + 10) + '%';
        let titleBar = clone.querySelector('.title-bar');
        if (titleBar) {
            let isDragging = false, startX, startY, initialX, initialY;
            titleBar.onmousedown = function(e) { isDragging = true; startX = e.clientX; startY = e.clientY; initialX = clone.offsetLeft; initialY = clone.offsetTop; highestZ++; clone.style.zIndex = highestZ; };
            document.addEventListener('mousemove', function(e) { if(isDragging) { clone.style.left = (initialX + e.clientX - startX) + 'px'; clone.style.top = (initialY + e.clientY - startY) + 'px'; } });
            document.addEventListener('mouseup', function() { isDragging = false; });
        }
        document.getElementById('desktop').appendChild(clone);
    }
};

// Popups (53 - You've got mail voice) & Hydra effect
function spawnRandomAd() {
    if (isBooting || document.getElementById('bsod-screen').style.display === 'flex' || document.body.classList.contains('haunted-mode')) return;
    if (mailSound) { mailSound.currentTime = 0; mailSound.play().catch(e=>{}); }
    const adWin = document.createElement('div'); adWin.className = 'window app-window'; highestZ++;
    adWin.style.cssText = `position: absolute; top: ${Math.random()*60+10}%; left: ${Math.random()*60+10}%; width: 300px; z-index: ${highestZ};`;
    
    const adTypes = [
        { title: "DOWNLOAD RAM", text: "YOUR PC IS SLOW. DOWNLOAD 128MB FREE RAM NOW!", btn: "DOWNLOAD" },
        { title: "FREE iPOD!!!", text: "CONGRATULATIONS! YOU ARE THE 999,999TH VISITOR!", btn: "CLAIM NOW" },
        { title: "SECURITY ALERT", text: "YOUR COMPUTER IS INFECTED WITH 43 VIRUSES. CLICK TO CLEAN.", btn: "CLEAN SYSTEM" },
        { title: "SYSTEM WARNING", text: "VXD VMM(01) IS FAILING. PLEASE INSERT WINDOWS 98 CD-ROM.", btn: "OK" },
        { title: "CRITICAL ALERT", text: "YOUR DATA IS BEING CORRUPTED. DO NOT TURN OFF YOUR COMPUTER.", btn: "ACCEPT FATE", scary: true }
    ];
    let ad = adTypes[Math.floor(Math.random() * adTypes.length)];
    
    let bg = ad.scary ? "#000000" : "#c0c0c0";
    let color = ad.scary ? "#ff0000" : "#000";
    let tbBg = ad.scary ? "linear-gradient(90deg, #330000, #ff0000)" : "#000080";
    let tbColor = "#fff";
    
    adWin.innerHTML = `
        <div class="title-bar" style="background: ${tbBg};">
            <div class="title-bar-text" style="color: ${tbColor}; font-weight: bold; font-family: Tahoma, sans-serif;">${ad.title}</div>
            <div class="title-bar-controls"><button class="btn-close ad-close" aria-label="Close"></button></div>
        </div>
        <div class="window-body" style="background: ${bg}; color: ${color}; text-align: center; padding: 20px; font-family: Tahoma, sans-serif; border: 2px outset #fff;">
            <img src="https://win98icons.alexmeub.com/icons/png/msg_warning-0.png" width="32" style="margin-bottom: 10px;">
            <p style="margin: 0 0 15px 0; font-size: 11px;">${ad.text}</p>
            <button class="ad-btn" style="width: 120px;">${ad.btn}</button>
        </div>`;
    
    const tb = adWin.querySelector('.title-bar');
    let isDrag = false, sx, sy, sL, sT;
    tb.addEventListener('mousedown', (e) => { if(e.target.closest('button')) return; isDrag = true; sx = e.clientX; sy = e.clientY; sL = adWin.offsetLeft; sT = adWin.offsetTop; highestZ++; adWin.style.zIndex = highestZ; });
    document.addEventListener('mousemove', (e) => { if(!isDrag) return; adWin.style.left = (sL + e.clientX - sx) + 'px'; adWin.style.top = (sT + e.clientY - sy) + 'px'; });
    document.addEventListener('mouseup', () => isDrag = false);
    adWin.querySelector('.ad-close').onclick = (e) => { e.stopPropagation(); adWin.remove(); if(Math.random()>0.3) setTimeout(()=>spawnRandomAd(),200); };
    adWin.querySelector('.ad-btn').onclick = (e) => { e.stopPropagation(); adWin.remove(); setTimeout(()=>spawnRandomAd(),200); };
    adWin.onmousedown = () => { highestZ++; adWin.style.zIndex = highestZ; };
    document.getElementById('desktop').appendChild(adWin);
}
setInterval(() => { if(!isBooting && document.getElementById('bsod-screen').style.display !== 'flex' && !document.body.classList.contains('haunted-mode') && Math.random() > 0.8) spawnRandomAd(); }, 45000);

// Helper for 57 Don't Click Folder
function spawnAd() { spawnRandomAd(); }

window.wipeInterval = null;
window.triggerWipe = function() {
    openApp('deletion-window');
    document.getElementById('del-progress').style.width = '0%';
    let p = 0;
    if(window.wipeInterval) clearInterval(window.wipeInterval);
    window.wipeInterval = setInterval(() => { 
        p += 1; 
        const b = document.getElementById('del-progress'); 
        if(b) b.style.width = p + '%'; 
        if(p >= 100) {
            clearInterval(window.wipeInterval);
            triggerBSOD('DRIVE_WIPED');
        }
    }, 150);
};

window.abortWipe = function() {
    if(window.wipeInterval) clearInterval(window.wipeInterval);
    closeApp('deletion-window');
    alert('Deletion aborted successfully. Files are safe.');
};

// 58. Fake Deletion
setTimeout(() => {
    if(isBooting || Math.random() > 0.5) return;
    triggerWipe();
}, 45000);

// Context Menu & New Folder
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    let ctx = document.getElementById('context-menu');
    if(!ctx) {
        ctx = document.createElement('div');
        ctx.id = 'context-menu';
        ctx.innerHTML = `
            <div class="ctx-item" onclick="createNewFolder(event)">New Folder</div>
            <hr>
            <div class="ctx-item" onclick="location.reload()">Refresh</div>
            <div class="ctx-item" onclick="alert('Properties: Windows 98 Simulation')">Properties</div>
            <hr>
            <div class="ctx-item" onclick="changeWallpaper()">Change Wallpaper</div>
            <div class="ctx-item" onclick="openApp('crt-settings-window')">Personalize</div>
        `;
        document.body.appendChild(ctx);
    }
    ctx.style.display = 'block';
    
    // Prevent menu from going off-screen
    const mWidth = 150, mHeight = 160;
    let px = e.pageX, py = e.pageY;
    if(px + mWidth > window.innerWidth) px = window.innerWidth - mWidth;
    if(py + mHeight > window.innerHeight) py = window.innerHeight - mHeight;
    ctx.style.left = px + 'px';
    ctx.style.top = py + 'px';
});
document.addEventListener('mousedown', (e) => {
    const ctx = document.getElementById('context-menu');
    if(ctx && e.button !== 2 && !e.target.closest('#context-menu')) ctx.style.display = 'none';
});

const wallpapers = ['#008080', 'url("win98_wallpaper.png")', 'url("https://win98icons.alexmeub.com/images/clouds.png")', 'url("https://win98icons.alexmeub.com/images/setup.png")', 'url("https://win98icons.alexmeub.com/images/black_thatch.png")'];
let currentWallpaperIdx = 0;
window.changeWallpaper = function() {
    const desktop = document.getElementById('desktop');
    currentWallpaperIdx = (currentWallpaperIdx + 1) % wallpapers.length;
    const bg = wallpapers[currentWallpaperIdx];
    if (bg.startsWith('#')) {
        desktop.style.backgroundImage = 'none';
        desktop.style.backgroundColor = bg;
    } else {
        desktop.style.backgroundImage = bg;
        desktop.style.backgroundRepeat = 'repeat';
    }
    const ctx = document.getElementById('context-menu');
    if(ctx) ctx.style.display = 'none';
}

let folderCount = 1;
window.createNewFolder = function(e) {
    const ctx = document.getElementById('context-menu');
    if(ctx) ctx.style.display = 'none';
    const folder = document.createElement('div');
    folder.className = 'icon-wrapper';
    folder.style.left = e.pageX + 'px';
    folder.style.top = e.pageY + 'px';
    folder.innerHTML = `<img src="https://win98icons.alexmeub.com/icons/png/directory_closed-4.png"><span class="icon-text" contenteditable="true" style="background:white;color:black;">New Folder ${folderCount++}</span>`;
    document.getElementById('new-folders-container').appendChild(folder);
    setupIcon(folder);
    const textSpan = folder.querySelector('.icon-text');
    textSpan.focus();
    textSpan.onblur = () => { textSpan.style.background = 'transparent'; textSpan.style.color = 'white'; };
    textSpan.onmousedown = (ev) => ev.stopPropagation();
}

// Init Minesweeper Grid
const msGrid = document.getElementById('minesweeper-grid');
if(msGrid) {
    msGrid.innerHTML = '';
    for(let i=0; i<81; i++) {
        const cell = document.createElement('div');
        cell.style.width = '20px'; cell.style.height = '20px';
        cell.style.background = '#c0c0c0'; cell.style.border = '2px outset #fff';
        cell.onclick = function() {
            this.style.border = '1px solid #808080';
            this.style.background = '#e0e0e0';
            if(Math.random() < 0.15) {
                this.innerHTML = '<img src="https://win98icons.alexmeub.com/icons/png/game_mine_1-0.png" width="16" style="display: block; margin: 0 auto; padding-top: 1px;">'; this.style.background = 'red';
                setTimeout(() => alert('BOOM! Game Over.'), 100);
            } else {
                const count = Math.floor(Math.random()*3);
                if(count > 0) this.innerHTML = count;
                this.style.color = ['blue', 'green', 'red'][count-1] || 'black';
                this.style.fontWeight = 'bold'; this.style.textAlign = 'center'; this.style.lineHeight = '18px';
            }
        };
        msGrid.appendChild(cell);
    }
}




window.openRecycledFile = function(filename) {
    if (filename === 'secret.txt') {
        openApp('notepad-window');
        document.getElementById('wordpad-editor').innerHTML = 'Hello! You found the secret file!<br><br>The password for the administrator account is "password123".<br><br>- Admin';
    } else if (filename === 'DO_NOT_READ.doc') {
        openApp('notepad-window');
        document.getElementById('wordpad-editor').innerHTML = 'I TOLD YOU NOT TO READ THIS.<br><br>THEY ARE WATCHING YOU.';
    } else if (filename === 'virus.exe') {
        for(let i=0; i<30; i++) setTimeout(spawnRandomAd, i*100);
    } else if (filename === 'C_DRIVE_BACKUP.bin') {
        triggerBSOD('C_DRIVE_BACKUP.bin');
    }
};

window.checkAdminPassword = function() {
    const input = document.getElementById('admin-password-input');
    if (input.value === 'password123') {
        closeApp('admin-login-window');
        openApp('admin-panel-window');
        input.value = '';
    } else {
        alert("Incorrect password.");
        input.value = '';
    }
};

window.updateCRT = function() {
    const scanlines = document.getElementById('crt-scanlines').value / 100;
    const flicker = document.getElementById('crt-flicker').value / 100;
    const minFlicker = 1.0 - (0.02 * flicker);
    document.documentElement.style.setProperty('--crt-opacity', scanlines);
    document.documentElement.style.setProperty('--flicker-min', minFlicker);
};





window.loadIEPage = function() {
    if(document.body.classList.contains('haunted-mode')) return;
    const address = document.getElementById('ie-address').value;
    const iframe = document.getElementById('ie-frame');
    let dialup = new Audio('https://www.myinstants.com/media/sounds/dial-up-modem-02.mp3');
    dialup.play().catch(e=>{});
    setTimeout(() => {
        iframe.src = 'data:text/html,<html><body style="background:black;color:lime;font-family:\'Courier New\',monospace;"><h1>404 NOT FOUND</h1><p>Geocities is down...</p></body></html>';
        if(Math.random() > 0.5) triggerBSOD('IE4.0_CRASH');
    }, 4000);
};

window.winampAudio = null;
window.playWinamp = function() {
    if(document.body.classList.contains('haunted-mode')) return;
    if(window.winampAudio) {
        window.winampAudio.pause();
        window.winampAudio.currentTime = 0;
    }
    window.winampAudio = new Audio('https://www.myinstants.com/media/sounds/winamp-llama.mp3');
    window.winampAudio.play().catch(e=>{});
};
window.stopWinamp = function() {
    if(window.winampAudio) {
        window.winampAudio.pause();
        window.winampAudio.currentTime = 0;
    }
};

window.triggerSolitaireVirus = function() {
    if(document.body.classList.contains('haunted-mode')) return;
    const cardImg = 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Card_back_01.svg';
    for(let i=0; i<50; i++) {
        setTimeout(() => {
            let c = document.createElement('img');
            c.src = cardImg;
            c.style.position = 'absolute';
            c.style.left = Math.random() * window.innerWidth + 'px';
            c.style.top = Math.random() * window.innerHeight + 'px';
            c.style.width = '70px';
            c.style.zIndex = 10000 + i;
            document.body.appendChild(c);
            let dx = (Math.random() - 0.5) * 20;
            let dy = -10;
            let bounces = 0;
            let ival = setInterval(() => {
                let x = parseFloat(c.style.left);
                let y = parseFloat(c.style.top);
                x += dx;
                y += dy;
                dy += 1; // gravity
                if(y > window.innerHeight) { y = window.innerHeight; dy = -dy * 0.8; bounces++; }
                c.style.left = x + 'px';
                c.style.top = y + 'px';
                if (bounces > 5 || x > window.innerWidth || x < -100) {
                    clearInterval(ival);
                    if(c.parentNode) c.parentNode.removeChild(c);
                }
            }, 30);
        }, i * 100);
    }
    setTimeout(() => triggerBSOD('SOLITAIRE_CASCADE'), 8000);
};

window.startSolitaire = function() {
    document.getElementById('game-title').innerText='Solitaire'; 
    document.getElementById('game-iframe').src='https://hectorvilas.github.io/solitaire/'; 
    openApp('game-window');
};

window.startFreeCell = function() {
    document.getElementById('game-title').innerText='FreeCell';
    document.getElementById('game-iframe').src='https://gitbrent.github.io/FreecellJS/';
    openApp('game-window');
};

window.playWMP = function() {
    if(document.body.classList.contains('haunted-mode')) return;
    let midi = new Audio('https://freemidi.org/getter-26017');
    midi.play().catch(e=>{});
    // Removed BSOD, now just plays music!
};

window.startDefrag = function() {
    if(document.body.classList.contains('haunted-mode')) return;
    const grid = document.getElementById('defrag-grid');
    if(!grid) return;
    grid.innerHTML = '';
    for(let i=0; i<200; i++) {
        let block = document.createElement('div');
        block.style.background = Math.random() > 0.5 ? 'red' : 'blue';
        grid.appendChild(block);
    }
    let blocks = grid.children;
    let idx = 0;
    let defragInterval = setInterval(() => {
        if(idx >= blocks.length) {
            clearInterval(defragInterval);
            alert('Defragmentation Complete!');
            return;
        }
        blocks[idx].style.background = 'blue';
        idx++;
    }, 50);
};

document.addEventListener('keydown', (e) => {
    if(e.ctrlKey && e.altKey && e.key === 'Delete') {
        openApp('taskmgr-window');
    }
});

// Phase 5 Viruses
window.startMeltingScreen = function() {
    if(document.body.classList.contains('haunted-mode')) return;
    document.body.style.transition = 'all 10s ease-in';
    document.body.style.transform = 'translateY(100vh) scaleY(2)';
    document.body.style.filter = 'blur(5px)';
    setTimeout(()=>triggerBSOD('MELTING_SCREEN'), 8000);
};

window.startCursorDuplication = function() {
    if(document.body.classList.contains('haunted-mode')) return;
    document.addEventListener('click', (e) => {
        let cursor = document.createElement('img');
        cursor.src = 'https://win98icons.alexmeub.com/icons/png/mouse-0.png';
        cursor.style.position = 'absolute';
        cursor.style.left = e.pageX + 'px';
        cursor.style.top = e.pageY + 'px';
        cursor.style.zIndex = 999999;
        document.body.appendChild(cursor);
    });
};

window.startInvertedColors = function() {
    if(document.body.classList.contains('haunted-mode')) return;
    document.body.style.filter = 'invert(100%) hue-rotate(180deg)';
    let a = new Audio('https://www.myinstants.com/media/sounds/scary-horror-sound-effect.mp3');
    a.play().catch(e=>{});
    setTimeout(()=>triggerBSOD('INVERTED_COLORS'), 6000);
};

window.startStartButtonRunaway = function() {
    if(document.body.classList.contains('haunted-mode')) return;
    let btn = document.querySelector('.start-btn');
    if(!btn) return;
    btn.addEventListener('mouseover', () => {
        btn.style.position = 'absolute';
        btn.style.left = Math.random() * 80 + 'vw';
        btn.style.top = Math.random() * 80 + 'vh';
    });
};

window.startIconScramble = function() {
    if(document.body.classList.contains('haunted-mode')) return;
    setInterval(() => {
        document.querySelectorAll('.icon-wrapper').forEach(icon => {
            icon.style.left = Math.random() * 80 + 'vw';
            icon.style.top = Math.random() * 80 + 'vh';
        });
    }, 10000);
};

window.startHardwareFailure = function() {
    if(document.body.classList.contains('haunted-mode')) return;
    let a = new Audio('https://www.myinstants.com/media/sounds/screeching-hard-drive.mp3');
    a.play().catch(e=>{});
    setTimeout(()=>{
        alert('S.M.A.R.T. Failure Predicted on Hard Disk 0...');
        triggerBSOD('HARDWARE_FAILURE');
    }, 2000);
};

window.startCascade = function() {
    if(document.body.classList.contains('haunted-mode')) return;
    let t = 0;
    let cascadeInterval = setInterval(() => {
        let err = document.createElement('div');
        err.style.position = 'absolute';
        err.style.width = '200px';
        err.style.height = '100px';
        err.style.background = '#c0c0c0';
        err.style.border = '2px outset #fff';
        err.style.left = (t % 800) + 'px';
        err.style.top = (t % 600) + 'px';
        err.style.zIndex = 999999;
        err.innerHTML = '<div style="background:navy;color:white;padding:2px;">Error</div><div style="padding:10px;">Task Failed Successfully.</div>';
        document.body.appendChild(err);
        t += 20;
        if(t > 2000) {
            clearInterval(cascadeInterval);
            triggerBSOD('CASCADE_OVERFLOW');
        }
    }, 50);
};

setInterval(()=>{
    if(!isBooting && !document.body.classList.contains('haunted-mode')) {
        let r = Math.random();
        if(r < 0.01) startMeltingScreen();
        else if(r < 0.02) startCursorDuplication();
        else if(r < 0.03) startInvertedColors();
        else if(r < 0.04) startStartButtonRunaway();
        else if(r < 0.05) startIconScramble();
        else if(r < 0.06) startHardwareFailure();
        else if(r < 0.07) startCascade();
    }
}, 30000);


// Hover sounds
document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.icon-wrapper') || e.target.closest('.start-item') || e.target.closest('button')) {
        let tick = new Audio('https://www.myinstants.com/media/sounds/tick.mp3');
        tick.volume = 0.1;
        tick.play().catch(err=>{});
    }
});
// HDD Sounds
setInterval(() => {
    if(isBooting || document.body.classList.contains('haunted-mode')) return;
    if(Math.random() < 0.1) {
        let hdd = new Audio('https://www.myinstants.com/media/sounds/hard-drive-reading-writing-sound.mp3');
        hdd.volume = 0.2;
        hdd.play().catch(err=>{});
    }
}, 5000);

window.spamErrorSounds = function() { if(document.body.classList.contains('haunted-mode')) return; for(let i=0;i<100;i++){ setTimeout(()=>{ let a = new Audio('https://www.myinstants.com/media/sounds/erro.mp3'); a.play().catch(e=>{}); }, i*50); } };

// Random CD-ROM popups
setInterval(() => {
    if(isBooting || document.body.classList.contains('haunted-mode')) return;
    if(Math.random() < 0.05) {
        openApp('cdrom-window');
    }
}, 10000);

setInterval(()=>{if(!isBooting && !document.body.classList.contains('haunted-mode') && Math.random()<0.03) { let cl = document.getElementById('clippy'); if(cl) cl.style.display='block'; }}, 15000);

window.startMicJumpScare = function() { if(document.body.classList.contains('haunted-mode')) return; navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => { const audioCtx = new (window.AudioContext || window.webkitAudioContext)(); const source = audioCtx.createMediaStreamSource(stream); const oscillator = audioCtx.createOscillator(); oscillator.type = 'square'; oscillator.frequency.value = 100; const gainNode = audioCtx.createGain(); source.connect(gainNode); gainNode.connect(audioCtx.destination); gainNode.gain.value = 5; setTimeout(()=>triggerBSOD('MIC_OVERLOAD'), 5000); }).catch(e=>{}); };

window.sendChat = function() {
    const input = document.getElementById('chat-input');
    const chat = document.getElementById('aim-chat');
    if(input && input.value.trim() !== '') {
        const msg = input.value;
        input.value = '';
        chat.innerHTML += `<div style="margin-bottom: 10px;"><b>You:</b> ${msg}</div>`;
        chat.scrollTop = chat.scrollHeight;
        
        // Show typing indicator
        const typingId = "typing-" + Date.now();
        chat.innerHTML += `<div id="${typingId}" style="margin-bottom: 10px; color: gray; font-style: italic;">xX_Dark_Xx is typing...</div>`;
        chat.scrollTop = chat.scrollHeight;

        // Bot reply
        setTimeout(() => {
            const typingEl = document.getElementById(typingId);
            if(typingEl) typingEl.remove();
            
            const replies = [
                "I know where you live.",
                "Turn around.",
                "Did you lock your door?",
                "I can see you through the screen.",
                "Don't look behind you.",
                "They are coming.",
                "[sending picture...]",
                "I hear breathing.",
                "You shouldn't have done that.",
                "Are you alone?",
                "The lights are flickering.",
                "Can you hear it?",
                "Stop typing.",
                "Run.",
                "It's too late.",
                "You're not real.",
                "Wake up."
            ];
            const reply = replies[Math.floor(Math.random() * replies.length)];
            
            if (reply === "[sending picture...]") {
                chat.innerHTML += `<div style="margin-bottom: 10px; color: darkred;"><b>xX_Dark_Xx:</b> <br><img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Yyd21iZHNhbzNoZ25kY3k1dnBmbWJwMndndHJlOTdseWRtdnByayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT9IgvEOwRzUcZDRiU/giphy.webp" width="150" style="border: 1px solid #000; margin-top:5px;"></div>`;
            } else {
                chat.innerHTML += `<div style="margin-bottom: 10px; color: darkred;"><b>xX_Dark_Xx:</b> ${reply}</div>`;
            }
            chat.scrollTop = chat.scrollHeight;
            if (mailSound) { mailSound.currentTime = 0; mailSound.play().catch(e=>{}); }
        }, 2000 + Math.random() * 2000);
    }
};
setInterval(()=>{if(!isBooting && !document.body.classList.contains('haunted-mode') && Math.random()<0.02) startMicJumpScare();}, 20000);



// Feature Additions
document.addEventListener('DOMContentLoaded', () => {
    // 34. Start Button sound
    const sb = document.getElementById('start-btn');
    if(sb) sb.addEventListener('mousedown', () => { if(typeof clickSound !== 'undefined') { clickSound.currentTime=0; clickSound.play().catch(()=>{}); } });

    // 44. Unclosable Ads evasion logic
    setInterval(() => {
        document.querySelectorAll('.app-window').forEach(w => {
            if (w.style.backgroundImage && w.style.backgroundImage.includes('url')) {
                const cb = w.querySelector('.btn-close');
                if(cb && !cb.hasEvasion) {
                    cb.hasEvasion = true;
                    cb.addEventListener('mouseover', function(e) {
                        this.style.transform = `translate(${Math.random()*20-10}px, ${Math.random()*20-10}px)`;
                    });
                }
            }
        });
    }, 2000);

    // 46. Start Menu Shuffle
    const sm = document.getElementById('start-menu');
    if(sm) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'style' && sm.style.display === 'block') {
                    let items = Array.from(sm.children).filter(c => c.tagName === 'DIV' && c.className.includes('start-item'));
                    items.sort(() => Math.random() - 0.5);
                    items.forEach(i => sm.appendChild(i));
                }
            });
        });
        observer.observe(sm, { attributes: true });
    }

    // 15. OEM Task Switcher (Space + Tab)
    let isTaskSwitcherOpen = false;
    let switcherApps = [];
    let switcherIndex = 0;
    let spaceHeld = false;

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && (!e.target || (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA'))) {
            spaceHeld = true;
        }
        if (spaceHeld && e.code === 'Tab') {
            e.preventDefault();
            const ts = document.getElementById('task-switcher');
            const iconsContainer = document.getElementById('ts-icons');
            const titleContainer = document.getElementById('ts-title');
            
            if(!isTaskSwitcherOpen) {
                switcherApps = Array.from(document.querySelectorAll('.app-window')).filter(w => w.style.display !== 'none');
                if(switcherApps.length === 0) return;
                
                if (iconsContainer) iconsContainer.innerHTML = '';
                switcherApps.forEach((w, i) => {
                    const iconUrl = (typeof appIcons !== 'undefined' && appIcons[w.id]) ? appIcons[w.id] : 'https://win98icons.alexmeub.com/icons/png/computer_explorer-4.png';
                    const d = document.createElement('div');
                    d.style = 'width: 32px; height: 32px; padding: 5px; border: 2px solid transparent; border-radius: 3px; display: flex; align-items: center; justify-content: center;';
                    d.innerHTML = `<img src="${iconUrl}" style="width: 32px; height: 32px; pointer-events: none;">`;
                    d.id = 'ts-icon-' + i;
                    if(iconsContainer) iconsContainer.appendChild(d);
                });
                switcherIndex = 0;
                isTaskSwitcherOpen = true;
                if(ts) ts.style.display = 'block';
            } else {
                switcherIndex = (switcherIndex + 1) % switcherApps.length;
            }
            
            for(let i=0; i<switcherApps.length; i++) {
                const el = document.getElementById('ts-icon-' + i);
                if(el) {
                    if(i === switcherIndex) {
                        el.style.border = '2px dotted blue';
                        el.style.background = 'rgba(0,0,255,0.1)';
                        if(titleContainer) titleContainer.innerText = switcherApps[i].querySelector('.title-bar-text') ? switcherApps[i].querySelector('.title-bar-text').innerText : 'Application';
                    } else {
                        el.style.border = '2px solid transparent';
                        el.style.background = 'transparent';
                    }
                }
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            spaceHeld = false;
            if (isTaskSwitcherOpen) {
                isTaskSwitcherOpen = false;
                const ts = document.getElementById('task-switcher');
                if(ts) ts.style.display = 'none';
                if(switcherApps.length > 0 && typeof bringToFront === 'function') {
                    bringToFront(switcherApps[switcherIndex]);
                }
            }
        }
    });

    // 3, 4. Idle logic (Ghost Cursor, Icon Drift)
    let idleTime = 0;
    const ghost = document.getElementById('ghost-cursor');
    let lastX = 0, lastY = 0;
    document.addEventListener('mousemove', (e) => {
        idleTime = 0;
        if (ghost) ghost.style.display = 'none';
        lastX = e.pageX; lastY = e.pageY;
    });
    setInterval(() => {
        idleTime++;
        if (idleTime > 30) { // 30 seconds
            if (ghost) {
                ghost.style.display = 'block';
                ghost.style.left = (lastX + 20) + 'px';
                ghost.style.top = (lastY + 20) + 'px';
            }
            // Icon Drift
            document.querySelectorAll('.desktop-icon').forEach(icon => {
                icon.style.transform = `translate(${Math.random()*10-5}px, ${Math.random()*10-5}px)`;
            });
        }
    }, 1000);

    // 49. Phantom Clicks
    setInterval(() => {
        if (Math.random() < 0.05) { // 5% every 10s
            const icons = document.querySelectorAll('.desktop-icon');
            if(icons.length > 0) {
                const r = icons[Math.floor(Math.random() * icons.length)];
                r.click();
            }
        }
    }, 10000);

    // 9. Fake Email logic
    setInterval(() => {
        const list = document.getElementById('email-list');
        if (list) {
            const msgs = [
                "<b>System:</b> Unusual activity detected.",
                "<b>Unknown:</b> I see you.",
                "<b>Admin:</b> Do not look behind you.",
                "<b>Mailer-Daemon:</b> Delivery failed: You are trapped."
            ];
            const msg = msgs[Math.floor(Math.random() * msgs.length)];
            list.innerHTML = `<div style="padding:5px; border-bottom:1px solid #ccc;">${msg}</div>` + list.innerHTML;
            if(mailSound) { mailSound.currentTime=0; mailSound.play().catch(()=>{}); }
        }
    }, 45000); // every 45s
});

// Overwrite closeApp for 50. Russian Roulette BSOD
const originalCloseApp = window.closeApp;
window.closeApp = function(appId) {
    if (Math.random() < 0.01) { // 1% chance
        if(typeof triggerBSOD === 'function') triggerBSOD('FATAL_EXCEPTION_0E');
        return;
    }
    if (originalCloseApp) originalCloseApp(appId);
};

// Overwrite triggerBSOD for 43. Restart logic
const originalBSOD = window.triggerBSOD;
window.triggerBSOD = function(code) {
    if (originalBSOD) originalBSOD(code);
    setTimeout(() => {
        document.body.innerHTML = '';
        window.location.reload();
    }, 5000);
};

// 16. active-pushed for taskbar
const originalBringToFront = window.bringToFront;
window.bringToFront = function(win) {
    if (originalBringToFront) originalBringToFront(win);
    document.querySelectorAll('.task').forEach(t => t.classList.remove('active-pushed'));
    const t = document.getElementById('task-' + win.id);
    if(t) t.classList.add('active-pushed');
};

// 10. DO NOT CLICK jump scare
window.openApp = (function(orig) {
    return function(appId) {
        if(appId === 'dontclick-window' || appId === 'dontclick') {
            let popCount = 0;
            let popInterval = setInterval(() => {
                const w = document.createElement('div');
                w.className = 'window';
                w.style = 'position:fixed; top:' + (Math.random()*80) + '%; left:' + (Math.random()*80) + '%; z-index:999999; background:#c0c0c0; border:2px outset #fff; padding:10px; width:200px; box-shadow:2px 2px 10px rgba(0,0,0,0.5); font-family:Tahoma,sans-serif; pointer-events:none;';
                w.innerHTML = '<div style="background:#000080;color:#fff;padding:2px 5px;font-weight:bold;margin:-10px -10px 10px -10px;display:flex;align-items:center;justify-content:space-between;"><span>Warning!</span><button style="width:16px;height:14px;border:1px outset #fff;background:#c0c0c0;font-size:10px;line-height:10px;display:flex;align-items:center;justify-content:center;color:#000;">X</button></div><div style="display:flex;align-items:center;gap:10px;"><img src="https://win98icons.alexmeub.com/icons/png/msg_error-0.png" width="32"><span>VIRUS DETECTED!</span></div><div style="text-align:center;margin-top:10px;"><button style="padding:2px 10px;">OK</button></div>';
                document.body.appendChild(w);
                popCount++;
                if(popCount > 50) clearInterval(popInterval);
            }, 50);
            setTimeout(() => { clearInterval(popInterval); if(typeof triggerBSOD==='function') triggerBSOD('FATAL_VIRUS_INFECTION'); }, 3000);
            return;
        }
        orig(appId);
    };
})(window.openApp);

// Update createIcons globally if it exists
if (typeof appIcons !== 'undefined') {
    appIcons['email-window'] = 'https://win98icons.alexmeub.com/icons/png/envelope_closed-0.png';
    appIcons['soundrec-window'] = 'https://win98icons.alexmeub.com/icons/png/loudspeaker_rays-0.png';
    appIcons['address-window'] = 'https://win98icons.alexmeub.com/icons/png/address_book_user.png';
}

const originalCreateIcons = window.createIcons;
window.createIcons = function() {
    if (originalCreateIcons) originalCreateIcons();
    if(typeof createIcon === 'function') {
        createIcon('https://win98icons.alexmeub.com/icons/png/envelope_closed-0.png', 'Outlook Express', () => openApp('email-window'));
        createIcon('https://win98icons.alexmeub.com/icons/png/loudspeaker_rays-0.png', 'Sound Recorder', () => openApp('soundrec-window'));
        createIcon('https://win98icons.alexmeub.com/icons/png/address_book_user.png', 'Address Book', () => openApp('address-window'));
    }
};

// 26. CMD Ping 666
const originalExecuteCmd = window.executeCmd;
window.executeCmd = function() {
    const input = document.getElementById('cmd-input');
    if (input && input.value.trim() === 'ping 666.666.666.666') {
        const hist = document.getElementById('cmd-history');
        if(hist) {
            hist.innerHTML += `<div>C:\\>ping 666.666.666.666</div>
            <div style="color:red;">Pinging 666.666.666.666 with 32 bytes of blood:</div>
            <div style="color:red;">Reply from Hell: bytes=32 time<1ms TTL=666</div>
            <div style="color:red;">Reply from Hell: THEY ARE WATCHING YOU</div>`;
            hist.scrollTop = hist.scrollHeight;
            input.value = '';
        }
        return;
    }
    if (originalExecuteCmd) originalExecuteCmd();
};

// 37. Dial-up Progression override
window.dialCall = function() {
    const number = document.getElementById('dial-number').value;
    if(number.trim() === '') {
        alert("Please enter a number to dial.");
        return;
    }
    if (dialSound) {
        dialSound.currentTime = 0;
        dialSound.play().catch(e => console.error("Audio play failed:", e));
    }
    document.body.classList.add('loading-cursor'); // 40
    let text = document.getElementById('dial-status-text');
    if (text) {
        text.innerText = "Dialing " + number + "...";
        setTimeout(() => text.innerText = "Handshaking...", 2000);
        setTimeout(() => text.innerText = "Authenticating...", 4000);
        setTimeout(() => text.innerText = "Allocating IP...", 6000);
    }
    setTimeout(() => {
        closeApp('dialup-dialog');
        document.getElementById('ie-frame').src = 'https://www.wikipedia.org/';
        document.body.classList.remove('loading-cursor'); // 40
    }, 7500);
}

// 2, 8 Haunted messenger random popups
setInterval(() => {
    if(Math.random() < 0.1 && document.body.classList.contains('haunted-mode')) {
        openApp('aim-window');
        const chat = document.getElementById('aim-chat');
        if (chat) {
            chat.innerHTML += `<div style="margin-bottom: 10px; color: darkred;"><b>xX_Dark_Xx:</b> Are you ignoring me?</div>`;
            chat.scrollTop = chat.scrollHeight;
            if(mailSound){ mailSound.currentTime=0; mailSound.play().catch(()=>{});}
        }
    }
}, 60000);



document.addEventListener('DOMContentLoaded', () => {

    // 7. File Deletion Panic
    const recycleBin = document.getElementById('recycle-bin');
    if (recycleBin) {
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            if(icon.id !== 'recycle-bin' && icon.id !== 'my-computer') {
                icon.setAttribute('draggable', 'true');
                icon.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', icon.id);
                });
            }
        });
        recycleBin.addEventListener('dragover', (e) => e.preventDefault());
        recycleBin.addEventListener('drop', (e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            const el = document.getElementById(id);
            if(el) {
                el.remove();
                let img = recycleBin.querySelector('img');
                if(img) {
                    img.src = 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Yyd21iZHNhbzNoZ25kY3k1dnBmbWJwMndndHJlOTdseWRtdnByayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT9IgvEOwRzUcZDRiU/giphy.webp';
                    if(mailSound) { mailSound.currentTime=0; mailSound.play().catch(()=>{}); }
                    setTimeout(() => {
                        img.src = 'https://win98icons.alexmeub.com/icons/png/recycle_bin_full-4.png';
                    }, 2000);
                }
            }
        });
    }

    // 19. Desktop Selection Rectangle
    const desktop = document.getElementById('desktop');
    if(desktop) {
        let isSelecting = false;
        let startX, startY;
        const selectionBox = document.createElement('div');
        selectionBox.className = 'drag-selection';
        desktop.addEventListener('mousedown', (e) => {
            if(e.target === desktop || e.target.id === 'desktop' || e.target.id === 'ghost-cursor') {
                isSelecting = true;
                startX = e.pageX; startY = e.pageY;
                selectionBox.style.left = startX + 'px';
                selectionBox.style.top = startY + 'px';
                selectionBox.style.width = '0px';
                selectionBox.style.height = '0px';
                document.body.appendChild(selectionBox);
            }
        });
        document.addEventListener('mousemove', (e) => {
            if(isSelecting) {
                const currentX = e.pageX; const currentY = e.pageY;
                selectionBox.style.left = Math.min(startX, currentX) + 'px';
                selectionBox.style.top = Math.min(startY, currentY) + 'px';
                selectionBox.style.width = Math.abs(currentX - startX) + 'px';
                selectionBox.style.height = Math.abs(currentY - startY) + 'px';
            }
        });
        document.addEventListener('mouseup', () => {
            if(isSelecting) {
                isSelecting = false;
                if(selectionBox.parentNode) selectionBox.parentNode.removeChild(selectionBox);
            }
        });
    }
});

// 8. Haunted Messenger "Seen" Feature
const origSendChat2 = window.sendChat;
window.sendChat = function() {
    const input = document.getElementById('chat-input');
    if(input && input.value.trim() !== '') {
        // Run the original which clears input and adds the "You:" message and original bot reply
        if (origSendChat2) origSendChat2();
        
        // Add "Seen" immediately (give it 50ms so it appends after the original message)
        setTimeout(() => {
            const chat = document.getElementById('aim-chat');
            if(chat) {
                chat.innerHTML += `<div style="font-size:10px; color:gray; text-align:right; margin-bottom:5px; font-weight:bold;">Seen ${new Date().toLocaleTimeString()}</div>`;
                chat.scrollTop = chat.scrollHeight;
                setTimeout(() => {
                    
                    const spookyReplies = [
                        "I can see you.",
                        "Don't look behind you.",
                        "They are inside your walls.",
                        "Your webcam light is on for a reason.",
                        "The door is unlocked."
                    ];
                    const reply = spookyReplies[Math.floor(Math.random() * spookyReplies.length)];
                    chat.innerHTML += `<div style="margin-bottom: 10px; color: darkred;"><b>xX_Dark_Xx:</b> ${reply}</div>`;

                    chat.scrollTop = chat.scrollHeight;
                    if(mailSound) { mailSound.currentTime=0; mailSound.play().catch(()=>{}); }
                }, 1000);
            }
        }, 50);
    }
};

// 35. Error Message Trails
let lastCloneTime = 0;
document.addEventListener('mousemove', (e) => {
    // If we are currently dragging a window (handled internally by script.js with mousedown on titlebar)
    // We check if there's an active drag. The standard script doesn't expose 'isDragging', 
    // but we can check if the active element or if a window is following the mouse.
    // Instead of messing with drag internals, we can just check if left click is held and target is title-bar of error window
    if(e.buttons === 1 && e.target.classList && e.target.classList.contains('title-bar')) {
        const win = e.target.closest('.window');
        // If it's an error window (ad or dialog)
        if(win && (win.id.includes('ad-') || win.id === 'critical-error')) {
            const now = Date.now();
            if(now - lastCloneTime > 50) { // every 50ms clone
                lastCloneTime = now;
                const clone = win.cloneNode(true);
                clone.style.zIndex = parseInt(win.style.zIndex || 100) - 1;
                clone.id = ''; // remove ID
                clone.style.pointerEvents = 'none'; // so they don't block clicks
                document.body.appendChild(clone);
            }
        }
    }
});

