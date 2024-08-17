import { PitchDetector } from "pitchy";
import axios from 'axios';

const username = "m2HH8UNEqNLOVznPp-61xyUUvdeZUC0HPdwzq62c"
const ip = "192.168.0.178"

const turnLightOnOrOff = async (lightId, on, bri) => {
  const url = `http://${ip}/api/${username}/lights/1/state`;
  try {
      return await axios.put(url, {
          on: on,
          "bri": bri
      });
  } catch (err) {
      console.error(err);
  }
}

export default turnLightOnOrOff