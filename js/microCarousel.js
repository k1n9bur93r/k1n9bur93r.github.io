function updateSlide() {
  const carousel = document.querySelector('.carousel');
  if (carousel) {
    const containerRect = carousel.parentElement.getBoundingClientRect();
    const containerMid = containerRect.left + containerRect.width / 2;
    const cards = document.querySelectorAll('.card');
    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardMid = cardRect.left + cardRect.width / 2;
      const isCentered = Math.abs(cardMid - containerMid) < cardRect.width / 2;
      card.style.transform = isCentered ? 'scale(1.2)' : 'scale(1)';
      card.style.opacity = isCentered ? 1 : 0.5;
    });
  }
  requestAnimationFrame(updateSlide)
}
updateSlide();
