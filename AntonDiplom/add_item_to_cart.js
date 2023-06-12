function initAddToCart() {
  document.querySelectorAll('.add-to-buy').forEach(node => {
    node.addEventListener('click', () => {
      const itemId = node.dataset.buyItemId,
            userCartJSON = localStorage.getItem('user-cart') || '[]'
  
      if(userCartJSON.includes(itemId)) {
        alert('Товар вже додано до кошику')
        return
      }
            
      if(userCartJSON === '[]') localStorage.setItem('user-cart', '[' + itemId + ']')
      else localStorage.setItem('user-cart', userCartJSON.replace(/]$/, ',' + itemId + ']'))
  
      alert('Товар додано до кошику')
    })
  })
}