const slideshow = document.querySelector('.carousel');
let isScrolling = false;
let cards;
let initialLoad = true;
function updateSlide() {
if(initialLoad)
  {
  cards = document.querySelectorAll('.card');
  initialLoad = false;
  }
  const containerRect = slideshow.parentElement.getBoundingClientRect();
  const containerMid = containerRect.left + containerRect.width / 2;

  cards.forEach(card => {
    card.classList.remove('visible-1', 'visible-2', 'visible-3', 'visible-4', 'active');
    const cardRect = card.getBoundingClientRect();
    const cardMid = cardRect.left + cardRect.width / 2;

    if (Math.abs(cardMid - containerMid) < cardRect.width / 2) {
      card.classList.add('active');
    } else if (Math.abs(cardMid - containerMid) < cardRect.width / 1.5) {
      card.classList.add('visible-1');
    } else if (Math.abs(cardMid - containerMid) < cardRect.width / 0.75) {
      card.classList.add('visible-2');
    } else {
      card.classList.add('visible-3');
    }
  });
slideshow.addEventListener('scrollend', updateSlide);
}

slideshow.addEventListener('scroll', () => {
  isScrolling = true;
  setTimeout(() => {
    if (isScrolling) {
      isScrolling = false;
      updateSlide();
    }
  }, 100); 
});

setTimeout(updateSlide, 100);
