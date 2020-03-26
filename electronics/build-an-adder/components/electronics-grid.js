import { html, svg } from 'https://unpkg.com/lit-html/lit-html.js'
import { repeat } from 'https://unpkg.com/lit-html/directives/repeat.js'
import { component, useState, useEffect, useReducer } from 'https://unpkg.com/haunted/haunted.js'

const levels = [
  {
    name: 'NOT',
    state: {
      gates: [
        { type: 'NAND', x: 22, y: 12 }
      ],
      connections: [],
      sysinValues: [false],
      sysoutValues: [false]
    },
    tests: [
      {
        sysinValues: [false],
        sysoutValues: [true]
      },
      {
        sysinValues: [true],
        sysoutValues: [false]
      }
    ]
  },
  {
    name: 'AND',
    state: {
      gates: [
        { type: 'NAND', x: 22, y: 8 },
        { type: 'NOT', x: 22, y: 12 }
      ],
      connections: [],
      sysinValues: [false, false],
      sysoutValues: [false]
    },
    tests: [
      {
        sysinValues: [false, false],
        sysoutValues: [false]
      },
      {
        sysinValues: [true, false],
        sysoutValues: [false]
      },
      {
        sysinValues: [false, true],
        sysoutValues: [false]
      },
      {
        sysinValues: [true, true],
        sysoutValues: [true]
      }
    ]
  },
  {
    name: 'Half adder',
    state: {
      gates: [
        { type: 'XOR', x: 22, y: 8 },
        { type: 'AND', x: 22, y: 12 }
      ],
      connections: [],
      sysinValues: [false, false],
      sysoutValues: [false, false]
    },
    tests: [
      {
        sysinValues: [false, false],
        sysoutValues: [false, false]
      },
      {
        sysinValues: [true, false],
        sysoutValues: [true, false]
      },
      {
        sysinValues: [false, true],
        sysoutValues: [true, false]
      },
      {
        sysinValues: [true, true],
        sysoutValues: [false, true]
      }
    ]
  },
  {
    name: 'Full adder',
    state: {
      gates: [
        { type: 'XOR', x: 18, y: 5 },
        { type: 'XOR', x: 25, y: 5 },
        { type: 'AND', x: 18, y: 11 },
        { type: 'AND', x: 25, y: 11 },
        { type: 'OR', x: 18, y: 17 }
      ],
      connections: [
        // { from: { gate: 0, output: 0 }, to: { sysout: 1 }, on: true }
      ],
      sysinValues: [false, false, false],
      sysoutValues: [false, false]
    }
  }
]

const objectMatches = (object, query) => {
  const queryEntires = Object.entries(query)
  
  for (let i = 0; i < queryEntires.length; i++) {
    const [key, value] = queryEntires[i]

    if (!object.hasOwnProperty(key)) return false
    switch (typeof value) {
      case 'object':
        if (!objectMatches(object[key], value)) return false
        break
      default:
        if (object[key] !== value) return false
    }
  }

  return true
}

function reducer(state, action) {
  switch (action.type) {
    case 'updateGate':
      return {
        ...state,
        gates: [
          ...state.gates.slice(0, action.index),
          {
            ...state.gates[action.index],
            ...action.gate
          },
          ...state.gates.slice(action.index + 1)
        ]
      }
    case 'addConnection':
      return {
        ...state,
        connections: [...state.connections, action.connection]
      }
    case 'deleteConnection':
      return {
        ...state,
        connections: [
          ...state.connections.slice(0, action.index),
          ...state.connections.slice(action.index + 1)
        ]
      }
    case 'setSysinValue':
      return {
        ...state,
        sysinValues: [
          ...state.sysinValues.slice(0, action.index),
          action.value,
          ...state.sysinValues.slice(action.index + 1)
        ]
      }
    case 'stepSimulation':
      const computeGateValue = gateIndex => {
        const { type } = state.gates[gateIndex]

        let inputs = new Array(2).fill(false)
        state.connections
          .filter(connection => objectMatches(connection, { to: { gate: gateIndex } }))
          .forEach(({ to, on }) => {
            inputs[to.input] = on
          })

        switch (type) {
          case 'NAND':
            return inputs.includes(false)
          case 'NOT':
            return !inputs[0]
          case 'AND':
            return !inputs.includes(false)
          case 'OR':
            return inputs.includes(true)
          case 'XOR':
            return inputs.reduce((a, b) => a + b, 0) === 1
        }
      }

      let anythingChanged = false

      // Update connections based on inputs
      let newConnections = [...state.connections]

      state.sysinValues.forEach((value, sysinIndex) => {
        newConnections = newConnections.map(connection => {
          if (objectMatches(connection, { from: { sysin: sysinIndex } })) {
            if (value !== connection.on) {
              anythingChanged = true
            }
            return { ...connection, on: value }
          }
          return connection
        })
      })
      state.gates.forEach((gate, gateIndex) => {
        const value = computeGateValue(gateIndex)
        newConnections = newConnections.map(connection => {
          if (objectMatches(connection, { from: { gate: gateIndex } })) {
            if (value !== connection.on) {
              anythingChanged = true
            }
            return { ...connection, on: value }
          }
          return connection
        })
      })

      // Update sysout based on connections
      let newSysoutValues = []
      for (let i = 0; i < state.sysoutValues.length; i++) {
        const newValue = newConnections
          .filter(connection => objectMatches(connection, { to: { sysout: i } }))
          .some(({ on }) => on)
        
        if (newValue !== state.sysoutValues[i]) {
          anythingChanged = true
        }
        
        newSysoutValues[i] = newValue
      }

      // If nothing has changed, keep state objects
      // identical so simulation knows it can stop stepping
      if (!anythingChanged) return state

      return {
        ...state,
        connections: newConnections,
        sysoutValues: newSysoutValues
      }
    case 'reset':
      return action.state
    default:
      console.error(`Action type ${action.type} not found`)
  }
}

const testSolution = (level, state) => {
  const { tests } = level
  for (let testNumber = 0; testNumber < tests.length; testNumber++) {
    const test = tests[testNumber]

    let testState = { ...state, sysinValues: test.sysinValues }
    for (let i = 0; i < 100; i++) {
      testState = reducer(testState, { type: 'stepSimulation' })

      if (i >= 90) {
        for (let n = 0; n < testState.sysoutValues.length; n++) {
          if (testState.sysoutValues[n] !== test.sysoutValues[n]) {
            console.log('Test failed: For input', test.sysinValues, 'expected output', test.sysoutValues, 'but got', testState.sysoutValues)
            return false
          }
        }
      }
    }
  }

  return true
}

const ElectronicsGrid = component(
  self => {
    const [w, h] = [50, 26]

    const [level, setLevelNumber] = useState(0)

    const [state, dispatch] = useReducer(reducer, levels[level].state)
    const { gates, connections, sysinValues, sysoutValues } = state

    const [winAnimationText, setWinAnimationText] = useState(false)
    const [winAnimationKey, setWinAnimationKey] = useState(null)

    const setLevel = number => {
      setLevelNumber(number)
      dispatch({ type: 'reset', state: levels[number].state })
    }

    const nextLevel = () => {
      if (testSolution(levels[level], state)) {
        console.log('Good work!')
        setWinAnimationText(levels[level].name)
        setWinAnimationKey(Symbol(levels[level].name))
        setTimeout(() => {
          setLevel(level + 1)
        }, 2500)
      } else {
        console.log('You failed. :P')
      }
    }

    useEffect(() => {
      const stepSimulation = () => {
        dispatch({ type: 'stepSimulation' })
      }

      const stepDelay = setTimeout(stepSimulation, 100)

      return () => {
        clearTimeout(stepDelay)
      }
    }, [connections, sysinValues, sysoutValues])

    const connectionPointLocation = target => {
      if (target.hasOwnProperty('gate')) {
        const gate = gates[target.gate]
        if (target.hasOwnProperty('output')) {
          return {
            x: gate.x + 5,
            y: gate.y + 1
          }
        } else if (target.hasOwnProperty('input')) {
          return {
            x: gate.x,
            y: gate.y + 2 * target.input
          }
        }
      } else if (target.hasOwnProperty('sysin')) {
        return {
          x: 4,
          y: Math.round(h / 2) + 6 * (target.sysin - (sysinValues.length - 1) / 2)
        }
      } else if (target.hasOwnProperty('sysout')) {
        return {
          x: w - 4,
          y: Math.round(h / 2) + 6 * (target.sysout - (sysoutValues.length - 1) / 2)
        }
      }

      console.error('Failed to find grid location of', target)
    }

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [drag, setDrag] = useState(null)

    const svgElem = self.shadowRoot.querySelector('svg')
    const svgRect = svgElem ? svgElem.getBoundingClientRect() : { x: 0, y: 0, width: 0, height: 0 }
    const scaleX = svgRect.width / w
    const scaleY = svgRect.height / h

    const gateDragStart = gateIndex => e => {
      setDrag({
        targetType: 'gate',
        targetIndex: gateIndex,
        offset: {
          x: mousePos.x - gates[gateIndex].x * scaleX,
          y: mousePos.y - gates[gateIndex].y * scaleY
        }
      })
    }

    const connectionDragStart = (targetType, targetIndex) => e => {
      setDrag({
        targetType,
        targetIndex,
        endPos: mousePos
      })
    }

    const onMouseMove = e => {
      const pos = {
        x: e.clientX - svgRect.x,
        y: e.clientY - svgRect.y
      }

      setMousePos(pos)

      if (drag === null) return
      switch (drag.targetType) {
        case 'gate':
          const gateExactPx = {
            x: pos.x - drag.offset.x,
            y: pos.y - drag.offset.y
          }
          const clamp = (n, min, max) => Math.min(max, Math.max(min, n))
          dispatch({
            type: 'updateGate',
            index: drag.targetIndex,
            gate: {
              x: clamp(Math.round(gateExactPx.x / scaleX), 6, w - 11),
              y: clamp(Math.round(gateExactPx.y / scaleY), 3, h - 5)
            }
          })
          break
        case 'output':
        case 'sysin':
          setDrag({ ...drag, endPos: pos })
          break
      }
    }

    const onMouseUp = () => {
      if (drag === null) return

      setDrag(null)

      if (!['output', 'sysin'].includes(drag.targetType)) {
        // Not creating a connection
        return
      }

      let from = {}
      if (drag.targetType === 'output') {
        from = { gate: drag.targetIndex, output: 0 }
      } else if (drag.targetType === 'sysin') {
        from = { sysin: drag.targetIndex }
      }

      const dropCoords = {
        x: mousePos.x / scaleX,
        y: mousePos.y / scaleY
      }

      let dropOptions = [
        // Gate inputs:
        ...gates.flatMap((_, index) => [{ gate: index, input: 0 }, { gate: index, input: 1 }]),

        // System outputs:
        ...sysoutValues.map((_, index) => ({ sysout: index }))
      ]
      
      dropOptions = dropOptions.filter(option => (
        !connections.some(c => objectMatches(c, { to: option }))
      ))

      if (dropOptions.length === 0) return

      const optionDistance = option => {
        const { x, y } = connectionPointLocation(option)
        return Math.hypot(dropCoords.x - x, dropCoords.y - y)
      }

      dropOptions = dropOptions.sort((a, b) => optionDistance(a) - optionDistance(b))

      if (optionDistance(dropOptions[0]) < 3) {
        const connection = { from, to: dropOptions[0], on: false }
        dispatch({ type: 'addConnection', connection })
        return
      }
    }

    useEffect(() => {
      document.body.addEventListener('mouseup', onMouseUp)
      document.body.addEventListener('mousemove', onMouseMove)

      return () => {
        document.body.removeEventListener('mouseup', onMouseUp)
        document.body.removeEventListener('mousemove', onMouseMove)
      }
    })

    const connectionPath = (start, end) => {
      const horizDist = Math.max(Math.abs((end.x - start.x) / 2), 2)
      return `M ${start.x} ${start.y} `
        + `C ${start.x + horizDist} ${start.y}, `
        + `${end.x - horizDist} ${end.y}, `
        + `${end.x} ${end.y}`
    }

    return html`
      <svg class="electronics-grid" version="1.1" viewBox="0 0 ${w} ${h}">
        <g class="dots">
          ${new Array(w).fill().map((_, x) => (
            new Array(h).fill().map((_, y) => (
              svg`<circle fill="#ddd" r="0.1" cx=${x} cy=${y} />`
            ))
          ))}
        </g>

        ${connections.map(({ from, to, on }, index) => svg`
            <path
              class="connection"
              d=${connectionPath(connectionPointLocation(from), connectionPointLocation(to))}
              fill="none"
              stroke=${on ? "#dbca0f" : "#000"}
              stroke-width="0.25"
              @click=${() => {
                dispatch({ type: 'deleteConnection', index })
              }}
            />
          `)
        }

        ${drag && ['output', 'sysin'].includes(drag.targetType) && svg`
          <path
            class="connection"
            d=${connectionPath(
              connectionPointLocation(drag.targetType === 'output' ? { gate: drag.targetIndex, output: 0 } : { sysin: drag.targetIndex }),
              { x: mousePos.x / scaleX, y: mousePos.y / scaleY }
            )}
            fill="none"
            stroke="#000"
            stroke-width="0.25"
          />
        `}

        ${gates.map(({ type, x, y }, i) => svg`
          <g class="gate gate--${type}" transform="translate(${x}, ${y})">
            <defs>
              <symbol id="io" width="0.8" height="0.8" viewBox="0 0 0.8 0.8" overflow="visible">
                <g stroke="#000" stroke-width="0.1" transform="translate(-0.4, -0.4)">
                  <circle cx="0.4" cy="0.4" r="0.35" fill="#fff" />
                  <path d="M0.35 0.25 0.5 0.4 0.35 0.55" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                </g>  
              </symbol>
            </defs>
          
            <line x1="0" x2="1" y1="0" y2="0" stroke="#000" stroke-width="0.2" />
            <line x1="0" x2="1" y1="2" y2="2" stroke="#000" stroke-width="0.2" />
            <line x1="4" x2="5" y1="1" y2="1" stroke="#000" stroke-width="0.2" />
            <use xlink:href="#io" x="0" y="0" />
            <use xlink:href="#io" x="0" y="2" />
            <use
              xlink:href="#io"
              x="5"
              y="1"
              style="cursor: crosshair;"
              @mousedown=${connectionDragStart('output', i)}
            />

            <g @mousedown=${gateDragStart(i)} style="cursor: move;">
              <path
                d=${{
                  AND: "m0.875 -0.25 v2.5 h2 a1.25 1.25 0 0 0 1.25 -1.25 1.25 1.25 0 0 0 -1.25 -1.25 z",
                  NAND: "m0.875 -0.25 v2.5 h2 a1.25 1.25 0 0 0 1.25 -1.25 1.25 1.25 0 0 0 -1.25 -1.25 z",
                  OR: "m0.875 -0.25 q0.75 1.25, 0 2.5 q2.5 0, 3.25 -1.25 q-0.75 -1.25, -3.25 -1.25 z",
                  XOR: "m0.875 -0.25 q0.75 1.25, 0 2.5 q2.5 0, 3.25 -1.25 q-0.75 -1.25, -3.25 -1.25 z",
                  NOR: "m0.875 -0.25 q0.75 1.25, 0 2.5 q2.5 0, 3.25 -1.25 q-0.75 -1.25, -3.25 -1.25 z"
                }[type]}
                fill="#fff"
                stroke="#000"
                stroke-width="0.2"
                stroke-linejoin="round"
              />
              ${['XOR'].includes(type) ? svg`
                <path
                  d="m0.55 -0.25 q0.75 1.25, 0 2.5"
                  fill="none"
                  stroke="#000"
                  stroke-width="0.2"
                  stroke-linejoin="round"
                />
              ` : null}
              ${['NAND', 'NOT', 'NOR'].includes(type) ? svg`
                <circle cx="4.125" cy="1" r="0.25" fill="#fff" stroke="#000" stroke-width="0.1"/>
              ` : null}
              <text
                x="2.5"
                y="1.3"
                font-family="sans-serif"
                font-size="0.8px"
                font-weight="bold"
                text-anchor="middle"
                style="pointer-events: none; user-select: none;"
              >
                ${type}
              </text>
            </g>
          </g>
        `)}

        ${sysinValues.map((value, index) => {
          const { x, y } = connectionPointLocation({ sysin: index })
          return svg`
            <line
              class="sysinWire"
              x1=${x - 2.5}
              x2=${x}
              y1=${y}
              y2=${y}
              stroke="#000"
              stroke-width="0.25"
            />
            <circle
              class="sysinButton"
              cx=${x - 2.5}
              cy=${y}
              r="1"
              fill="blue"
              style="cursor: pointer"
              @click=${() => {
                dispatch({ type: 'setSysinValue', index, value: !value })
              }}
            />
            <g
              class="sysin"
              transform="translate(${x}, ${y})"
              @mousedown=${connectionDragStart('sysin', index)}
            >
              <path
                d="M 0 -0.7 A 0.7 0.7, 0, 1, 1, 0 0.7"
                fill="#fff"
                stroke=${value ? '#dbca0f' : '#000'}
                stroke-width="0.2"
                style="cursor: crosshair;"
              />
            </g>
          `
        })}
        ${sysoutValues.map((value, index) => {
          const { x, y } = connectionPointLocation({ sysout: index })
          return svg`
            <g class="sysout" transform="translate(${x}, ${y})">
              <path
                d="M 0 0.7 A 0.7 0.7, 0, 1, 1, 0 -0.7"
                fill="#fff"
                stroke=${value ? '#dbca0f' : '#000'}
                stroke-width="0.2"
              />
            </g>
          `
        })}
        <rect
          class="newGateBorder"
          x="3.75"
          y="1.75"
          width=${w - 7.5}
          height=${h - 3.5}
          fill="none"
          stroke="#000"
          stroke-width="0.5"
          rx="2"
        />

        ${winAnimationKey !== null ? repeat(
          [svg`
            <g
              class="newGateComplete"
              transform-origin="50% 50%"
              style="animation: levelComplete 3s ease-in-out forwards;"
            >
              <rect
                x="3.75"
                y="1.75"
                width=${w - 7.5}
                height=${h - 3.5}
                fill="#fff"
                stroke="#000"
                stroke-width="0.5"
                rx="2"
              />
              <text
                x="50%"
                y="50%"
                font-size="6"
                text-anchor="middle"
                dominant-baseline="middle"
                font-family="sans-serif"
                font-weight="bold"
                style="user-select: none;"
              >
                ${winAnimationText}
              </text>
            </g>
          `],
          () => winAnimationKey,
          elem => elem
        ) : ''
      }
      </svg>
      <div>
        ${sysinValues.map((value, index) => html`
          <button
            @click=${() => {
              dispatch({ type: 'setSysinValue', index, value: !value })
            }}
          >
            Input ${index + 1}: ${value ? 'Enabled' : 'Disabled'}
          </button>
        `)}
      </div>
      <div>
        <select .value=${level} @change=${e => { setLevel(parseInt(e.target.value, 10)) }}>
          ${levels.map(({ name }, index) => html`
            <option value=${index}>Level ${index + 1}: ${name}</option>
          `)}
        </select>
        <button @click=${() => { nextLevel() }} ?disabled=${level + 1 === levels.length}>Next level</button>
      </div>
      ${JSON.stringify(level)}
      <pre>${JSON.stringify(connections, null, 2)}</pre>
      <style>
        .electronics-grid {
          background: #eee;
          border-radius: 8px;
        }
        .connection {
          cursor: pointer;
        }

        @keyframes levelComplete {
          0% {
            opacity: 0;
            transform: scale(1);
          }
          10% {
            opacity: 1;
            transform: scale(1);
          }
          80% {
            transform: scale(1);
          }
          97% {
            opacity: 1;
            pointer-events: unset;
          }
          100% {
            transform: scale(0.3);
            opacity: 0;
            pointer-events: none;
          }
        }
      </style>
    `
  }
)

customElements.define('electronics-grid', ElectronicsGrid)