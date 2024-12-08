const glassStack = document.querySelector('.glassStack');

const scrollableElement = glassStack;

function createGlassStack() {
  let opacityCounter = 1.0;
  const countLength = glassStack.children.length >= 3 ? 3 : glassStack.children.length;
  for (let i = 0; i < countLength; i++) {
    if (i === 0) {
      glassStack.children[i].style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    }
    glassStack.children[i].classList.add('glassStackItemDisplay');
    glassStack.children[i].style.marginTop = `${i * 10}px`;
    glassStack.children[i].style.opacity = `${opacityCounter}`;
    glassStack.children[i].style.zIndex = glassStack.children.length - i;
    opacityCounter -= 0.3;
  }
}

function ExpandStack() {
  let summationHeight = 0;
  glassStack.classList.add('hovered');
  for (let i = 0; i < glassStack.children.length; i++) {
    glassStack.children[i].classList.add('glassStackItemDisplay');
    glassStack.children[i].children[0].classList.add('hovered');
    glassStack.children[i].style.backgroundColor = '';
    glassStack.children[i].style.opacity = 1;

    if (i !== 0) {
      summationHeight += glassStack.children[i - 1].clientHeight + 10;
      glassStack.children[i].style.marginTop = `${summationHeight}px`;
    }
  }
  applyGrowingEffect(true);
}

function ShrinkStack() {
  glassStack.classList.remove('hovered');
  for (let i = 0; i < glassStack.children.length; i++) {
    glassStack.children[i].classList.remove('glassStackItemDisplay');
    glassStack.children[i].classList.remove('grow', 'visible-1', 'visible-2', 'visible-3', 'visible-4');
    glassStack.children[i].children[0].classList.remove('hovered');
  }
  createGlassStack();
}


let glassStackexpanded = false;
let savedScrollPosPast = 0;
function ToggleGlassStackExpand() {
  const toBeCollapsed = document.querySelectorAll('.Collapseable:not(.glassStack, .pastBlogsHeader)');
  if (!glassStackexpanded) {
    savedScrollPosPast = window.scrollY;
    for (let i = 0; i < toBeCollapsed.length; i++) {
      toBeCollapsed[i].classList.add('Collapsed');
    }
    ExpandStack();
    window.scrollTo({ top: -10, left: 0, behavior: 'instant' });
    glassStackexpanded = !glassStackexpanded;
  } else {
    ShrinkStack();
    for (let i = 0; i < toBeCollapsed.length; i++) {
      toBeCollapsed[i].classList.remove('Collapsed');
    }
    window.scrollTo({ top: savedScrollPosPast, left: 0, behavior: 'instant' });
    glassStackexpanded = !glassStackexpanded;
  }
}

function getMiddleElement() {
  const scrollRect = glassStack.getBoundingClientRect();
  const middleY = scrollRect.top + scrollRect.height / 3.5;

  let closestElement = null;
  let closestDistance = Infinity;

  for (let i = 0; i < glassStack.children.length; i++) {
    const itemRect = glassStack.children[i].getBoundingClientRect();
    const itemMiddleY = itemRect.top + itemRect.height / 2;
    const distance = Math.abs(itemMiddleY - middleY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestElement = glassStack.children[i];
    }
  }
  return closestElement;
}

function applyGrowingEffect(listExpanded = false) {
  for (let i = 0; i < glassStack.children.length; i++) {
    glassStack.children[i].classList.remove('grow');
    glassStack.children[i].classList.add('visible-4');
    glassStack.children[i].classList.remove('visible-1');
    glassStack.children[i].classList.remove('visible-2');
    glassStack.children[i].classList.remove('visible-3');
  }
  const middleElement = listExpanded ? glassStack.children[0] : getMiddleElement();
  if (middleElement) {
    middleElement.classList.add('grow'); // Apply grow effect to the middle element

    // Get the index of the middle element
    const middleIndex = Array.from(glassStack.children).indexOf(middleElement);
    glassStack.children[middleIndex].classList.remove('visible-4');
    // Apply opacity levels to the items above and below the middle element
    if (middleIndex > 0) {
      glassStack.children[middleIndex - 1].classList.remove('visible-4');
      glassStack.children[middleIndex - 1].classList.add('visible-3');
    }

    if (middleIndex < glassStack.children.length - 1) {
      glassStack.children[middleIndex + 1].classList.remove('visible-4');
      glassStack.children[middleIndex + 1].classList.add('visible-1');
    }
    if (middleIndex < glassStack.children.length - 2) {
      glassStack.children[middleIndex + 2].classList.remove('visible-4');
      glassStack.children[middleIndex + 2].classList.add('visible-3');
    }
  }
}

export function init() {
  document.querySelector('.glassStack').addEventListener('click', ToggleGlassStackExpand);
  glassStack.addEventListener('scroll', () => {
    if (glassStack.classList.contains('hovered')) {
      applyGrowingEffect();
    }
  });
  setTimeout(createGlassStack, 500);
}
