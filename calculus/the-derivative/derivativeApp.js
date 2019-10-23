import { html } from 'https://unpkg.com/lit-html/lit-html.js';
import { component, useState } from 'https://unpkg.com/haunted/haunted.js';

import { Graph } from './Graph.js';
import { Slider } from './Slider.js';

customElements.define('derivative-slider', Slider);

const App = component(
  () => {
    const [position, setPosition] = useState(1);
    const [min, max] = [-3, 3];
    const delta = 1;

    const viewport = {
      x1: -15,
      x2: 15,
      y1: -3,
      y2: 16
    };

    return html`
      <div class="App">
        <div class="App__section">
          <derivative-slider
            .label=${
              html`
                <div style="color: black;">
                  x = ${Math.round(position * 10) / 10}
                </div>
                <div style="color: red;"}>dx = very small</div>
              `
            }
            .position=${position}
            .setPosition=${pos => { setPosition(Math.round(pos * 10) / 10) }}
            .delta=${delta}
            .min=${min}
            .max=${max}
            .step=${0.1}
            .minVisible=${viewport.x1}
            .maxVisible=${viewport.x2}
            .positionColor=${"black"}
            .deltaColor=${"red"}
          ></derivative-slider>
          <derivative-slider
            .label=${
              html`
                <div style="color: black">
                  y = x<sup>2</sup> = ${Math.round(position ** 2 * 100) / 100}
                </div>
                <div>
                  <span style="color: blue">dy = </span>
                  <span style="color: black">${Math.round(2 * position * 10) / 10}</span><!--
               --><span style="color: red">dx</span>
                </div>
              `
            }
            .position=${position ** 2}
            .delta=${delta * (2 * position)}
            .min=${viewport.x1}
            .max=${viewport.x2}
            .positionColor=${"black"}
            .deltaColor=${"blue"}
          ></derivative-slider>
        </div>
        <p class="App__aside">
          When x is increased by a very small amount (<b style="color: red;">dx</b>), the resulting change to y (<b style="color: blue;">dy</b>) is <b>${Math.round(2 * position * 10) / 10}</b> times as large.
        </p>
        <div class="App__section">
          ${Graph({
            func: x => x ** 2,
            derivative: x => 2 * x,
            position,
            delta,
            viewport,
            graphicsScale: 0.65
          })}
        </div>
        <p class="App__aside">
          This means that the slope of the tangent line (<b><span style="color: blue;">dy</span>/<span style="color: red;">dx</span></b>) is <b>${Math.round(2 * position * 10) / 10}</b>.
        </p>
      </div>
      <style>
        .App {
          display: grid;
          grid-template-columns: 3fr 1fr;
          grid-column-gap: 32px;

          max-width: 1200px;
          margin: 0 auto;
          padding: 50px;

          font-family: sans-serif;
        }

        .App__aside {
          margin: 0;
          font-style: italic;
          line-height: 1.5;
          color: #444;
        }
      </style>
    `;
  }
)

customElements.define('derivative-app', App);