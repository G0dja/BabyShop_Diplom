function Slider(parentNode) {
  this.nodes = {}
  this.slider = document.createElement('div')
  this.slider.classList.add('slider')

  this.slider.innerHTML = `
    <div class="slider__content">
      <div class="slider__sliding-node"></div>
    </div>
    <div class="slider__arrow slider__arrow--prev"><</div>
    <div class="slider__arrow slider__arrow--next">></div>
  `
  this.nodes.sliderContent = this.slider.querySelector('.slider__content')
  this.nodes.slidingNode = this.slider.querySelector('.slider__sliding-node')
  this.nodes.arrowPrev = this.slider.querySelector('.slider__arrow--prev')
  this.nodes.arrowNext = this.slider.querySelector('.slider__arrow--next')
  this.slideNum = 0
  this.itemsPerSlide = 5

  if(window.innerWidth <= 1000) this.itemsPerSlide = 3
  if(window.innerWidth <= 600) this.itemsPerSlide = 2

  this.slideStep = 100 / this.itemsPerSlide

  this.slide = direction => {
    if(direction === 1 && this.slideNum < this.nodes.sliderContent.childElementCount - this.itemsPerSlide - 1) this.slideNum++
    else if(direction === -1 && this.slideNum > 0) this.slideNum--

    this.nodes.slidingNode.style.marginLeft = this.slideStep * -this.slideNum  + '%'
  }

  this.nodes.arrowPrev.addEventListener('click', () => this.slide(-1))
  this.nodes.arrowNext.addEventListener('click', () => this.slide(1))

  this.addHTMLItem = htmlNode => {
    const itemWrapper = document.createElement('div')
    itemWrapper.classList.add('slider__item')

    itemWrapper.insertAdjacentElement('afterbegin', htmlNode)
    
    this.nodes.sliderContent.appendChild(itemWrapper)
  }
}