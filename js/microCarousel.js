function updateSlide() {
  const carousel = document.querySelector('.carousel');
  if (carousel) {
    const containerRect = carousel.parentElement.getBoundingClientRect();
    const containerMid = containerRect.left + containerRect.width / 2;
    const cards = document.querySelectorAll('.card');
    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardMid = cardRect.left + cardRect.width / 2;
      if (Math.abs(cardMid - containerMid) < cardRect.width / 2) {
        card.style.opacity = 1
        card.style.opacity = 1
        card.style.transform = 'scale(1.2)'
      } else {
        card.style.opacity = .5
        card.style.transform = 'scale(1)'
      }
    });
  }
  requestAnimationFrame(updateSlide)
}
updateSlide();
