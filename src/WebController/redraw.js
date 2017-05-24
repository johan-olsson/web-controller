'use strict'

module.exports.extends = function(prototype) {

  const textarea = document.createElement('textarea')

  prototype.redraw = function () {

    let html = this.template.innerHTML
    let count = null
    let code = ''

    html.split('').forEach((char) => {
      switch (char) {
        case '{': count++; break
        case '}': count--; break
      }

      if (count !== null) code += char
      if (count === 0) {
        html = html.replace(code, () => {

          textarea.innerHTML = code
          code = textarea.value.substring(1, textarea.value.length - 1)

          const result = Function(`return ${code}`).call(this)

          switch (typeof result) {
            case 'object': return result.join('')
            case 'undefined': return code
            default: return result
          }
        })

        count = null
        code = ''
      }
    })

    if (this.style) html += this.style.outerHTML;
    this.renderer.update(html)

    return this
  }
}
