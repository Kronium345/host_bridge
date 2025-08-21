// TOAST.JS
//
const FADE_DUR = 250;
const DISPLAY_DUR = 3000;
let toastContain;

function toast(message, extraClasses) {
    // 1. create global container for toast messages with class .toastContain
    if (!toastContain) {
        toastContain = document.createElement("div");
        toastContain.classList.add("toastContain");
        document.body.appendChild(toastContain);
    }

    // 2. append toast with classes .toast + extraClasses
    const EL = document.createElement("div");
    EL.classList.add("toast", extraClasses);
    EL.innerText = message;
    toastContain.prepend(EL);

    // 3. transition the toast message (use rAF for immediate next frame)
    if (window.requestAnimationFrame) {
        window.requestAnimationFrame(() => EL.classList.add("open"));
    } else {
        setTimeout(() => EL.classList.add("open"), 0);
    }
    setTimeout(() => EL.classList.remove("open"), DISPLAY_DUR);
    setTimeout(() => toastContain.removeChild(EL), DISPLAY_DUR + FADE_DUR);
}