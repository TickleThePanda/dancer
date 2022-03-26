import { Gyroscope } from "./motion-sensors.js";
import { GyroscopeAxisState } from "./gyroscope.js";
import { createViewer } from './viewer.js'
import { Context, PolySynth } from 'https://cdn.skypack.dev/tone';


window.addEventListener('load', e => {
  if (typeof Gyroscope !== 'function') {
    document.querySelector('.js-wrapper').innerHTML = "This does not work on your device. The gyroscope feature is not supported.";
  }
})

function log(...args) {
  let output = "<p>" + args.join(" ");
  document.querySelector(".js-log").innerHTML = output + document.querySelector(".js-log").innerHTML;
}

const ratioSteps = [
  1/1,
  32/27,
  4/3,
  3/2,
  16/9
];

function getRatio(v) {

  const stepV = Math.round(v);
  const negative = stepV < 0;
  const absV = Math.abs(stepV);
  const root = Math.floor(absV/5);
  const remainderV = absV % ratioSteps.length;

  const positiveRatio = ratioSteps[remainderV] * Math.pow(2,root);

  if (negative) {
    return 1 / positiveRatio;
  } else {
    return positiveRatio;
  }
}

function printError(err) {
  document.querySelector('.js-error').innerHTML = err.stack.replace(/\\n/, "<br>");
}

const frequency = 60;
const stepTime = 250;

document.querySelector('.js-start')
  .addEventListener('click', async e => {

  if (typeof DeviceMotionEvent.requestPermission === "function") {
    const response = await DeviceMotionEvent.requestPermission();
    if (response == "granted") {
      start();
    } else {
      printError(response);
    }
  } else {
    start();
  }

});

function start() {

  try {
    const gyroscope = new Gyroscope({frequency: frequency});

    const state = {
      x: new GyroscopeAxisState('x'),
      y: new GyroscopeAxisState('y'),
      z: new GyroscopeAxisState('z')
    };

    const context = new AudioContext();

    const real = new Float32Array(11);
    const imag = new Float32Array(11);

    imag.fill(0);

    real[0] = 0;
    real[1] = 1;
    real[2] = 0.25;
    real[3] = 0.5;
    real[4] = 0.5;
    real[5] = 0.75;
    real[6] = 0.1;
    real[7] = 0.1;
    real[8] = 0.5;
    real[9] = 0.25;
    real[10] = 0;

    const toneContext = new Context(context);
    const synth = new PolySynth({ context: toneContext, polyphony: 2 });

    const viewer = createViewer(context);
    synth.chain(viewer);
    viewer.connect(context.destination)

    let count = 0;
    let noteState = 'on';
    const checkInterval = 10;

    let stepNow = 0;
    let lastPlayed = [];

    function periodicClamp(value, {
      max, minOut, maxOut
    }) {
      const mid = (maxOut + minOut) / 2;
      const range = maxOut - minOut;

      const v = value / max * 2 * Math.PI / 4;

      return mid + Math.cos(v) * range / 2;

    }

    setInterval(() => {
      const restPercentage = periodicClamp(state.z.current, {
        max: 360 / 2,
        minOut: 0.1,
        maxOut: 0.9
      });
      const bpm = 120 + periodicClamp(state.x.current, { max: 360/8, minOut: -1, maxOut: 1 }) * 60;

      const onLength = ((60 / bpm) * 1000 * (1 - restPercentage)) / checkInterval;
      const offLength = ((60 / bpm) * 1000 * restPercentage) / checkInterval;
      const freq = getRatio(periodicClamp(state.x.current, { max: 360/8, minOut: -10, maxOut: 10 })) * 440;
      const harmonyFreq = getRatio(state.y.averageChange(stepNow, stepTime) / 2) * freq / 2;

      const debug = { count, onLength, offLength, freq, harmonyFreq, bpm, restPercentage };

      document.querySelector(".js-sound-debug").innerHTML = Object.entries(debug).map(([k, v]) => `${k}: ${v}`).join("<br>");

      if (count > onLength && noteState === 'on') {
        noteState = 'off';
        count = 0;
        synth.triggerRelease(lastPlayed);
      } else if (count > offLength && noteState === 'off') {
        noteState = 'on';
        count = 0;
        lastPlayed = [freq, harmonyFreq];
        synth.triggerAttack(lastPlayed);
      };

      count++;
    }, checkInterval);

    gyroscope.addEventListener('reading', e => {
      try {
        const now = new Date();
        stepNow = now - now % stepTime;

        state.x.add(now, gyroscope.x);
        state.y.add(now, gyroscope.y);
        state.z.add(now, gyroscope.z);

        for (let [key, axis] of Object.entries(state)) {
          axis.printToHtml(document.querySelector(`.js-${key}-axis`));
        }

      } catch (err) {
        printError(err);
      }
    });

    gyroscope.start();

  } catch (err) {
    console.error(err)
    printError(err);
  }
}
