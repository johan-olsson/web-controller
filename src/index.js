'use strict'

const WebController = require('./WebController')

module.exports = class WebComponent {

  constructor(name, options = {}) {

    const root = document.currentScript.parentElement

    const ComponentElement = class ComponentElement extends HTMLElement {

      createdCallback() {

        this.component = new WebController(Object.assign(options, {
          element: this,
          root
        }))

        if (options.constructor) {
          options.constructor.call(this.component)
        }

        if (options.componentWillMount) {
          options.componentWillMount.call(this.component)
        }
      }

      attachedCallback() {

        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach(node => {
              if (node.attributes)
                Array.prototype.forEach.call(node.attributes, attribute => {
                  const match = attribute.name.match(/^on:(\w+)/)

                  if (match) node.addEventListener(match[1], (event) => {
                    Function(`return ${attribute.value}`)
                      .call(this.component)
                      .call(this.component, event)
                  })
                })
            })
          })
        })

        observer.observe(this.shadowRoot, {
          childList: true
        })

        this.component.redraw()

        if (options.componentDidMount) {
          options.componentDidMount.call(this.component)
        }
      }

      detachedCallback() {
        if (options.componentWillUnmount) {
          options.componentWillUnmount.call(this.component)
        }
      }

      attributeChangedCallback(name, from, to) {
        if (options.componentWillReceiveProps) {
          options.componentWillReceiveProps.call(this.component, name, from, to)
        }
      }
    }

    document.registerElement(name, ComponentElement)
  }
}
