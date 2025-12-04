window.addEventListener("DOMContentLoaded", () => {
  const landing = document.querySelector(".landing");
  const parallax = document.querySelector(".parallax");
  const resetBtn = document.getElementById("reset");
  const menuBtn = document.getElementById("menu");
  const funFacts = document.querySelector(".fun-facts");
  const factText = document.getElementById("factText");
  const nextFact = document.getElementById("nextFact");
  const prevFact = document.getElementById("prevFact");

  // Menu Navigation
  let menuOpen = false;
  let menuPopup = null;

  menuBtn.addEventListener("click", (e) => {
    if (menuOpen && menuPopup) {
      // Animate menu up
      menuPopup.style.animation = "menuSlideUp 0.3s ease-out forwards";
      setTimeout(() => {
        menuPopup.remove();
        menuPopup = null;
        menuOpen = false;
      }, 300);
    } else {
      menuPopup = document.createElement("div");
      menuPopup.style.cssText = `
        position: fixed;
        top: 70px;
        left: 50px;
        opacity: 
        background-image: url('Pictures/papertexture.png');
        border: 2px dashed #000000ff;
        border-radius: 15px;
        padding: 20px;
        z-index: 10000;
   
        animation: menuDropDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        transform-origin: top center;
      `;

      // menu keyframe animations
      if (!document.getElementById('menu-animations')) {
        const style = document.createElement('style');
        style.id = 'menu-animations';
        style.textContent = `
          @keyframes menuDropDown {
            0% {
              transform: translateY(-20px) scaleY(0);
              opacity: 0;
            }
            50% {
              transform: translateY(5px) scaleY(1.05);
              opacity: 1;
            }
            75% {
              transform: translateY(-2px) scaleY(0.98);
            }
            100% {
              transform: translateY(0) scaleY(1);
              opacity: 1;
            }
          }
          @keyframes menuSlideUp {
            0% {
              transform: translateY(0) scaleY(1);
              opacity: 1;
            }
            100% {
              transform: translateY(-20px) scaleY(0);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }

      menuPopup.innerHTML = `
        <div style="font-family: 'MyFont2', sans-serif; font-size: 1.2rem;">
          <div class="menu-item" data-section="landing" style="padding: 10px; cursor: pointer; transition: background 0.2s;">
             Landing
          </div>
          <div class="menu-item" data-section="parallax" style="padding: 10px; cursor: pointer; transition: background 0.2s;">
             Trash Pile
          </div>
          <div class="menu-item" data-section="funfacts" style="padding: 10px; cursor: pointer; transition: background 0.2s;">
             Fun Facts
          </div>
        </div>
      `;

      document.body.appendChild(menuPopup);
      menuOpen = true;

      // hover effects
      menuPopup.querySelectorAll(".menu-item").forEach(item => {
        item.addEventListener("mouseenter", () => {
          item.style.filter = "brightness(1.05)";

        });
        item.addEventListener("mouseleave", () => {
          item.style.background = "transparent";
        });

        // click navigation
        item.addEventListener("click", () => {
          const section = item.dataset.section;

          if (section === "landing") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else if (section === "parallax") {
            window.scrollTo({ top: parallax.offsetTop, behavior: "smooth" });
          } else if (section === "funfacts") {
            window.scrollTo({ top: funFacts.offsetTop, behavior: "smooth" });
          }

          // Close menu after
          setTimeout(() => {
            menuPopup.style.animation = "menuSlideUp 0.3s ease-out forwards";
            setTimeout(() => {
              menuPopup.remove();
              menuPopup = null;
              menuOpen = false;
            }, 300);
          }, 100);
        });
      });
    }

    e.stopPropagation();
  });

  // Close menu clicking out
  document.addEventListener("click", (e) => {
    if (menuOpen && menuPopup && !menuPopup.contains(e.target) && e.target !== menuBtn) {
      menuPopup.style.animation = "menuSlideUp 0.3s ease-out forwards";
      setTimeout(() => {
        if (menuPopup) {
          menuPopup.remove();
          menuPopup = null;
          menuOpen = false;
        }
      }, 300);
    }
  });

  // Background fade , text color fade (Black and white)
  window.addEventListener("scroll", () => {
    const ratio = Math.min(window.scrollY / (landing.offsetHeight * 0.5), 1);
    const gray = Math.round(255 * (1 - ratio));
    document.body.style.background = `rgb(${gray}, ${gray}, ${gray})`;
    parallax.style.background = `rgb(${gray}, ${gray}, ${gray})`;

    // Fade landing text to white (black and white)
    const textColor = Math.round(255 * ratio);
    const landingH1 = landing.querySelector("h1");
    const landingP = landing.querySelector("p");
    if (landingH1) landingH1.style.color = `rgb(${textColor}, ${textColor}, ${textColor})`;
    if (landingP) landingP.style.color = `rgb(${textColor}, ${textColor}, ${textColor})`;

    // Fade trash pile heading from black to white
    const trashPileHeading = parallax.querySelector(".info-text");
    if (trashPileHeading) {
      trashPileHeading.style.color = `rgb(${textColor}, ${textColor}, ${textColor})`;
    }
  });

  // Landing Stickers 
  const landingImages = [
    '003 - Labelled_novumomnis.png', '004 - Labelled_novumomnis.png', '005 - Labelled_novumomnis.png',
    '006 - Labelled_novumomnis.png', '007 - Labelled_novumomnis.png', '008 - Labelled_novumomnis.png',
    '009 - Labelled_novumomnis.png', '010 - Labelled_novumomnis.png', '011 - Labelled_novumomnis.png',
    '012 - Labelled_novumomnis.png', '013 - Labelled_novumomnis.png', '014 - Labelled_novumomnis.png',
    '015 - Labelled_novumomnis.png'
  ];

  function createLandingSticker(img) {
    const sticker = document.createElement("div");
    sticker.classList.add("shape");
    sticker.style.backgroundImage = `url('Pictures/${img}')`;

    const size = 150 + Math.random() * 150;
    sticker.style.width = size + "px";
    sticker.style.height = size + "px";

    const margin = 50;
    const x = margin + Math.random() * (window.innerWidth - size - margin * 2);
    const y = margin + Math.random() * (landing.offsetHeight - size - margin * 2);
    sticker.style.left = x + "px";
    sticker.style.top = y + "px";

    sticker.style.transform = `rotate(${Math.random() * 360}deg)`;
    landing.appendChild(sticker);
  }

  function startLandingStickers() {
    landing.querySelectorAll(".shape").forEach(s => s.remove());
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const img = landingImages[Math.floor(Math.random() * landingImages.length)];
        createLandingSticker(img);
      }, i * 1200);
    }
  }

  // parallax Objects
  const parallaxImages = [
    "Pictures/39.png", "Pictures/52.png", "Pictures/64.png", "Pictures/75.png",
    "Pictures/88.png", "Pictures/92.png", "Pictures/95.png", "Pictures/bottle.png",
    "Pictures/chopsticks.png", "Pictures/coffee cup.png", "Pictures/cup.png",
    "Pictures/food.png", "Pictures/paper.png"
  ];

  // Object information 
  const objectInfo = {
    "bottle.png": {
      name: "Plastic Bottle",
      recycling: "Recyclable - Remove cap and rinse before recycling",
      disposal: "Place in blue recycling bin. Can be recycled into new bottles, clothing, or carpeting."
    },
    "chopsticks.png": {
      name: "Chopsticks",
      recycling: "Compostable if wooden, trash if plastic",
      disposal: "Wooden chopsticks go in compost bin. Plastic chopsticks go in trash bin."
    },
    "coffee cup.png": {
      name: "Coffee Cup",
      recycling: "Not recyclable due to plastic lining",
      disposal: "Place in trash bin. Consider using reusable cups instead."
    },
    "cup.png": {
      name: "Disposable Cup",
      recycling: "Check local guidelines - many have plastic linings",
      disposal: "Most go in trash. Remove lid and recycle separately if plastic."
    },
    "food.png": {
      name: "Food Waste",
      recycling: "Compostable organic material",
      disposal: "Place in green compost bin or home compost. Breaks down into nutrient-rich soil."
    },
    "paper.png": {
      name: "Paper",
      recycling: "Recyclable if clean and dry",
      disposal: "Place in blue recycling bin. Can be recycled 5-7 times before fibers break down."
    },
    "39.png": {
      name: "Waste Item",
      recycling: "Check material type for recycling options",
      disposal: "Sort by material type and place in appropriate bin."
    },
    "52.png": {
      name: "Waste Item",
      recycling: "Check material type for recycling options",
      disposal: "Sort by material type and place in appropriate bin."
    },
    "64.png": {
      name: "Waste Item",
      recycling: "Check material type for recycling options",
      disposal: "Sort by material type and place in appropriate bin."
    },
    "75.png": {
      name: "Waste Item",
      recycling: "Check material type for recycling options",
      disposal: "Sort by material type and place in appropriate bin."
    },
    "88.png": {
      name: "Waste Item",
      recycling: "Check material type for recycling options",
      disposal: "Sort by material type and place in appropriate bin."
    },
    "92.png": {
      name: "Waste Item",
      recycling: "Check material type for recycling options",
      disposal: "Sort by material type and place in appropriate bin."
    },
    "95.png": {
      name: "Plastic Item",
      recycling: "Check material type for recycling options",
      disposal: "Sort by material type and place in appropriate bin."
    }
  };

  //Parallax objects amount
  const parallaxObjects = [];
  const parallaxCount = 60;

  // Draggable popup?
  function makeDraggable(popup) {
    let isDragging = false;
    let currentX, currentY, initialX, initialY;

    const header = popup.querySelector(".popup-title").parentElement;

    header.style.cursor = "move";

    header.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("close-btn")) return;
      isDragging = true;
      initialX = e.clientX - popup.offsetLeft;
      initialY = e.clientY - popup.offsetTop;
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        popup.style.left = currentX + "px";
        popup.style.top = currentY + "px";
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  function createParallaxObject(img) {
    const obj = document.createElement("div");
    obj.classList.add("object");
    obj.style.backgroundImage = `url('${img}')`;
    obj.dataset.imageName = img.split('/').pop();

    const isBack = Math.random() < 0.4;
    obj.classList.toggle("back", isBack);

    const size = isBack ? 300 + Math.random() * 150 : 500 + Math.random() * 300;
    obj.style.width = size + "px";
    obj.style.height = size + "px";

    obj.dataset.baseX = Math.random() * (window.innerWidth - size);

    const startMargin = 50;
    const funFactsTop = funFacts.offsetTop;
    const maxY = funFactsTop - size - 50;
    obj.dataset.baseY = startMargin + Math.random() * (maxY - startMargin);

    obj.dataset.speed = isBack ? 0.03 + Math.random() * 0.02 : 0.08 + Math.random() * 0.05;
    obj.style.left = obj.dataset.baseX + "px";
    obj.style.top = obj.dataset.baseY + "px";

    obj.dataset.rotation = Math.random() * 360;
    obj.style.transform = `rotate(${obj.dataset.rotation}deg)`;

    // hover
    obj.addEventListener("mouseenter", () => {
      obj.style.transform += " scale(1.05)";
      obj.style.filter = "brightness(1.05)";
    });
    obj.addEventListener("mouseleave", () => {
      const y = parseFloat(obj.dataset.baseY) + window.scrollY * obj.dataset.speed;
      obj.style.transform = `translate(${obj.dataset.baseX}px, ${y}px) rotate(${obj.dataset.rotation}deg)`;
      obj.style.filter = "brightness(1)";
    });

    // popup
    obj.addEventListener("dblclick", (e) => {
      const imageName = obj.dataset.imageName;
      const info = objectInfo[imageName] || {
        name: "Unknown Item",
        recycling: "Check local guidelines",
        disposal: "Contact your local waste management"
      };

      const popup = document.createElement("div");
      popup.classList.add("popup");
      popup.innerHTML = `
        <button class="close-btn">×</button>
        <div class="popup-header">
          <img src="${obj.style.backgroundImage.slice(5, -2)}" alt="${info.name}" class="popup-image">
          <div class="popup-header-text">
            <h2 class="popup-title">Recycle Tips</h2>
            <h3 class="popup-category">${info.name}</h3>
          </div>
        </div>
        <hr class="popup-divider">
        <div class="popup-content-horizontal">
          <div class="popup-section">
            <strong>Recycling Info:</strong>
            <p>${info.recycling}</p>
          </div>
          <div class="popup-section">
            <strong>How to Dispose:</strong>
            <p>${info.disposal}</p>
          </div>
        </div>
      `;

      // Popup Location 
      const popupWidth = 600;
      let popupX = e.pageX - popupWidth - 20;
      let popupY = e.pageY - 20;


      if (popupX < 0) {
        popupX = e.pageX + 20;
      }

      // If popup would go off right edge, position it at right edge
      if (popupX + popupWidth > window.innerWidth) {
        popupX = window.innerWidth - popupWidth - 20;
      }

      popup.style.left = popupX + "px";
      popup.style.top = popupY + "px";
      document.body.appendChild(popup);
      popup.style.display = "block";

      // Trigger animation
      setTimeout(() => {
        popup.classList.add("popup-appear");
      }, 10);

      // *Doesnt work (come back later)
      makeDraggable(popup);

      popup.querySelector(".close-btn").addEventListener("click", () => popup.remove());
    });

    parallax.appendChild(obj);
    parallaxObjects.push(obj);
  }

  for (let i = 0; i < parallaxCount; i++) {
    const img = parallaxImages[Math.floor(Math.random() * parallaxImages.length)];
    createParallaxObject(img);
  }

  // Throttle function for better performance
  function throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }

  const handleScroll = throttle(() => {
    const scroll = window.scrollY;
    const funFactsTop = funFacts.offsetTop;

    const fadeStart = funFactsTop - window.innerHeight * 1.2;
    const stopPoint = funFactsTop - window.innerHeight * 0.8;

    const fadeProgress = Math.min(Math.max((scroll - fadeStart) / (stopPoint - fadeStart), 0), 1);
    const effectiveScroll = Math.min(scroll, stopPoint);

    parallaxObjects.forEach(obj => {
      const y = parseFloat(obj.dataset.baseY) + effectiveScroll * obj.dataset.speed;
      obj.style.transform = `translate(${obj.dataset.baseX}px, ${y}px) rotate(${obj.dataset.rotation}deg)`;
      obj.style.opacity = 1 - fadeProgress;
    });
  }, 16);


  window.addEventListener("scroll", handleScroll);

  // Reset button
  resetBtn.addEventListener("click", startLandingStickers);

  // Landing Stickers on load
  startLandingStickers();

  // Fun facts column
  const facts = [
    {
      title: "Glass Bottle",
      text: "Recycling one glass bottle saves enough energy to light a 100-watt bulb for 4 hours"
    },
    {
      title: "Composting",
      text: "Composting reduces landfill waste and enriches soil"
    },
    {
      title: "Plastic",
      text: "Plastic can take up to 500 years to decompose – reduce and reuse"
    },
    {
      title: "E-Waste",
      text: "E-waste recycling saves rare metals like gold and palladium"
    },
    {
      title: "Aluminum Can",
      text: "Recycling one aluminum can saves enough energy to power a TV for 3 hours"
    },
    {
      title: "Paper",
      text: "Recycled paper can be reused 5-7 times before fibers break down"
    }
  ];


  const factsContainer = document.querySelector(".facts-container");
  if (factsContainer) {
    factsContainer.innerHTML = `
      <h2>*Fun Facts</h2>
      <hr>
      <div class="facts-grid"></div>
    `;

    const grid = factsContainer.querySelector(".facts-grid");

    facts.forEach(fact => {
      const factBox = document.createElement("div");
      factBox.className = "fact-box";
      factBox.innerHTML = `
        <h3>${fact.title}</h3>
        <p>${fact.text}</p>
      `;
      grid.appendChild(factBox);
    });

    factsContainer.classList.add("visible");
  }


  // Scroll to top
  document.getElementById("scrollTop").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Title text
  const infoText = document.createElement("div");
  infoText.classList.add("info-text");
  infoText.textContent = "*Trash Pile";
  parallax.appendChild(infoText);
});