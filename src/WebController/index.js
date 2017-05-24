'use strict'

const DiffRenderer = require('diff-renderer')

function WebController(options) {
  Object.assign(this, options)

  this.shadow = this.element.createShadowRoot()
  this.renderer = new DiffRenderer(this.shadow)
}

require('./family').extends(WebController.prototype)
require('./props').extends(WebController.prototype)
require('./redraw').extends(WebController.prototype)
require('./resources').extends(WebController.prototype)

DiffRenderer.start()

module.exports = WebController
