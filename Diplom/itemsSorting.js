// SORTING

function sortItemsScript() {
  const select = document.querySelector('#sorting-type-select'),
        sortDirNode = document.querySelector('.sorting-direktion'),
        cardsContainer = document.querySelector('#items-list'),
        cards = cardsContainer.querySelectorAll('.item-card');

  function sortCardsByPrice(order) {
    const sortedCards = [...cards].sort((a, b) => {
      const priceA = +a.querySelector('.price').textContent.trim().replace(/₴/g, ''),
            priceB = +b.querySelector('.price').textContent.trim().replace(/₴/g, '')
      return order === 'asc' ? priceA - priceB : priceB - priceA
    })
    cardsContainer.innerHTML = ''
    sortedCards.forEach((card) => cardsContainer.appendChild(card))
  }

  function starsToNumber(stars) {
    const maxStars = 5
    let rating = 0

    for (let i = 0; i < maxStars; i++) {
      if (stars[i] === "★") rating++
      else if (stars[i] === "☆") break
    }
    return rating
  }

  function sortCardsByRating(order) {
    const sortedCards = [...cards].sort((a, b) => {
      const ratingA = starsToNumber(a.querySelector('.raiting').textContent),
            ratingB = starsToNumber(b.querySelector('.raiting').textContent)
      return order === 'asc' ? ratingA - ratingB : ratingB - ratingA
    })
    cardsContainer.innerHTML = ''
    sortedCards.forEach((card) => cardsContainer.appendChild(card))
  }

  select.addEventListener('change', () => {
    const sortingType = select.value

    if (sortingType === 'price') {
      sortCardsByPrice('asc');
      sortDirNode.classList.add('sort-up')
      sortDirNode.classList.remove('sort-down')
    } 
    else if (sortingType === 'rating') {
      sortCardsByRating('desc')
      sortDirNode.classList.add('sort-down')
      sortDirNode.classList.remove('sort-up')
    } 
    else {
      cardsContainer.innerHTML = ''
      cards.forEach((card) => cardsContainer.appendChild(card))
      sortDirNode.classList.remove('sort-up')
      sortDirNode.classList.remove('sort-down')
    }
  })

  sortDirNode.addEventListener('click', () => {
    const sortingType = select.value

    if (sortingType === 'price') {
      if (sortDirNode.classList.contains('sort-up')) {
        sortCardsByPrice('desc');
        sortDirNode.classList.remove('sort-up')
        sortDirNode.classList.add('sort-down')
      } 
      else {
        sortCardsByPrice('asc');
        sortDirNode.classList.remove('sort-down')
        sortDirNode.classList.add('sort-up')
      }
    } 
    else if (sortingType === 'rating') {
      if (sortDirNode.classList.contains('sort-up')) {
        sortCardsByRating('desc')
        sortDirNode.classList.remove('sort-up')
        sortDirNode.classList.add('sort-down')
      } 
      else {
        sortCardsByRating('asc')
        sortDirNode.classList.remove('sort-down')
        sortDirNode.classList.add('sort-up')
      }
    }
  })
}