'use strict'

module.exports.extends = function(prototype) {

  prototype.setProps = function(props) {
    if (!this.element) return console.warn('Cannot set props before component is mounted.')
    Object.keys(props)
      .forEach(key => {
        if (props[key] !== this.element.getAttribute(key))
          this.element.setAttribute(key, props[key])
      })
  }

  Object.defineProperty(prototype, 'props', {
    get: function() {
      return Array.prototype.map.call(this.element.attributes, (attribute) => {
          return {
            [attribute.name]: attribute.value
          }
        })
        .reduce((object, attribute) => Object.assign(object, attribute), {})
    }
  })
}
