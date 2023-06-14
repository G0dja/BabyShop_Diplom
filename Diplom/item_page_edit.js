const nodes = {
  title: document.querySelector('.page-section h1'),
  price: document.querySelector('.page-section .item-container .shopping-price .price-number'),
  description: document.querySelector('.texts-container .texts-description > div'),
  // characteristics: document.querySelector('.texts-container .texts-characteristics > div'),
  shipping: document.querySelector('.page-section .item-container .shipping-window .description'),
  guaranty: document.querySelector('.page-section .item-container .guaranty-window .description'),
}

const editBtn = document.getElementById('edit-item-page'),
      saveBtn = document.getElementById('save-item-page')

editBtn.addEventListener('click', () => {
  editBtn.style.display = 'none'  
  saveBtn.style.display = ''

  for(const nodeTitle in nodes) {
    const input = document.createElement('input')
    input.name = nodeTitle
    input.value = nodes[nodeTitle].innerHTML


    nodes[nodeTitle].style.display = 'none'
    nodes[nodeTitle].insertAdjacentElement('afterend', input)
  }
})

saveBtn.addEventListener('click', async () => {
  editBtn.style.display = ''  
  saveBtn.style.display = 'none'

  const itm_data = []

  itm_data.push(['id', itemId])

  for(const nodeTitle in nodes) {
    const node = nodes[nodeTitle]
    node.innerHTML = node.nextElementSibling.value
    node.nextElementSibling.remove()

    itm_data.push([nodeTitle, node.innerHTML])

    node.style.display = ''
  }

  const responce = await fetch('/set-item?' + itm_data.map(params => params.join('=')).join('&'))

  if(responce.status === 200) alert('Дані оновлено')
  else if(responce.status === 500) {
    alert('Сталася якась помилка спробуйте ще раз')
    console.log(await responce.text())
  }
})