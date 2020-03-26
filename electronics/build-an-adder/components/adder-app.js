import { html } from 'https://unpkg.com/lit-html/lit-html.js';
import { component, useState } from 'https://unpkg.com/haunted/haunted.js';

import './electronics-grid.js'

const App = component(
  () => {
    return html`<electronics-grid></electronics-grid>`
  }
)

customElements.define('adder-app', App);