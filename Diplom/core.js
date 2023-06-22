function levenshteinDistance(a, b) {
  if(a.length === 0) return b.length
  if(b.length === 0) return a.length

  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null))

  for(let i = 0; i <= b.length; i++) matrix[0][i] = i
  for(let j = 0; j <= a.length; j++) matrix[j][0] = j

  for(let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + indicator,
      )
    }
  }

  return matrix[a.length][b.length]
}

function stringsMatching(str1, str2) {
  const arr1 = str1.split(' '),
        arr2 = str2.split(' ')

  let minDistance = Infinity

  arr1.forEach(word1 => {
    arr2.forEach(word2 => {
      const distance = levenshteinDistance(word1, word2)
      if(distance < minDistance) minDistance = distance
    })
  })

  return minDistance
}

async function categoriesToHTML() {
  const res = await fetch('get-categories')
  let html = ''

  if(res.status === 500) {
    console.log(await res.text())
    return '<p>Помилка зчитування категорій, спробуйте перезавантажити сторінку</p>'
    
  }
  
  return (await res.json()).map(itm => {
    return `<label><input type="checkbox" value="${itm}"> ${itm}</label>`
  }).join('')
}

document.addEventListener('DOMContentLoaded', () => {
  const accountId = localStorage.getItem('account-id')
  if(accountId !== "null") {

    document.querySelectorAll('a.account-link').forEach(a => {
      a.href += '?id=' + accountId
    })
  }
})