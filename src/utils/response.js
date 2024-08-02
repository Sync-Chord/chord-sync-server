//module imports
import mute from "immutable";

const response_structure = mute.Map({
  success: null,
  action: null,
  type: null,
  message: null,
  data: null,
  status: null,
});

export default response_structure;
