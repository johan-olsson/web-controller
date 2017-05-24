'use strict'

module.exports.extends = function(prototype) {

  Object.defineProperty(prototype, 'template', {
    get: function() {
      return Array.prototype.find.call(this.root.children, element => {
        return element instanceof HTMLTemplateElement
      })
    }
  })

  Object.defineProperty(prototype, 'style', {
    get: function() {
      return Array.prototype.find.call(this.root.children, element => {
        return element instanceof HTMLStyleElement
      })
    }
  })
}
