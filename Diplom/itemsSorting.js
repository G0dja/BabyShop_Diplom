const cardsContainer = document.querySelector('#items-list')

// SORTING

function sortItemsScript() {
  const select = document.querySelector('#sorting-type-select'),
        sortDirNode = document.querySelector('.sorting-direktion')

  function sortCardsByPrice(order) {
    function getPrice(node) {
      const textContentArr = node.querySelector('.price').textContent.trim().match(/[0-9.]+/g, '')
      if(textContentArr.length === 1) return textContentArr[0]
      else return textContentArr[1]
    }

    const cards = cardsContainer.children,
          sortedCards = [...cards].sort((a, b) => {

            const priceA = getPrice(a),
                  priceB = getPrice(b)
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
    const cards = cardsContainer.children,
          sortedCards = [...cards].sort((a, b) => {
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