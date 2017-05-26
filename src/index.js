'use strict'

const Controller = require('./Controller')

window.WebController = class WebController {

  constructor(name, options = {}) {

    const script = document.currentScript
    const ComponentElement = class ComponentElement extends HTMLElement {

      createdCallback() {

        if (options.constructor) {
          options.constructor.call(this.component)
        }

        if (options.componentWillMount) {
          options.componentWillMount.call(this.component)
        }
      }

      attachedCallback() {

        let first = true

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

          if (options.componentDidMount && first) {
            options.componentDidMount.call(this.component)
            first = false
          }
        })

        this.component = new Controller(Object.assign(options, {
          element: this,
          root: script.parentElement
        }))

        observer.observe(this.shadowRoot, {
          childList: true
        })

        this.component.redraw()
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
