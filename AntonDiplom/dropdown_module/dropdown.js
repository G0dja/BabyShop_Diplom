function setDropdownToggle(node) {
  node.addEventListener('click', () => {
    node.classList.toggle('dropdown-toggle--active')
  })
}

function setDropdownChecksListener(dropdownNode, callback) {
  const checkboxes = dropdownNode.querySelectorAll('input[type="checkbox"]'),
        checkedButtons = []

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        checkedButtons.push(this.value)
      } 
      else {
        const index = checkedButtons.indexOf(this.value)
        if (index > -1) {
          checkedButtons.splice(index, 1)
        }
      }
      callback(checkedButtons)
    })
  })
}

function setDropdown(dropdownNode, callback) {
  setDropdownToggle(dropdownNode.previousElementSibling)
  setDropdownChecksListener(dropdownNode, callback)
}