import { GyroscopeAxisState } from "./gyroscope.js";

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

function makeDistortionCurve(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
};

const frequency = 60;
const stepTime = 250;

document.querySelector('.js-start').addEventListener('click', e => {

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

    const wave = context.createPeriodicWave(real, imag, {disableNormalization: true});

    const distortion = context.createWaveShaper();
    distortion.curve = makeDistortionCurve(400);
    distortion.oversample = '4x';
    distortion.connect(context.destination)

    const gainNodePrimary = context.createGain();
    gainNodePrimary.connect(distortion);
    gainNodePrimary.gain.setValueAtTime(0.5, context.currentTime);

    const occilPrimary = context.createOscillator();
    occilPrimary.setPeriodicWave(wave);
    occilPrimary.connect(gainNodePrimary);
    occilPrimary.start(0);

    const gainNodeHarmony = context.createGain();
    gainNodeHarmony.connect(context.destination);
    gainNodeHarmony.gain.setValueAtTime(0.5, context.currentTime);

    const occilHarmony = context.createOscillator();
    occilHarmony.setPeriodicWave(wave);
    occilHarmony.connect(gainNodeHarmony);
    occilHarmony.start(0);

    let count = 0;
    let noteState = 'on';
    const checkInterval = 10;
    let bpm = 120;

    setInterval(() => {
      const restPercentage = 0.1;
      const onLength = ((60 / bpm) * 1000 * (1 - restPercentage)) / checkInterval;
      const offLength = ((60 / bpm) * 1000 * restPercentage) / checkInterval;

      if (count > onLength && noteState === 'on') {
        noteState = 'off';
        count = 0;
        gainNodeHarmony.gain.setValueAtTime(0, context.currentTime);
        gainNodePrimary.gain.setValueAtTime(0, context.currentTime);
      } else if (count > offLength && noteState === 'off') {
        noteState = 'on';
        count = 0;
        gainNodeHarmony.gain.setValueAtTime(0.5, context.currentTime);
        gainNodePrimary.gain.setValueAtTime(0.5, context.currentTime);
      };

      count++;
    }, checkInterval);

    gyroscope.addEventListener('reading', e => {
      try {
        const now = new Date();
        const stepNow = now - now % stepTime;

        state.x.add(now, gyroscope.x);
        state.y.add(now, gyroscope.y);
        state.z.add(now, gyroscope.z);

        for (let [key, axis] of Object.entries(state)) {
          axis.printToHtml(document.querySelector(`.js-${key}-axis`));
        }

        bpm = 120 - state.z.cumulative / 180 * 60;
        const primaryFreq = getRatio(state.x.cumulative / 6) * 440;
        const harmonyFreq = getRatio(state.y.averageChange(stepNow, stepTime) / 2) * primaryFreq / 2;

        document.querySelector(".js-sound-primary-freq").innerHTML = primaryFreq;
        document.querySelector(".js-sound-harmony-freq").innerHTML = harmonyFreq;
        document.querySelector(".js-sound-bpm").innerHTML = bpm;

        occilPrimary.frequency.value = primaryFreq;
        occilHarmony.frequency.value = harmonyFreq;
      } catch (err) {
        printError(err);
      }
    });

    gyroscope.start();

  } catch (err) {
    printError(err);
  }


});
