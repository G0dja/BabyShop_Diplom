function ratingToStars(ratingNum) {
  let str = ''

  for(let i = 0; i < 5; i++) {
    if(i < ratingNum) str += '★'
    else str += '☆'
  }

  return str
}