
# web-component


## Getting started

```html
// welcome-message.html

<template>

  Hello <span>{this.props.name}!</span>

</template>
<script>

  new WebComponent('welcome-message', {

    componentDidMount() {
      this.setProps({
        name: 'John Doe'
      })
    }
  })

</script>
<style>

  span {
    font-weight: bold;
  }

</style>

```

```html
// index.html

<link rel="import" href="welcome-message.html">
<welcome-message></welcome-message>

```
