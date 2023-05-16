document.body.addEventListener('click', event => {
  if(event.target.classList.contains('add-to-buy')) {
    
    const itemId = event.target.dataset.buyItemId,
          userCartJSON = localStorage.getItem('user-cart') || '[]'

    if(userCartJSON.includes(itemId)) {
      alert('Товар вже додано до кошику')
      return
    }
          
    if(userCartJSON === '[]') localStorage.setItem('user-cart', '[' + itemId + ']')
    else localStorage.setItem('user-cart', userCartJSON.replace(/]$/, ',' + itemId + ']'))

    alert('Товар додано до кошику')
  }
})