// public/animations.js
export function initBackgroundElements() {
  const backgroundContainer = document.querySelector(".background-elements-container");
  if (!backgroundContainer) return;

  const numberOfElements = 35;
  const colors = [
    "#84D2F6",
    "#91E5F6",
    "#FF6B6B",
    "#FFD166",
    "#06D6A0",
    "#ABDEE6",
    "#CBAACB",
    "#FFFFB5",
    "#FFCCB5",
  ];

  for (let i = 0; i < numberOfElements; i++) {
    const element = document.createElement("div");
    element.classList.add("element");

    const size = Math.random() * 60 + 20;
    const left = Math.random() * 100;
    const animDuration = Math.random() * 20 + 15;
    const animDelay = Math.random() * 15;

    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.left = `${left}vw`;
    element.style.animationDuration = `${animDuration}s`;
    element.style.animationDelay = `${animDelay}s`;
    element.style.transform = `rotate(${Math.random() * 360}deg)`;
    element.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    element.style.borderRadius = `${Math.random() * 50}%`;

    backgroundContainer.appendChild(element);
  }
}
