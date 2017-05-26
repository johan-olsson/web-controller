'use strict'

module.exports.extends = function(prototype) {

  let style

  Object.defineProperty(prototype, 'template', {
    get: function() {
      return Array.prototype.find.call(this.root.children, element => {
        return element instanceof HTMLTemplateElement
      })
    }
  })

  Object.defineProperty(prototype, 'style', {
    get: function() {
      if (!style)
        style = Array.prototype.find.call(this.root.children, element => {
          if (element instanceof HTMLStyleElement) {
            element.parentElement.removeChild(element)
            return element
          }
        })

      return style
    }
  })
}
