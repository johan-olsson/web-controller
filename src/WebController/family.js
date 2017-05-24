'use strict'

module.exports.extends = function(prototype) {

  Object.defineProperty(prototype, 'parentComponent', {
    get: function parentComponent(node = this.element) {
      if (!node) return null
      if (node.component && node.component !== this) {
        return node
      }

      return parentComponent(node.parentElement || node.parentNode || node.host)
    }
  })

  Object.defineProperty(prototype, 'childComponents', {
    get: function childComponents(node = [self.shadow]) {

      node = Array.prototype.slice.call(node, 0)
        .filter(node => node)

      return node.map.call(node, node => {
          if (node.children && node.children.length)
            return childComponents(node.children)

          return node
        })
        .reduce((array, node) => array.concat(node), [])
        .filter(node => node.component)
    }
  })

  Object.defineProperty(prototype, 'rootComponent', {
    get: function rootComponent(node = this.parentComponent) {
      if (!node) return null
      if (node.parentComponent) rootComponent(node.parentComponent)
      return node
    }
  })
}
