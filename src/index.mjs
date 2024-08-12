import { PitchDetector } from "pitchy";
      function updatePitch(analyserNode, detector, input, sampleRate) {
        analyserNode.getFloatTimeDomainData(input);
        const [pitch, clarity] = detector.findPitch(input, sampleRate);

        document.querySelector("#pitch").textContent = `${
          Math.round(pitch * 10) / 10
        } Hz`;
        document.querySelector("#clarity").textContent = `${Math.round(
          clarity * 100
        )} %`;
        window.setTimeout(
          () => updatePitch(analyserNode, detector, input, sampleRate),
          100
        );
      }

      document.addEventListener("DOMContentLoaded", () => {
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