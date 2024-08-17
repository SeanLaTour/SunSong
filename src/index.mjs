import { PitchDetector } from "pitchy";
import turnLightOnOrOff from "./ClientAPI.js";
var globalVolume = 0;
var maryHadALittleLamb = ["E", "C", "A", "E", "C", "A"]
var globalNote = "";
var globalIndex = 0;
var lightIsOn = false;

const brightnessMap = {
  C: [10, 10, 30, 50, 70, 90, 100, 100, 100, 100],
  D: [11, 11, 31, 52.8, 72.8, 92.8, 100, 100, 100, 100],
  E: [13, 13, 33, 53, 75.7, 75.7, 95.7, 100, 100, 100, 100],
  F: [14, 14, 34, 58.4, 78.4, 98.4, 100, 100, 100, 100],
  G: [16, 16, 36, 61.2, 81.2, 91.2, 100, 100, 100, 100],
  A: [18, 18, 38, 64, 84, 94, 100, 100, 100, 100],
  B: [19, 19, 39, 66.8, 86.8, 96.8, 100, 100, 100, 100]
}

function checkForSong() {
  if(globalIndex === maryHadALittleLamb.length) {
    if(lightIsOn) {
      turnLightOnOrOff(1, false, 0)
      lightIsOn = false;
    }
    else {
      turnLightOnOrOff(1, true, 99)
      lightIsOn = true;
    }
    globalIndex = 0;
  }
  if(maryHadALittleLamb[globalIndex] === globalNote) {
    globalIndex++
    const noteDisplay = document.getElementById("next-note")
    noteDisplay.innerHTML = maryHadALittleLamb[globalIndex]
    if(maryHadALittleLamb[globalIndex] === undefined) {
      noteDisplay.innerHTML = "Start Over! | " + maryHadALittleLamb[0]
    }
  }
}

      function updatePitch(analyserNode, detector, input, sampleRate) {
        analyserNode.getFloatTimeDomainData(input);
        const [pitch, clarity] = detector.findPitch(input, sampleRate);

        if(pitch > 0) {
          const note = getNoteFromFrequency(pitch);
          // console.log(`The note for ${pitch} Hz is ${note}`);

          if(!note.includes("undefined")) {
            const letter = note[0];
            globalNote = letter;
            const position = note[note.length - 1]
            // turnLightOnOrOff(1, true, brightnessMap[letter][Number(position)])
            checkForSong()
          }
        }

        document.querySelector("#pitch").textContent = `${
          Math.round(pitch * 10) / 10
        } Hz`;
        document.querySelector("#clarity").textContent = `${Math.round(
          clarity * 100
        )} %`;
        setTimeout(() => {
          const startAudio = async () => {
            try {
              // Get user media (microphone input)
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              
              // Create an AudioContext
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              
              // Create a MediaStreamAudioSourceNode
              const source = audioContext.createMediaStreamSource(stream);
              
              // Create an AnalyserNode
              const analyser = audioContext.createAnalyser();
              analyser.fftSize = 256;
              
              // Connect the source to the analyser
              source.connect(analyser);
              
              // Create a buffer to hold the analyser data
              const bufferLength = analyser.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);
              
              // Function to calculate the volume
              function calculateVolume() {
                analyser.getByteTimeDomainData(dataArray);
                
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                  const value = dataArray[i] / 128.0 - 1.0; // Normalize the value
                  sum += value * value;
                }
                
                const rms = Math.sqrt(sum / bufferLength);
                const volume = rms * 100; // Scale to a more readable range
                
                // console.log(`Volume: ${volume.toFixed(0)}`);
                globalVolume = Math.ceil(volume)
                
                requestAnimationFrame(calculateVolume);
              }
              
              // Start calculating volume
              calculateVolume();
            } catch (error) {
              console.error('Error accessing microphone:', error);
            }
          }
          startAudio()
        }, 1000);
        window.setTimeout(
          () => updatePitch(analyserNode, detector, input, sampleRate),
          150
        );
      }

      document.addEventListener("DOMContentLoaded", () => {
        turnLightOnOrOff(1, false, 0)
        const audioContext = new window.AudioContext();
        const analyserNode = audioContext.createAnalyser();

        document
          .querySelector("#resume-button")
          .addEventListener("click", () => audioContext.resume());

        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          audioContext.createMediaStreamSource(stream).connect(analyserNode);
          const detector = PitchDetector.forFloat32Array(analyserNode.fftSize);
          const input = new Float32Array(detector.inputLength);
          updatePitch(analyserNode, detector, input, audioContext.sampleRate);
        });
      });

      
// Define base frequencies for one octave (C4 to B4)
const baseFrequencies = {
  'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63, 'F': 349.23, 'F#': 369.99,
  'G': 392.00, 'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
};

// Note names in ascending order of semitone
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// A4 frequency as the reference point
const A4Frequency = baseFrequencies['A'];

// Precompute log2(A4Frequency) to optimize performance
const log2A4Frequency = Math.log2(A4Frequency);

// Function to get the closest musical note and its octave for a given frequency
function getNoteFromFrequency(frequency) {
  // Ensure frequency is positive
  if (frequency <= 0) {
    throw new Error('Frequency must be greater than zero');
  }

  // Calculate the semitone offset from A4
  const semitoneOffset = Math.round(12 * (Math.log2(frequency) - log2A4Frequency));
  
  // Determine the closest note index
  const noteIndex = (9 + semitoneOffset + 12) % 12;
  const noteName = noteNames[noteIndex];
  
  // Calculate the octave number
  const octaveOffset = Math.floor((semitoneOffset + 9) / 12);
  let octave = 4 + octaveOffset;

  // Ensure that the octave is within the range of 1 to 8
  octave = Math.max(1, Math.min(8, octave));

  // Return the note and its octave
  return `${noteName}${octave}`;
}


